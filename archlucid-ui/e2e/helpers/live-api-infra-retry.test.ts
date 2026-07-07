import { describe, expect, it } from "vitest";

import {
  InfraTransientError,
  infrastructureRetryDelayMs,
  isDatabaseUnavailablePayload,
  isRetryableInfrastructureFailure,
} from "./live-api-infra-retry";

describe("live-api-infra-retry", () => {
  it("detects database-unavailable problem payloads", () => {
    expect(
      isDatabaseUnavailablePayload(
        '{"title":"Database Unavailable","detail":"The database is currently unreachable."}',
      ),
    ).toBe(true);
  });

  it("treats gateway and database-unavailable responses as retryable infrastructure failures", () => {
    expect(isRetryableInfrastructureFailure(503, "Database Unavailable")).toBe(true);
    expect(isRetryableInfrastructureFailure(502, "bad gateway")).toBe(true);
    expect(isRetryableInfrastructureFailure(500, "internal server error")).toBe(false);
    expect(isRetryableInfrastructureFailure(400, "bad request")).toBe(false);
  });

  it("caps exponential infrastructure backoff with jitter headroom", () => {
    expect(infrastructureRetryDelayMs(0)).toBeGreaterThanOrEqual(1000);
    expect(infrastructureRetryDelayMs(0)).toBeLessThanOrEqual(1300);
    expect(infrastructureRetryDelayMs(10)).toBeLessThanOrEqual(10_300);
  });

  it("tags infra-transient errors for CI reporting", () => {
    const error = new InfraTransientError("commit exhausted");

    expect(error).toBeInstanceOf(InfraTransientError);
    expect(error.isInfraTransient).toBe(true);
    expect(error.name).toBe("InfraTransientError");
  });
});
