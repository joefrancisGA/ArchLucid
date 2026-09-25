import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { getArchitectureIdentity } from "@/lib/api/architecture-identity-api";
import { ApiRequestError } from "@/lib/api-request-error";
import { getOperation } from "@/lib/api/operations-api";
import {
  getInFlightOperations,
  resetInFlightOperationsForTests,
} from "@/lib/operations/in-flight-operations-store";
import { rehydrateInFlightOperationsFromArchitecture } from "@/lib/operations/rehydrate-in-flight-from-architecture";

vi.mock("@/lib/api/architecture-identity-api", () => ({
  getArchitectureIdentity: vi.fn(),
}));

vi.mock("@/lib/api/operations-api", () => ({
  getOperation: vi.fn(),
}));

vi.mock("@/lib/operator/operator-static-demo", () => ({
  isStaticDemoPayloadFallbackEnabled: () => false,
}));

describe("rehydrateInFlightOperationsFromArchitecture (DA-10)", () => {
  beforeEach(() => {
    resetInFlightOperationsForTests();
    vi.mocked(getArchitectureIdentity).mockReset();
    vi.mocked(getOperation).mockReset();
  });

  afterEach(() => {
    resetInFlightOperationsForTests();
  });

  it("restores a non-terminal child run after scope storage was cleared", async () => {
    vi.mocked(getArchitectureIdentity).mockResolvedValue({
      architectureId: "arch-1",
      displayName: "Payments",
      draftCount: 0,
      reviewCount: 1,
      createdUtc: "2026-01-01T00:00:00.000Z",
      updatedUtc: "2026-01-01T00:00:00.000Z",
      drafts: [],
      reviews: [{ runId: "run-active", createdUtc: "2026-01-01T00:00:00.000Z" }],
    });
    vi.mocked(getOperation).mockResolvedValue({
      operationId: "run:run-active",
      state: "Running",
      stepLabel: "Analyzing",
      heartbeatUtc: "2026-01-01T00:01:00.000Z",
      resultRef: { runId: "run-active", jobId: null, downloadPath: null },
    });

    const restored = await rehydrateInFlightOperationsFromArchitecture({
      architectureId: "11111111-1111-1111-1111-111111111111",
      tenantId: "tenant-a",
    });

    expect(restored).toBe(1);
    expect(getInFlightOperations()).toHaveLength(1);
    expect(getInFlightOperations()[0]?.runId).toBe("run-active");
    expect(getInFlightOperations()[0]?.architectureId).toBe("11111111-1111-1111-1111-111111111111");
  });

  it("skips terminal child operations", async () => {
    vi.mocked(getArchitectureIdentity).mockResolvedValue({
      architectureId: "arch-2",
      displayName: "Other",
      draftCount: 0,
      reviewCount: 1,
      createdUtc: "2026-01-01T00:00:00.000Z",
      updatedUtc: "2026-01-01T00:00:00.000Z",
      drafts: [],
      reviews: [{ runId: "run-done", createdUtc: "2026-01-01T00:00:00.000Z" }],
    });
    vi.mocked(getOperation).mockResolvedValue({
      operationId: "run:run-done",
      state: "Succeeded",
      stepLabel: "Complete",
      heartbeatUtc: "2026-01-01T00:02:00.000Z",
      resultRef: { runId: "run-done", jobId: null, downloadPath: null },
    });

    const restored = await rehydrateInFlightOperationsFromArchitecture({
      architectureId: "22222222-2222-2222-2222-222222222222",
      tenantId: "tenant-b",
    });

    expect(restored).toBe(0);
    expect(getInFlightOperations()).toHaveLength(0);
  });

  it("skips non-UUID continuity ids without probing the identity API", async () => {
    const restored = await rehydrateInFlightOperationsFromArchitecture({
      architectureId: "customer-intake-modernization",
    });

    expect(restored).toBe(0);
    expect(getArchitectureIdentity).not.toHaveBeenCalled();
  });

  it("skips a missing architecture identity", async () => {
    vi.mocked(getArchitectureIdentity).mockRejectedValue(
      new ApiRequestError("Not Found", {
        problem: null,
        correlationId: null,
        httpStatus: 404,
      }),
    );

    const restored = await rehydrateInFlightOperationsFromArchitecture({
      architectureId: "33333333-3333-3333-3333-333333333333",
    });

    expect(restored).toBe(0);
  });

  it("rethrows non-404 identity failures", async () => {
    const error = new ApiRequestError("Service unavailable", {
      problem: null,
      correlationId: null,
      httpStatus: 503,
    });
    vi.mocked(getArchitectureIdentity).mockRejectedValue(error);

    await expect(
      rehydrateInFlightOperationsFromArchitecture({
        architectureId: "44444444-4444-4444-4444-444444444444",
      }),
    ).rejects.toBe(error);
  });
});
