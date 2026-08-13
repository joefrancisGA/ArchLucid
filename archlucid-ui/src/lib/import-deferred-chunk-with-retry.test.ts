import { afterEach, describe, expect, it, vi } from "vitest";

import {
  deferredChunkLoader,
  importDeferredChunkWithRetry,
  isDeferredChunkLoadError,
} from "@/lib/import-deferred-chunk-with-retry";

describe("import-deferred-chunk-with-retry", () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("detects ChunkLoadError and loading-chunk message failures", () => {
    expect(isDeferredChunkLoadError(new Error("Loading chunk foo failed."))).toBe(true);
    expect(isDeferredChunkLoadError(Object.assign(new Error("missing"), { name: "ChunkLoadError" }))).toBe(
      true,
    );
    expect(isDeferredChunkLoadError(new Error("network timeout"))).toBe(false);
  });

  it("retries transient chunk misses before succeeding", async () => {
    vi.useFakeTimers();

    const loader = vi
      .fn<() => Promise<{ value: string }>>()
      .mockRejectedValueOnce(Object.assign(new Error("Loading chunk drawer failed."), { name: "ChunkLoadError" }))
      .mockResolvedValueOnce({ value: "ok" });

    const pending = importDeferredChunkWithRetry(loader, { backoffMs: 100, maxAttempts: 3 });

    await vi.advanceTimersByTimeAsync(100);

    await expect(pending).resolves.toEqual({ value: "ok" });
    expect(loader).toHaveBeenCalledTimes(2);
  });

  it("rethrows non-chunk errors immediately", async () => {
    const loader = vi.fn().mockRejectedValue(new Error("syntax error"));

    await expect(importDeferredChunkWithRetry(loader)).rejects.toThrow("syntax error");
    expect(loader).toHaveBeenCalledTimes(1);
  });

  it("wraps loaders for next/dynamic", async () => {
    const loader = deferredChunkLoader(() => Promise.resolve("module"));

    await expect(loader()).resolves.toBe("module");
  });
});
