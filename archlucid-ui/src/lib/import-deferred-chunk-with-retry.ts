const CHUNK_LOAD_ERROR_PATTERN = /Loading chunk [\w.-]+ failed/i;

export type ImportDeferredChunkWithRetryOptions = {
  readonly maxAttempts?: number;
  readonly backoffMs?: number;
};

/** True when webpack/Next failed to fetch a lazy route or dynamic-import chunk. */
export function isDeferredChunkLoadError(error: unknown): boolean {
  if (!(error instanceof Error)) {
    return false;
  }

  return error.name === "ChunkLoadError" || CHUNK_LOAD_ERROR_PATTERN.test(error.message);
}

function delay(milliseconds: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, milliseconds);
  });
}

/**
 * Retries transient dev HMR / deploy-swap chunk misses before surfacing route errors.
 * Production deploys can briefly 404 old chunk hashes while the shell HTML is still cached.
 */
export async function importDeferredChunkWithRetry<T>(
  loader: () => Promise<T>,
  options: ImportDeferredChunkWithRetryOptions = {},
): Promise<T> {
  const maxAttempts = options.maxAttempts ?? 4;
  const backoffMs = options.backoffMs ?? 400;

  let lastError: unknown = new Error("Deferred chunk import failed.");

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await loader();
    } catch (error) {
      lastError = error;

      if (!isDeferredChunkLoadError(error) || attempt === maxAttempts) {
        throw error;
      }

      await delay(backoffMs * attempt);
    }
  }

  throw lastError;
}

/** Factory for `next/dynamic` loaders that tolerate transient chunk misses. */
export function deferredChunkLoader<T>(loader: () => Promise<T>): () => Promise<T> {
  return () => importDeferredChunkWithRetry(loader);
}
