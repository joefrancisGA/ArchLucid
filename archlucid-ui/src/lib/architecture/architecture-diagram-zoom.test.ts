import { describe, expect, it } from "vitest";

import {
  architectureDiagramPercentToZoom,
  architectureDiagramZoomToPercent,
  clampArchitectureDiagramZoom,
} from "@/lib/architecture/architecture-diagram-fullscreen-url";

describe("architecture diagram zoom helpers", () => {
  it("clamps zoom scale factors between 60% and 1000%", () => {
    expect(clampArchitectureDiagramZoom(0.2)).toBe(0.6);
    expect(clampArchitectureDiagramZoom(0.6)).toBe(0.6);
    expect(clampArchitectureDiagramZoom(3.5)).toBe(3.5);
    expect(clampArchitectureDiagramZoom(10)).toBe(10);
    expect(clampArchitectureDiagramZoom(12)).toBe(10);
  });

  it("converts between percent and zoom scale factors", () => {
    expect(architectureDiagramZoomToPercent(1)).toBe(100);
    expect(architectureDiagramPercentToZoom(350)).toBe(3.5);
    expect(architectureDiagramPercentToZoom(1500)).toBe(10);
    expect(architectureDiagramPercentToZoom(20)).toBe(0.6);
    expect(architectureDiagramPercentToZoom(60)).toBe(0.6);
    expect(clampArchitectureDiagramZoom(0.61)).toBe(0.61);
  });
});
