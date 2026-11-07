/**
 * TB-2098 — one node-type legend beside the canvas; no stacked role/type/prose legends.
 */
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const SRC = join(process.cwd(), "src");

const LOADED_EXPERIENCE = join(
  SRC,
  "app/(operator)/insights/evidence-graph/_sections/GraphLoadedExperience.tsx",
);
const GRAPH_VIEWER_SELECTION = join(SRC, "components/GraphViewerSelectionSettings.tsx");
const KIND_CHIPS = join(SRC, "components/GraphNodeKindLegendChips.tsx");

describe("TB-2098 Evidence graph single legend", () => {
  it("removes stacked legends from GraphLoadedExperience", () => {
    const source = readFileSync(LOADED_EXPERIENCE, "utf8");

    expect(source).not.toContain("GraphViewerLegend");
    expect(source).not.toContain("GraphReviewTrailLegendChips");
    expect(source).not.toContain("GraphNodeKindLegendChips");
    expect(source).not.toMatch(/>\s*Legend\s*</);
  });

  it("keeps a single node-kind legend beside the canvas in GraphViewer", () => {
    const viewerChrome = readFileSync(GRAPH_VIEWER_SELECTION, "utf8");
    const chips = readFileSync(KIND_CHIPS, "utf8");

    expect(viewerChrome).toContain("GraphNodeKindLegendChips");
    expect(viewerChrome).toContain('data-testid="graph-canvas-legend"');
    expect(viewerChrome.match(/<GraphNodeKindLegendChips\b/g)?.length ?? 0).toBe(1);
    expect(viewerChrome).not.toContain("Evidence-to-decision trail:");
    expect(chips).toContain('aria-label={props["aria-label"] ?? "Legend"}');
  });

  it("deletes the role-row and tip legends", () => {
    expect(existsSync(join(SRC, "components/usability/GraphViewerLegend.tsx"))).toBe(false);
    expect(existsSync(join(SRC, "components/GraphReviewTrailLegendChips.tsx"))).toBe(false);
  });
});
