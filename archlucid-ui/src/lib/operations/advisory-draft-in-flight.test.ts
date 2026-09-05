import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  getInFlightOperations,
  resetInFlightOperationsForTests,
} from "@/lib/operations/in-flight-operations-store";
import {
  ADVISORY_DRAFT_IN_FLIGHT_TITLE,
  advisoryDraftDetailHref,
  findTrackedAdvisoryDraftForArchitecture,
  isAdvisoryDraftOperationId,
  markAdvisoryDraftInFlightConsumed,
  retargetAdvisoryDraftInFlightArchitecture,
  trackAdvisoryDraftInFlight,
} from "@/lib/operations/advisory-draft-in-flight";

const staticDemo = vi.hoisted(() => ({ enabled: false }));

vi.mock("@/lib/operator-static-demo/eligibility", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/operator-static-demo/eligibility")>();

  return {
    ...actual,
    isStaticDemoPayloadFallbackEnabled: () => staticDemo.enabled,
  };
});

const operationId = "draft:11111111-1111-1111-1111-111111111111";

describe("trackAdvisoryDraftInFlight", () => {
  beforeEach(() => {
    staticDemo.enabled = false;
    window.sessionStorage.clear();
    resetInFlightOperationsForTests();
  });

  afterEach(() => {
    window.sessionStorage.clear();
    resetInFlightOperationsForTests();
  });

  it("registers Suggest from overview so leaving the draft does not hide queued work", () => {
    const trackedId = trackAdvisoryDraftInFlight({
      operationId,
      draftId: "arch-001",
    });

    expect(trackedId).toBe(operationId);

    const rows = getInFlightOperations();

    expect(rows).toHaveLength(1);
    expect(rows[0]?.title).toBe(ADVISORY_DRAFT_IN_FLIGHT_TITLE);
    expect(rows[0]?.href).toBe("/architecture/architectures/arch-001");
    expect(rows[0]?.architectureId).toBe("arch-001");
    expect(rows[0]?.retainUntilConsumed).toBe(true);
    expect(rows[0]?.stepLabel).toBe("Queued");
  });

  it("points unsaved drafts at the create-architecture route", () => {
    expect(advisoryDraftDetailHref("new")).toBe("/architecture/architectures/new");
    expect(advisoryDraftDetailHref("")).toBe("/architecture/architectures/new");
    expect(isAdvisoryDraftOperationId(operationId)).toBe(true);
    expect(isAdvisoryDraftOperationId("run:abc")).toBe(false);
  });

  it("retargets Open to the saved draft after deferred create", () => {
    trackAdvisoryDraftInFlight({
      operationId,
      draftId: "new",
    });

    retargetAdvisoryDraftInFlightArchitecture("new", "draft-001");

    const row = getInFlightOperations()[0];

    expect(row?.href).toBe("/architecture/architectures/draft-001");
    expect(row?.architectureId).toBe("draft-001");
  });

  it("finds the tracked row for this architecture", () => {
    trackAdvisoryDraftInFlight({
      operationId,
      draftId: "arch-001",
    });

    expect(findTrackedAdvisoryDraftForArchitecture("arch-001")?.operationId).toBe(operationId);
    expect(findTrackedAdvisoryDraftForArchitecture("other")).toBeNull();
  });

  it("drops a consumed row after the draft applies suggestions", () => {
    trackAdvisoryDraftInFlight({
      operationId,
      draftId: "arch-001",
    });

    markAdvisoryDraftInFlightConsumed(operationId);

    expect(getInFlightOperations()).toHaveLength(0);
  });

  it("skips demo and offline shells, where a tracked row would poll a 404 forever", () => {
    staticDemo.enabled = true;

    expect(trackAdvisoryDraftInFlight({ operationId, draftId: "arch-001" })).toBeNull();
    expect(getInFlightOperations()).toHaveLength(0);
  });

  it("ignores a missing or non-draft operation id", () => {
    expect(trackAdvisoryDraftInFlight({ operationId: "run:abc" })).toBeNull();
    expect(trackAdvisoryDraftInFlight({ operationId: "   " })).toBeNull();
    expect(getInFlightOperations()).toHaveLength(0);
  });
});
