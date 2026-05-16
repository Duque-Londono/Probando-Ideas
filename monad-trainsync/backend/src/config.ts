import "dotenv/config";
import type { MonadChainConfig } from "./types/index.js";

/**
 * Throws a descriptive error if a required env var is missing at startup.
 */
function requireEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`[CONFIG] Missing required environment variable: ${key}`);
  }
  return value;
}

/** Monad Testnet RPC URL (HTTP). */
export const MONAD_RPC_URL: string = requireEnv("MONAD_RPC_URL");

/** Server wallet private key for on-chain calls to AgentCredit.sol. */
export const SERVER_WALLET_PRIVATE_KEY: string = requireEnv("SERVER_WALLET_PRIVATE_KEY");

/** Server wallet public address — receives x402 payments. */
export const SERVER_WALLET_ADDRESS: string = requireEnv("SERVER_WALLET_ADDRESS");

/** AgentCredit contract address (may be placeholder if not yet deployed). */
export const AGENT_CREDIT_CONTRACT_ADDRESS: string = requireEnv("AGENT_CREDIT_CONTRACT_ADDRESS");

/** Payment amount in MON per data batch. */
export const PAYMENT_AMOUNT: string = requireEnv("PAYMENT_AMOUNT");

/** HTTP server port. */
export const SERVER_PORT: number = parseInt(process.env["SERVER_PORT"] ?? "3001", 10);

/** CORS origin string. */
export const CORS_ORIGIN: string = process.env["CORS_ORIGIN"] ?? "*";

/** Monad Testnet chain configuration for viem. */
export const monadChain: MonadChainConfig = {
  id: 10143,
  name: "Monad Testnet",
  rpcUrls: {
    default: {
      http: [MONAD_RPC_URL],
    },
  },
  nativeCurrency: {
    name: "MON",
    symbol: "MON",
    decimals: 18,
  },
};

/** Placeholder marker — true when contract address is not yet deployed. */
export const isContractPlaceholder: boolean =
  AGENT_CREDIT_CONTRACT_ADDRESS === "0x_PLACEHOLDER";
