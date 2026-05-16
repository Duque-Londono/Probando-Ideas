import { Router, type Request, type Response } from "express";
import { parseUnits, type Address } from "viem";
import { x402Guard } from "../middleware/x402.js";
import { verifyPayment } from "../services/monadVerifier.js";
import { incrementReputation } from "../services/agentCredit.js";
import { generateBatch } from "../services/dataGenerator.js";
import {
  emitWorkerEvent,
  trackBatchDelivery,
  buildSnapshot,
} from "../events/telemetry.js";
import { SERVER_WALLET_ADDRESS, PAYMENT_AMOUNT } from "../config.js";

const router = Router();

/**
 * Per-worker chunk counter.
 * Maps workerId → next chunkIndex to deliver.
 * Resets when the same batchId is requested (new session).
 */
const workerChunkIndex: Map<string, number> = new Map();

/**
 * GET /api/training-data
 *
 * Full x402 payment flow:
 *   1. x402Guard middleware — issues 402 invoice or attaches txHash + workerId.
 *   2. Validates X-Batch-Id header (batchId from the invoice).
 *   3. Verifies the Monad testnet transaction (amount + recipient).
 *   4. On success: generates training data batch, tracks stats, emits telemetry.
 *   5. Fire-and-forget reputation increment on AgentCredit.sol.
 *
 * Headers required (when paying):
 *   X-Payment:  <0x_transaction_hash>
 *   X-Worker-Id: <worker_wallet_address>
 *   X-Batch-Id: <batchId_from_402_invoice>
 */
router.get("/training-data", x402Guard, async (req: Request, res: Response) => {
  // After x402Guard, these are guaranteed to exist
  const txHash = req.txHash!;
  const workerId = req.workerId!;

  const batchId = req.headers["x-batch-id"] as string | undefined;

  if (!batchId) {
    res.status(400).json({
      error: "Missing required header: X-Batch-Id (the batchId from the 402 invoice)",
    });
    return;
  }

  // Convert expected amount to wei (18 decimals for MON)
  let expectedAmountWei: bigint;
  try {
    expectedAmountWei = parseUnits(PAYMENT_AMOUNT, 18);
  } catch {
    res.status(500).json({ error: "Invalid PAYMENT_AMOUNT configuration" });
    return;
  }

  const serverWallet = SERVER_WALLET_ADDRESS as Address;

  // Verify payment on Monad testnet
  const isValid = await verifyPayment(
    txHash as `0x${string}`,
    expectedAmountWei,
    serverWallet,
  );

  if (!isValid) {
    console.warn(
      `[trainingData] Payment verification FAILED — tx: ${txHash}, worker: ${workerId}`,
    );
    res.status(403).json({
      error: "Invalid or unconfirmed payment",
      detail: "Transaction must be confirmed on Monad Testnet with correct amount and recipient",
    });
    return;
  }

  try {
    // Determine chunk index for this worker+batch session
    const chunkKey = `${workerId}:${batchId}`;
    const chunkIndex = workerChunkIndex.get(chunkKey) ?? 0;
    workerChunkIndex.set(chunkKey, chunkIndex + 1);

    // Generate mock training data batch
    const batch = generateBatch(batchId, chunkIndex);

    // Track in-memory stats
    const amountNum = parseFloat(PAYMENT_AMOUNT);
    trackBatchDelivery(workerId as Address, amountNum);

    // Fire-and-forget: increment reputation on-chain (non-blocking)
    incrementReputation(workerId as Address).then((repTxHash) => {
      if (repTxHash) {
        console.log(
          `[trainingData] Reputation tx broadcast: ${repTxHash} for worker ${workerId}`,
        );
      }
    });

    // Emit real-time telemetry event
    emitWorkerEvent({
      workerId,
      txHash,
      batchId,
      reputationDelta: 1,
      timestamp: Date.now(),
    });

    console.log(
      `[trainingData] Batch delivered — worker: ${workerId.slice(0, 10)}..., batch: ${batchId.slice(0, 8)}..., chunk: ${chunkIndex}`,
    );

    res.status(200).json({
      success: true,
      batch,
    });
  } catch (err) {
    console.error(
      `[trainingData] Internal error delivering batch: ${err instanceof Error ? err.message : String(err)}`,
    );
    res.status(500).json({ error: "Internal server error delivering data batch" });
  }
});

/**
 * GET /stats — polling fallback for dashboard clients that don't use WebSockets.
 */
router.get("/stats", (_req: Request, res: Response) => {
  res.json(buildSnapshot());
});

export default router;
