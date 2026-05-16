import "dotenv/config";

import express from "express";
import cors from "cors";
import { createServer } from "node:http";
import trainingDataRouter from "./routes/trainingData.js";
import { initTelemetry, buildSnapshot } from "./events/telemetry.js";
import {
  SERVER_PORT,
  CORS_ORIGIN,
  MONAD_RPC_URL,
  AGENT_CREDIT_CONTRACT_ADDRESS,
  SERVER_WALLET_ADDRESS,
  PAYMENT_AMOUNT,
  isContractPlaceholder,
} from "./config.js";

/** Express application instance. */
const app = express();

/** HTTP server (shared by Express and Socket.io). */
const httpServer = createServer(app);

/** Socket.io server for real-time telemetry. */
const io = initTelemetry(httpServer);

// --- Middleware ---
app.use(cors({ origin: CORS_ORIGIN }));
app.use(express.json());

// --- Routes ---
app.use("/api", trainingDataRouter);

/**
 * GET /health — simple liveness probe.
 */
app.get("/health", (_req, res) => {
  res.json({ status: "ok", timestamp: Date.now() });
});

/**
 * GET /api/stats — direct polling fallback (also available via trainingData router).
 */
app.get("/api/stats", (_req, res) => {
  res.json(buildSnapshot());
});

// --- Start server ---
httpServer.listen(SERVER_PORT, () => {
  const divider = "═".repeat(60);
  console.log(divider);
  console.log("  Monad TrainSync — x402 Orchestrator Server");
  console.log(divider);
  console.log(`  Port:              ${SERVER_PORT}`);
  console.log(`  Monad RPC:         ${MONAD_RPC_URL}`);
  console.log(`  Server Wallet:     ${SERVER_WALLET_ADDRESS}`);
  console.log(`  Payment Amount:    ${PAYMENT_AMOUNT} MON`);
  console.log(`  AgentCredit:       ${AGENT_CREDIT_CONTRACT_ADDRESS}${isContractPlaceholder ? " (PLACEHOLDER — contract calls skipped)" : ""}`);
  console.log(`  CORS:              ${CORS_ORIGIN}`);
  console.log(`  Socket.io:         ws://localhost:${SERVER_PORT}`);
  console.log(divider);
  console.log("  Ready for x402 traffic. Workers, start requesting!");
  console.log(divider);
});
