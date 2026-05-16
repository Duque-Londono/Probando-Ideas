import {
  createWalletClient,
  createPublicClient,
  http,
  type Address,
  parseAbiItem,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import {
  monadChain,
  SERVER_WALLET_PRIVATE_KEY,
  AGENT_CREDIT_CONTRACT_ADDRESS,
  isContractPlaceholder,
} from "../config.js";

/** viem wallet client for signing AgentCredit.sol transactions. */
const walletClient = createWalletClient({
  account: privateKeyToAccount(SERVER_WALLET_PRIVATE_KEY as `0x${string}`),
  chain: monadChain,
  transport: http(monadChain.rpcUrls.default.http[0], {
    timeout: 5_000,
  }),
});

/** viem public client for reading contract state (optional, for future use). */
const publicClient = createPublicClient({
  chain: monadChain,
  transport: http(monadChain.rpcUrls.default.http[0], {
    timeout: 5_000,
  }),
});

/**
 * ABI fragment for AgentCredit.sol addReputation(address worker) function.
 *
 * Contract expected signature (from Dev 1):
 *   function addReputation(address worker) external onlyOwner
 *
 * This ABI allows viem to encode the function call correctly.
 */
const addReputationAbi = parseAbiItem(
  "function addReputation(address worker)",
);

/**
 * Calls AgentCredit.sol on-chain to increment a worker's reputation score.
 *
 * This function is designed to be called in a fire-and-forget manner
 * — the caller does NOT await the result; only logging is performed.
 * If the contract address is still a placeholder, the call is skipped.
 *
 * @param workerAddress - The worker's wallet address to reward reputation.
 * @returns The transaction hash on success, `null` on failure or if skipped.
 */
export async function incrementReputation(
  workerAddress: Address,
): Promise<string | null> {
  if (isContractPlaceholder) {
    console.warn(
      "[agentCredit] Skipping reputation update — AGENT_CREDIT_CONTRACT_ADDRESS is placeholder",
    );
    return null;
  }

  try {
    const hash = await Promise.race([
      walletClient.writeContract({
        address: AGENT_CREDIT_CONTRACT_ADDRESS as Address,
        abi: [addReputationAbi],
        functionName: "addReputation",
        args: [workerAddress],
      }),
      new Promise<never>((_, reject) =>
        setTimeout(
          () => reject(new Error("Contract call timeout")),
          10_000,
        ),
      ),
    ]);

    console.log(
      `[agentCredit] Reputation incremented for worker ${workerAddress} — tx: ${hash}`,
    );
    return hash;
  } catch (err) {
    console.warn(
      `[agentCredit] Failed to increment reputation for ${workerAddress}: ${err instanceof Error ? err.message : String(err)}`,
    );
    return null;
  }
}
