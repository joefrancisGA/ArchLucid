import { describe, expect, it } from "vitest";

import {
  filterRunDetailNavSectionsForTab,
  resolveReviewDetailTabForSectionAnchor,
  RUN_DETAIL_SECTION_TAB,
} from "@/lib/runs/run-detail-section-tab-map";
import { resolveReviewDetailTabFromHash } from "@/lib/review-detail-workspace-tabs";

describe("run-detail-section-tab-map", () => {
  it("maps sponsor handoff and architecture graph to their owning tabs", () => {
    expect(RUN_DETAIL_SECTION_TAB["sponsor-handoff"]).toBe("review-package");
    expect(RUN_DETAIL_SECTION_TAB["architecture-graph"]).toBe("architecture");
  });

  it("aligns hash resolution with section ownership", () => {
    expect(resolveReviewDetailTabFromHash("sponsor-handoff")).toBe("review-package");
    expect(resolveReviewDetailTabFromHash("architecture-graph")).toBe("architecture");
    expect(resolveReviewDetailTabForSectionAnchor("pipeline-timeline")).toBe("activity");
  });

  it("filters in-page nav anchors to the active tab", () => {
    const sections = [
      { id: "pipeline-timeline", label: "Activity", available: true },
      { id: "architecture-graph", label: "Graph", available: true },
      { id: "run-explanation", label: "Findings", available: true },
    ];

    expect(filterRunDetailNavSectionsForTab(sections, "activity").map((s) => s.id)).toEqual([
      "pipeline-timeline",
    ]);
  });
});
