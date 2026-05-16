import type { Address, Hash } from "viem";

/**
 * x402 Payment Required invoice (HTTP 402 response body).
 * Sent to the worker when no X-Payment header is present.
 */
export interface PaymentInvoice {
  error: "Payment Required";
  batchId: string;
  amount: string;
  token: "MON";
  to: string;
  chainId: number;
  expiresAt: number;
}

/**
 * A single data batch returned to the worker after payment verification.
 * Contains mock tensor-style training data.
 */
export interface DataBatch {
  batchId: string;
  chunkIndex: number;
  totalChunks: number;
  data: Record<string, unknown>[];
  timestamp: number;
}

/**
 * Emitted via Socket.io when a worker completes a payment + receives a batch.
 */
export interface WorkerEvent {
  workerId: string;
  txHash: string;
  batchId: string;
  reputationDelta: number;
  timestamp: number;
}

/**
 * Periodic snapshot of global orchestrator state.
 * Pushed every 2 seconds to all connected dashboard clients.
 */
export interface TelemetrySnapshot {
  activeWorkers: number;
  tps: number;
  totalMONTransacted: number;
  totalBatchesDelivered: number;
  topWorkers: Array<{ address: string; score: number }>;
}

/**
 * Monad chain configuration for viem.
 */
export interface MonadChainConfig {
  id: number;
  name: string;
  rpcUrls: {
    default: {
      http: string[];
    };
  };
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
  };
}

/** Alias for viem Address type (0x-prefixed 20-byte hex). */
export type WorkerAddress = Address;

/** Alias for viem Hash type (0x-prefixed 32-byte hex). */
export type TxHash = Hash;

/**
 * Request augmentation added by x402Guard middleware.
 */
export interface AuthenticatedRequest {
  /** Transaction hash from X-Payment header. */
  txHash: TxHash;
  /** Worker wallet address from X-Worker-Id header. */
  workerId: WorkerAddress;
}
