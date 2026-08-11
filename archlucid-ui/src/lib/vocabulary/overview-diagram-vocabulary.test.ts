import { describe, expect, it } from "vitest";

import {
  OVERVIEW_DIAGRAM_COMPACT_LINE,
  OVERVIEW_DIAGRAM_HEADING,
  OVERVIEW_DIAGRAM_WHY_TWO,
  buildOverviewDiagramVocabulary,
  resolveOverviewDiagramPeerLink,
} from "@/lib/vocabulary/overview-diagram-vocabulary";
import { buildArchitectureWorkspaceTabHref } from "@/lib/architecture-workspace-tabs";

describe("overview-diagram-vocabulary (TB-2309)", () => {
  it("explains structured overview brief vs illustrative diagram", () => {
    const model = buildOverviewDiagramVocabulary("run-abc");

    expect(model.heading).toBe(OVERVIEW_DIAGRAM_HEADING);
    expect(model.whyTwo).toBe(OVERVIEW_DIAGRAM_WHY_TWO);
    expect(model.whyTwo.toLowerCase()).toContain("brief");
    expect(model.whyTwo.toLowerCase()).toContain("sketch");
    expect(model.compactLine).toBe(OVERVIEW_DIAGRAM_COMPACT_LINE);
    expect(model.overviewLink.href).toBe(buildArchitectureWorkspaceTabHref("run-abc", "overview"));
    expect(model.diagramLink.href).toBe(buildArchitectureWorkspaceTabHref("run-abc", "diagram"));
  });

  it("resolves the peer surface from overview and diagram", () => {
    const model = buildOverviewDiagramVocabulary("run-abc");

    expect(resolveOverviewDiagramPeerLink("overview", model)).toEqual(model.diagramLink);
    expect(resolveOverviewDiagramPeerLink("diagram", model)).toEqual(model.overviewLink);
  });
});
