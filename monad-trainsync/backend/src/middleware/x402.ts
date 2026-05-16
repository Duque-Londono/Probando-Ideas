import type { Request, Response, NextFunction } from "express";
import { v4 as uuidv4 } from "uuid";
import type { PaymentInvoice } from "../types/index.js";
import { PAYMENT_AMOUNT, SERVER_WALLET_ADDRESS, monadChain } from "../config.js";

/**
 * Augment Express Request to carry authentication details set by this middleware.
 */
declare global {
  namespace Express {
    interface Request {
      txHash?: string;
      workerId?: string;
    }
  }
}

/**
 * x402 Payment Guard middleware.
 *
 * Implements the HTTP 402 Payment Required flow:
 *   1. If the X-Payment header is missing → return 402 with a PaymentInvoice.
 *   2. If the X-Payment header is present → attach txHash and workerId to req, then next().
 *
 * Also extracts X-Worker-Id header (required with payment).
 * If X-Worker-Id is missing when X-Payment is provided, generates a warning
 * but does not block the request.
 *
 * @param req  — Express request object.
 * @param res  — Express response object.
 * @param next — Express next function.
 */
export function x402Guard(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const txHash = req.headers["x-payment"] as string | undefined;
  let workerId = req.headers["x-worker-id"] as string | undefined;

  // No payment header → issue a 402 invoice
  if (!txHash) {
    const batchId = uuidv4();
    const invoice: PaymentInvoice = {
      error: "Payment Required",
      batchId,
      amount: PAYMENT_AMOUNT,
      token: "MON",
      to: SERVER_WALLET_ADDRESS,
      chainId: monadChain.id,
      expiresAt: Math.floor(Date.now() / 1000) + 60, // 60-second expiry
    };

    console.log(`[x402] 402 issued — batchId: ${batchId}`);
    res.status(402).json(invoice);
    return;
  }

  // Validate txHash format — must be 0x-prefixed hex
  if (!txHash.startsWith("0x") || txHash.length !== 66) {
    res.status(400).json({
      error: "Invalid X-Payment header — expected 0x-prefixed 66-char hex transaction hash",
    });
    return;
  }

  // Worker ID: required with payment, fallback to generated
  if (!workerId) {
    console.warn("[x402] X-Worker-Id header missing, generating fallback");
    workerId = `worker-${uuidv4().slice(0, 8)}`;
  }

  if (!workerId.startsWith("0x") || workerId.length !== 42) {
    console.warn(`[x402] X-Worker-Id "${workerId}" is not a valid address — proceeding anyway`);
  }

  // Attach to request for downstream handlers
  req.txHash = txHash;
  req.workerId = workerId;

  next();
}
