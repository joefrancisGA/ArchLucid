import { describe, expect, it } from "vitest";

import {
  diagramReconcileMutationsAllowed,
  isDiagramReconcileRunIdInputValid,
  resolveDiagramReconcileSealedReviewRecordFromSummary,
} from "@/lib/infra-evidence/diagram-reconcile-sealed-review-record";
import type { RunSummary } from "@/types/authority";

const RUN_ID = "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee";

describe("diagram-reconcile-sealed-review-record", () => {
  it("treats sealed manifests as mutation-ready", () => {
    const state = resolveDiagramReconcileSealedReviewRecordFromSummary({
      runId: RUN_ID,
      summary: {
        runId: RUN_ID,
        projectId: "project",
        createdUtc: "2026-01-01T00:00:00Z",
        displayName: "Claims intake modernization",
        hasGoldenManifest: true,
        completedUtc: "2026-01-02T00:00:00Z",
      } as RunSummary,
      failure: null,
      blockedReason: null,
      isLoading: false,
    });

    expect(state.kind).toBe("loaded");
    if (state.kind === "loaded") {
      expect(state.isSealed).toBe(true);
      expect(state.reviewTitle).toBe("Claims intake modernization");
      expect(diagramReconcileMutationsAllowed(state)).toBe(true);
    }
  });

  it("blocks mutations for draft review records", () => {
    const state = resolveDiagramReconcileSealedReviewRecordFromSummary({
      runId: RUN_ID,
      summary: {
        runId: RUN_ID,
        projectId: "project",
        createdUtc: "2026-01-01T00:00:00Z",
        hasGoldenManifest: false,
      } as RunSummary,
      failure: null,
      blockedReason: null,
      isLoading: false,
    });

    expect(state.kind).toBe("loaded");
    if (state.kind === "loaded") {
      expect(state.isSealed).toBe(false);
      expect(diagramReconcileMutationsAllowed(state)).toBe(false);
    }
  });

  it("validates uuid-like run ids", () => {
    expect(isDiagramReconcileRunIdInputValid(RUN_ID)).toBe(true);
    expect(isDiagramReconcileRunIdInputValid("not-a-guid")).toBe(false);
  });
});
