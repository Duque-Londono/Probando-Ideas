import type { DataBatch } from "../types/index.js";

/**
 * Returns a random float between 0 and 1 (inclusive of 0, exclusive of 1).
 */
function randomFloat(): number {
  return Math.random();
}

/**
 * Returns a random binary label: 0 or 1.
 */
function randomLabel(): number {
  return Math.random() < 0.5 ? 0 : 1;
}

/**
 * Creates a single mock data point with an 8-dimensional feature vector
 * and a binary classification label.
 */
function createMockDataPoint(): Record<string, unknown> {
  const featureVector: number[] = Array.from({ length: 8 }, () => randomFloat());
  return {
    featureVector,
    label: randomLabel(),
  };
}

/**
 * Generates a mock training data batch simulating a chunk of an ML dataset.
 * Each batch contains 10 data points with 8-feature vectors and binary labels.
 *
 * @param batchId - Unique batch identifier (matching the invoice batchId).
 * @param chunkIndex - Sequential chunk index within the training session.
 * @returns A complete DataBatch ready for delivery to the worker.
 */
export function generateBatch(batchId: string, chunkIndex: number): DataBatch {
  const data: Record<string, unknown>[] = Array.from(
    { length: 10 },
    () => createMockDataPoint(),
  );

  return {
    batchId,
    chunkIndex,
    totalChunks: 0, // unknown — stream continues until worker disconnects
    data,
    timestamp: Date.now(),
  };
}
