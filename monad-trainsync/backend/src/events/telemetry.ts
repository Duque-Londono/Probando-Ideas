import type { Server as HttpServer } from "node:http";
import { Server as SocketIOServer } from "socket.io";
import type { WorkerEvent, TelemetrySnapshot, WorkerAddress } from "../types/index.js";

let io: SocketIOServer | null = null;

/**
 * In-memory worker registry: tracks per-worker batch counts for reputation scoring.
 */
const workerBatchCount: Map<string, number> = new Map();

/** Global counters for telemetry snapshots. */
let totalBatchesDelivered = 0;
let totalMONTransacted = 0;
let recentEvents: WorkerEvent[] = [];

/** TPS tracking — events in the last 10 seconds. */
const eventTimestamps: number[] = [];

/**
 * Initializes the Socket.io server attached to the given HTTP server.
 * Sets up the "dashboard" room and periodic snapshot broadcasting.
 *
 * @param server - The Node.js HTTP server instance.
 * @returns The configured SocketIO Server instance.
 */
export function initTelemetry(server: HttpServer): SocketIOServer {
  io = new SocketIOServer(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
  });

  io.on("connection", (socket) => {
    console.log(`[telemetry] Dashboard client connected: ${socket.id}`);
    socket.join("dashboard");
    socket.on("disconnect", () => {
      console.log(`[telemetry] Dashboard client disconnected: ${socket.id}`);
    });
  });

  // Periodic snapshot broadcast every 2 seconds
  setInterval(() => {
    broadcastSnapshot(buildSnapshot());
  }, 2_000);

  console.log("[telemetry] Socket.io initialized — broadcasting every 2s");
  return io;
}

/**
 * Emits a single WorkerEvent to all dashboard clients in real time.
 *
 * @param event - The worker event to broadcast.
 */
export function emitWorkerEvent(event: WorkerEvent): void {
  if (!io) {
    console.warn("[telemetry] Socket.io not initialized — cannot emit event");
    return;
  }

  io.to("dashboard").emit("telemetry:worker_event", event);

  // Track for TPS calculation
  eventTimestamps.push(Date.now());
  // Prune timestamps older than 10 seconds
  const cutoff = Date.now() - 10_000;
  while (eventTimestamps.length > 0 && (eventTimestamps[0] ?? 0) < cutoff) {
    eventTimestamps.shift();
  }

  // Track recent events for top workers (keep last 100)
  recentEvents.push(event);
  if (recentEvents.length > 100) {
    recentEvents = recentEvents.slice(-100);
  }
}

/**
 * Registers a batch delivery for a worker, updating in-memory counters.
 *
 * @param workerId - The worker's wallet address.
 * @param amountMON - The amount of MON transacted in this payment.
 */
export function trackBatchDelivery(
  workerId: WorkerAddress,
  amountMON: number,
): void {
  const current = workerBatchCount.get(workerId) ?? 0;
  workerBatchCount.set(workerId, current + 1);
  totalBatchesDelivered++;
  totalMONTransacted += amountMON;
}

/**
 * Returns a snapshot of current global telemetry state.
 * Can be used for polling (GET /api/stats) or internal use.
 *
 * @returns Current TelemetrySnapshot.
 */
export function buildSnapshot(): TelemetrySnapshot {
  // Calculate TPS: events in last 10 seconds / 10
  const tps =
    eventTimestamps.length > 0
      ? eventTimestamps.length / 10
      : 0;

  // Compute top workers by batch count
  const topWorkers: Array<{ address: string; score: number }> = Array.from(
    workerBatchCount.entries(),
  )
    .map(([address, score]) => ({ address, score }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 10);

  return {
    activeWorkers: workerBatchCount.size,
    tps: Math.round(tps * 100) / 100,
    totalMONTransacted: Math.round(totalMONTransacted * 1_000_000) / 1_000_000,
    totalBatchesDelivered,
    topWorkers,
  };
}

/**
 * Broadcasts a TelemetrySnapshot to all dashboard clients.
 *
 * @param snapshot - The snapshot to broadcast.
 */
export function broadcastSnapshot(snapshot: TelemetrySnapshot): void {
  if (!io) return;
  io.to("dashboard").emit("telemetry:snapshot", snapshot);
}

/**
 * Resets all in-memory telemetry state (useful for testing).
 */
export function resetTelemetry(): void {
  workerBatchCount.clear();
  totalBatchesDelivered = 0;
  totalMONTransacted = 0;
  recentEvents = [];
  eventTimestamps.length = 0;
}
