import { describe, expect, it } from "vitest";

import type { GraphViewModel } from "@/types/graph";
import {
  isSampleGraphActive,
  isShowcaseDemoRunId,
  resolveGraphReviewPickerState,
  shouldShowGraphIdleCard,
} from "@/lib/graph-page-state";
import { SHOWCASE_STATIC_DEMO_RUN_ID } from "@/lib/showcase-static-demo";

const SAMPLE_GRAPH: GraphViewModel = {
  nodes: [{ id: "n1", label: "Finding", type: "Finding" }],
  edges: [],
};

describe("graph-page-state", () => {
  it("does not show idle card when a graph is already rendered", () => {
    expect(
      shouldShowGraphIdleCard({
        effectiveGraph: SAMPLE_GRAPH,
        loading: false,
        loadFailure: null,
        malformedMessage: null,
        buyerGraphAwaitingSelection: true,
        buyerTraceWithoutGraph: false,
        reviewsListLoadError: false,
      }),
    ).toBe(false);
  });

  it("shows idle card when awaiting selection and no graph is rendered", () => {
    expect(
      shouldShowGraphIdleCard({
        effectiveGraph: null,
        loading: false,
        loadFailure: null,
        malformedMessage: null,
        buyerGraphAwaitingSelection: true,
        buyerTraceWithoutGraph: false,
        reviewsListLoadError: false,
      }),
    ).toBe(true);
  });

  it("detects showcase sample review ids", () => {
    expect(isShowcaseDemoRunId(SHOWCASE_STATIC_DEMO_RUN_ID)).toBe(true);
    expect(isShowcaseDemoRunId("claims-intake-modernization")).toBe(true);
    expect(isShowcaseDemoRunId("real-review-123")).toBe(false);
  });

  it("marks sample graph mode for showcase runs and static fallback graphs", () => {
    expect(
      isSampleGraphActive({
        runId: SHOWCASE_STATIC_DEMO_RUN_ID,
        graph: null,
        seededProvenanceGraphVm: SAMPLE_GRAPH,
      }),
    ).toBe(true);

    expect(
      isSampleGraphActive({
        runId: "real-review-123",
        graph: null,
        seededProvenanceGraphVm: SAMPLE_GRAPH,
      }),
    ).toBe(true);
  });

  it("resolves picker states for loading, empty, sample, and real reviews", () => {
    expect(
      resolveGraphReviewPickerState(
        { loadError: false, loading: true, packageCount: 0, usingSyntheticSample: false },
        "",
      ),
    ).toBe("loading");

    expect(
      resolveGraphReviewPickerState(
        { loadError: false, loading: false, packageCount: 0, usingSyntheticSample: false },
        "",
      ),
    ).toBe("no-packages");

    expect(
      resolveGraphReviewPickerState(
        { loadError: false, loading: false, packageCount: 0, usingSyntheticSample: true },
        SHOWCASE_STATIC_DEMO_RUN_ID,
      ),
    ).toBe("sample-review");

    expect(
      resolveGraphReviewPickerState(
        { loadError: false, loading: false, packageCount: 2, usingSyntheticSample: false },
        "review-42",
      ),
    ).toBe("real-review");
  });
});
