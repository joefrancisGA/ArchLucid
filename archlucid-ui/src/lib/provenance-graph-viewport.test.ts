import { describe, expect, it } from "vitest";

import {
  clampProvenanceZoom,
  computeFitToViewTransform,
  PROVENANCE_GRAPH_FIT_PADDING_PX,
  PROVENANCE_GRAPH_MAX_ZOOM,
  PROVENANCE_GRAPH_MIN_FIT_SCALE,
  PROVENANCE_GRAPH_MIN_ZOOM,
} from "@/lib/provenance-graph-viewport";

describe("provenance graph viewport", () => {
  it("fits content bounds inside the container with padding", () => {
    const bounds = { minX: 40, minY: 20, maxX: 440, maxY: 320, width: 400, height: 300 };
    const transform = computeFitToViewTransform(bounds, 800, 600, PROVENANCE_GRAPH_FIT_PADDING_PX);

    expect(transform.scale).toBeGreaterThan(0);

    const scaledWidth = bounds.width * transform.scale;
    const scaledHeight = bounds.height * transform.scale;

    expect(scaledWidth).toBeLessThanOrEqual(800 - PROVENANCE_GRAPH_FIT_PADDING_PX * 2 + 1);
    expect(scaledHeight).toBeLessThanOrEqual(600 - PROVENANCE_GRAPH_FIT_PADDING_PX * 2 + 1);
  });

  it("clamps zoom within configured limits", () => {
    expect(clampProvenanceZoom(0.1)).toBe(PROVENANCE_GRAPH_MIN_ZOOM);
    expect(clampProvenanceZoom(10)).toBe(PROVENANCE_GRAPH_MAX_ZOOM);
    expect(clampProvenanceZoom(1)).toBe(1);
  });

  it("does not shrink initial fit below the legibility floor", () => {
    const bounds = { minX: 0, minY: 0, maxX: 2000, maxY: 1600, width: 2000, height: 1600 };
    const transform = computeFitToViewTransform(bounds, 960, 580);

    expect(transform.scale).toBeGreaterThanOrEqual(PROVENANCE_GRAPH_MIN_FIT_SCALE);
  });

  it("recalculates when container size changes", () => {
    const bounds = { minX: 0, minY: 0, maxX: 200, maxY: 100, width: 200, height: 100 };
    const narrow = computeFitToViewTransform(bounds, 320, 580);
    const wide = computeFitToViewTransform(bounds, 960, 580);

    expect(wide.scale).toBeGreaterThanOrEqual(narrow.scale);
  });
});
