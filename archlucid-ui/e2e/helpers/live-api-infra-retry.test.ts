import { describe, expect, it } from "vitest";

import {
  getMaxCommitInfrastructureMutationAttempts,
  getMaxInfrastructureMutationAttempts,
  InfraTransientError,
  infrastructureRetryDelayMs,
  isDatabaseUnavailablePayload,
  isRetryableInfrastructureFailure,
  resolveInfrastructureMutationMaxAttempts,
} from "./live-api-infra-retry";

describe("live-api-infra-retry", () => {
  it("detects database-unavailable problem payloads", () => {
    expect(
      isDatabaseUnavailablePayload(
        '{"title":"Database Unavailable","type":"https://archlucid.example.org/errors#database-unavailable"}',
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
    expect(infrastructureRetryDelayMs(0)).toBeLessThanOrEqual(1400);
    expect(infrastructureRetryDelayMs(10)).toBeLessThanOrEqual(10_400);
  });

  it("allocates a higher commit retry budget than create/execute mutations", () => {
    expect(getMaxCommitInfrastructureMutationAttempts()).toBeGreaterThan(getMaxInfrastructureMutationAttempts());
  });

  it("extends retry budget for database-unavailable payloads", () => {
    const body = '{"type":"https://archlucid.example.org/errors#database-unavailable"}';

    expect(resolveInfrastructureMutationMaxAttempts(503, body, getMaxInfrastructureMutationAttempts())).toBe(
      getMaxCommitInfrastructureMutationAttempts(),
    );
  });

  it("tags infra-transient errors for CI reporting", () => {
    const error = new InfraTransientError("commit exhausted");

    expect(error).toBeInstanceOf(InfraTransientError);
    expect(error.isInfraTransient).toBe(true);
    expect(error.name).toBe("InfraTransientError");
  });
});
