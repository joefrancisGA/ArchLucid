import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import * as http from "@/lib/api/http";
import * as operationsApi from "@/lib/api/operations-api";
import {
  acceptDraftArchitectureRequestAsync,
  draftArchitectureRequestWithPoll,
} from "@/lib/api/architecture-request-draft-async-api";
import { ADVISORY_DRAFT_IN_FLIGHT_TITLE } from "@/lib/operations/advisory-draft-in-flight";
import {
  getInFlightOperations,
  resetInFlightOperationsForTests,
} from "@/lib/operations/in-flight-operations-store";

vi.mock("@/lib/operator-static-demo/eligibility", () => ({
  isStaticDemoPayloadFallbackEnabled: () => false,
}));

const operationId = "draft:11111111-1111-1111-1111-111111111111";

describe("draftArchitectureRequestWithPoll", () => {
  beforeEach(() => {
    window.sessionStorage.clear();
    resetInFlightOperationsForTests();
  });

  afterEach(() => {
    window.sessionStorage.clear();
    resetInFlightOperationsForTests();
    vi.restoreAllMocks();
  });

  it("tracks the accepted handle before polling so the header list is visible while queued", async () => {
    vi.spyOn(http, "apiPostAcceptedWithLocation").mockResolvedValue({
      location: `/v1/operations/${operationId}`,
      status: 202,
    });

    let resolveOperation: ((value: Awaited<ReturnType<typeof operationsApi.getOperation>>) => void) | null =
      null;
    vi.spyOn(operationsApi, "getOperation").mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveOperation = resolve;
        }),
    );

    const pollPromise = draftArchitectureRequestWithPoll(
      { freeTextDescription: "Customer-facing API with private networking and EU residency." },
      { draftId: "arch-001" },
    );

    await vi.waitFor(() => {
      expect(getInFlightOperations()).toHaveLength(1);
    });

    const row = getInFlightOperations()[0];

    expect(row?.operationId).toBe(operationId);
    expect(row?.title).toBe(ADVISORY_DRAFT_IN_FLIGHT_TITLE);
    expect(row?.href).toBe("/architecture/architectures/arch-001");
    expect(row?.retainUntilConsumed).toBe(true);

    vi.spyOn(http, "apiGet").mockResolvedValue({
      suggestedConstraints: [],
      suggestedAssumptions: [],
      suggestedCapabilities: [],
    });
    resolveOperation?.({
      operationId,
      state: "Succeeded",
      stepLabel: "Suggestions ready",
      heartbeatUtc: "2026-01-01T00:00:00.000Z",
      currentStep: 4,
      totalSteps: 4,
      resultRef: null,
    });

    await pollPromise;

    expect(getInFlightOperations()).toHaveLength(1);
  });

  it("throws when async accept returns 202 without a Location operation handle", async () => {
    vi.spyOn(http, "apiPostAcceptedWithLocation").mockResolvedValue({
      location: null,
      status: 202,
    });

    await expect(
      acceptDraftArchitectureRequestAsync({
        freeTextDescription: "Customer-facing API with private networking and EU residency.",
      }),
    ).rejects.toThrow("Draft suggest accepted but no operation id was returned.");
  });
});
