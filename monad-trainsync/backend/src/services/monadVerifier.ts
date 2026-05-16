import {
  createPublicClient,
  http,
  type Address,
  type Hash,
} from "viem";
import { monadChain } from "../config.js";

/** viem public client connected to Monad Testnet. */
const publicClient = createPublicClient({
  chain: monadChain,
  transport: http(monadChain.rpcUrls.default.http[0], {
    timeout: 5_000,
  }),
});

/** Number of retry attempts on RPC failure. */
const RETRY_ATTEMPTS = 3;

/** Delay between retries in milliseconds. */
const RETRY_DELAY_MS = 500;

/**
 * Shorthand: sleep for a given number of milliseconds.
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Verifies a Monad Testnet transaction by checking the receipt status
 * and confirming the transaction's `to` address and `value` match expectations.
 *
 * Implements up to 3 retries with 500ms delay on RPC errors.
 * Returns false on any failure rather than throwing — the server must stay alive.
 *
 * @param txHash - The transaction hash from the worker's X-Payment header.
 * @param expectedAmount - The minimum MON amount in wei (as bigint) the worker must pay.
 * @param expectedTo - The server wallet address the payment must be sent to.
 * @returns `true` if the tx is confirmed, successful, and meets amount/recipient checks.
 */
export async function verifyPayment(
  txHash: Hash,
  expectedAmount: bigint,
  expectedTo: Address,
): Promise<boolean> {
  for (let attempt = 1; attempt <= RETRY_ATTEMPTS; attempt++) {
    try {
      // Race both RPC calls against a 5-second timeout individually
      const receipt = await Promise.race([
        publicClient.getTransactionReceipt({ hash: txHash }),
        new Promise<null>((_, reject) =>
          setTimeout(() => reject(new Error("RPC timeout")), 5_000),
        ),
      ]);

      if (!receipt) {
        console.warn(
          `[monadVerifier] No receipt for tx ${txHash} (attempt ${attempt}/${RETRY_ATTEMPTS})`,
        );
        if (attempt < RETRY_ATTEMPTS) {
          await sleep(RETRY_DELAY_MS);
          continue;
        }
        return false;
      }

      if (receipt.status !== "success") {
        console.warn(`[monadVerifier] Tx ${txHash} status is not success`);
        return false;
      }

      const tx = await Promise.race([
        publicClient.getTransaction({ hash: txHash }),
        new Promise<null>((_, reject) =>
          setTimeout(() => reject(new Error("RPC timeout")), 5_000),
        ),
      ]);

      if (!tx) {
        console.warn(`[monadVerifier] No tx found for hash ${txHash}`);
        return false;
      }

      const toMatch =
        tx.to?.toLowerCase() === expectedTo.toLowerCase();
      const valueMatch = tx.value >= expectedAmount;

      if (!toMatch) {
        console.warn(
          `[monadVerifier] Recipient mismatch — expected ${expectedTo}, got ${tx.to}`,
        );
      }
      if (!valueMatch) {
        console.warn(
          `[monadVerifier] Amount too low — expected >=${expectedAmount}, got ${tx.value}`,
        );
      }

      return toMatch && valueMatch;
    } catch (err) {
      console.warn(
        `[monadVerifier] RPC error on attempt ${attempt}/${RETRY_ATTEMPTS}: ${err instanceof Error ? err.message : String(err)}`,
      );
      if (attempt < RETRY_ATTEMPTS) {
        await sleep(RETRY_DELAY_MS);
      }
    }
  }

  return false;
}
