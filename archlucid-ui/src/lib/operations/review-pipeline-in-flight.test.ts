import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  getInFlightOperations,
  resetInFlightOperationsForTests,
  trackInFlightOperation,
} from "@/lib/operations/in-flight-operations-store";
import {
  REVIEW_PIPELINE_IN_FLIGHT_TITLE,
  restartReviewPipelineInFlight,
  reviewPipelineDetailHref,
  reviewPipelineOperationId,
  trackReviewPipelineInFlight,
} from "@/lib/operations/review-pipeline-in-flight";

const staticDemo = vi.hoisted(() => ({ enabled: false }));

vi.mock("@/lib/operator-static-demo/eligibility", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/operator-static-demo/eligibility")>();

  return {
    ...actual,
    isStaticDemoPayloadFallbackEnabled: () => staticDemo.enabled,
  };
});

describe("trackReviewPipelineInFlight", () => {
  beforeEach(() => {
    staticDemo.enabled = false;
    window.sessionStorage.clear();
    resetInFlightOperationsForTests();
  });

  afterEach(() => {
    window.sessionStorage.clear();
    resetInFlightOperationsForTests();
  });

  it("registers a created review so leaving the wizard does not lose the running analysis", () => {
    const operationId = trackReviewPipelineInFlight("abc-123");

    expect(operationId).toBe("run:abc-123");

    const rows = getInFlightOperations();

    expect(rows).toHaveLength(1);
    expect(rows[0]?.title).toBe(REVIEW_PIPELINE_IN_FLIGHT_TITLE);
    expect(rows[0]?.href).toBe("/architecture/reviews/abc-123");
    expect(rows[0]?.runId).toBe("abc-123");
    expect(rows[0]?.state).toBe("Pending");
  });

  it("uses the server's run handle so the shell poller can resolve review status", () => {
    // OperationIdCodec.RunPrefix — GET /v1/operations/run:{runId} projects the run itself.
    expect(reviewPipelineOperationId(" abc-123 ")).toBe("run:abc-123");
  });

  it("encodes the run id in the detail href", () => {
    expect(reviewPipelineDetailHref("a b/c")).toBe("/architecture/reviews/a%20b%2Fc");
  });

  it("is idempotent, so a resubmitted wizard does not stack duplicate rows", () => {
    trackReviewPipelineInFlight("abc-123");
    trackReviewPipelineInFlight("abc-123");

    expect(getInFlightOperations()).toHaveLength(1);
  });

  it("skips demo and offline shells, where a tracked row would poll a 404 forever", () => {
    staticDemo.enabled = true;

    expect(trackReviewPipelineInFlight("abc-123")).toBeNull();
    expect(getInFlightOperations()).toHaveLength(0);
  });

  it("ignores a missing or blank run id", () => {
    expect(trackReviewPipelineInFlight(null)).toBeNull();
    expect(trackReviewPipelineInFlight(undefined)).toBeNull();
    expect(trackReviewPipelineInFlight("   ")).toBeNull();
    expect(getInFlightOperations()).toHaveLength(0);
  });
});

describe("restartReviewPipelineInFlight", () => {
  beforeEach(() => {
    staticDemo.enabled = false;
    window.sessionStorage.clear();
    resetInFlightOperationsForTests();
  });

  afterEach(() => {
    window.sessionStorage.clear();
    resetInFlightOperationsForTests();
  });

  it("replaces a terminal row with a fresh pending attempt clock", () => {
    const staleStartedAtMs = Date.parse("2026-01-01T00:00:00.000Z");
    const restartedAtMs = Date.parse("2026-01-01T12:00:00.000Z");

    trackInFlightOperation({
      operationId: "run:abc-123",
      title: REVIEW_PIPELINE_IN_FLIGHT_TITLE,
      href: "/architecture/reviews/abc-123",
      runId: "abc-123",
      stepLabel: "Agent execution failed",
      state: "Failed",
      startedAtMs: staleStartedAtMs,
      heartbeatUtc: "2026-01-01T00:00:00.000Z",
    });

    restartReviewPipelineInFlight("abc-123", restartedAtMs);

    const rows = getInFlightOperations();

    expect(rows).toHaveLength(1);
    expect(rows[0]?.state).toBe("Pending");
    expect(rows[0]?.stepLabel).toBe("Queued");
    expect(rows[0]?.startedAtMs).toBe(restartedAtMs);
    expect(rows[0]?.heartbeatUtc).toBeNull();
  });
});
