import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { getArchitectureIdentity } from "@/lib/api/architecture-identity-api";
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
      architectureId: "arch-1",
      tenantId: "tenant-a",
    });

    expect(restored).toBe(1);
    expect(getInFlightOperations()).toHaveLength(1);
    expect(getInFlightOperations()[0]?.runId).toBe("run-active");
  });

  it("ignores terminal operations from another architecture's child list", async () => {
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
      architectureId: "arch-2",
      tenantId: "tenant-b",
    });

    expect(restored).toBe(0);
    expect(getInFlightOperations()).toHaveLength(0);
  });
});
