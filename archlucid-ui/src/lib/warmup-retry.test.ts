import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  WARMUP_MAX_ATTEMPTS,
  delayForWarmupRetry,
  fetchWithWarmupRetry,
  isWarmupRetryableHttpResponse,
  isWarmupRetryableProxyConfigProblem,
  isWarmupRetryableTransportError,
  warmupRetryDelayMs,
} from "@/lib/warmup-retry";

describe("warmup-retry", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("classifies retryable warmup statuses", () => {
    expect(isWarmupRetryableHttpResponse(502, "{}")).toBe(true);
    expect(isWarmupRetryableHttpResponse(503, '{"title":"Service Unavailable"}')).toBe(true);
    expect(isWarmupRetryableHttpResponse(503, '{"title":"Invalid upstream API configuration"}')).toBe(
      false,
    );
    expect(isWarmupRetryableHttpResponse(500, "{}")).toBe(false);
    expect(isWarmupRetryableProxyConfigProblem('{"title":"Invalid upstream API configuration"}')).toBe(
      true,
    );
  });

  it("uses short linear backoff delays", () => {
    expect(warmupRetryDelayMs(0)).toBe(400);
    expect(warmupRetryDelayMs(1)).toBe(800);
  });

  it("retries brief 502 then returns 200 without surfacing intermediate failure", async () => {
    const fetchOnce = vi
      .fn()
      .mockResolvedValueOnce(new Response('{"title":"Upstream API unreachable"}', { status: 502 }))
      .mockResolvedValueOnce(new Response("{}", { status: 200 }));

    const pending = fetchWithWarmupRetry(fetchOnce);
    await vi.runAllTimersAsync();
    const response = await pending;

    expect(response.status).toBe(200);
    expect(fetchOnce).toHaveBeenCalledTimes(2);
  });

  it("returns sustained 502 after retries exhaust", async () => {
    const fetchOnce = vi.fn().mockImplementation(
      () => Promise.resolve(new Response("still down", { status: 502 })),
    );

    const pending = fetchWithWarmupRetry(fetchOnce);
    await vi.runAllTimersAsync();
    const response = await pending;

    expect(response.status).toBe(502);
    expect(fetchOnce).toHaveBeenCalledTimes(WARMUP_MAX_ATTEMPTS);
  });

  it("does not retry proxy misconfiguration 503", async () => {
    const fetchOnce = vi.fn().mockResolvedValue(
      new Response('{"title":"Invalid upstream API configuration"}', { status: 503 }),
    );

    const response = await fetchWithWarmupRetry(fetchOnce);

    expect(response.status).toBe(503);
    expect(fetchOnce).toHaveBeenCalledTimes(1);
  });

  it("retries transport failures before succeeding", async () => {
    const fetchOnce = vi
      .fn()
      .mockRejectedValueOnce(new Error("fetch failed"))
      .mockResolvedValueOnce(new Response("{}", { status: 200 }));

    const pending = fetchWithWarmupRetry(fetchOnce);
    await vi.runAllTimersAsync();
    const response = await pending;

    expect(response.status).toBe(200);
    expect(fetchOnce).toHaveBeenCalledTimes(2);
  });

  it("does not retry AbortError / proxy timeout transport failures", async () => {
    const abortError = new Error("The operation was aborted due to timeout");
    abortError.name = "AbortError";
    const fetchOnce = vi.fn().mockRejectedValue(abortError);

    await expect(fetchWithWarmupRetry(fetchOnce)).rejects.toThrow(/aborted due to timeout/i);
    expect(fetchOnce).toHaveBeenCalledTimes(1);
    expect(isWarmupRetryableTransportError(abortError)).toBe(false);
  });

  it("delayForWarmupRetry waits the configured interval", async () => {
    const pending = delayForWarmupRetry(1);
    await vi.advanceTimersByTimeAsync(799);
    let settled = false;
    void pending.then(() => {
      settled = true;
    });
    await Promise.resolve();
    expect(settled).toBe(false);
    await vi.advanceTimersByTimeAsync(1);
    await pending;
    expect(settled).toBe(true);
  });
});
