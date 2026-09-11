import { describe, expect, it } from "vitest";

import {
  architectureDiagramPercentToZoom,
  architectureDiagramZoomToPercent,
  clampArchitectureDiagramZoom,
} from "@/lib/architecture/architecture-diagram-fullscreen-url";

describe("architecture diagram zoom helpers", () => {
  it("clamps zoom scale factors between 10% and 1000%", () => {
    expect(clampArchitectureDiagramZoom(0.05)).toBe(0.1);
    expect(clampArchitectureDiagramZoom(0.1)).toBe(0.1);
    expect(clampArchitectureDiagramZoom(3.5)).toBe(3.5);
    expect(clampArchitectureDiagramZoom(10)).toBe(10);
    expect(clampArchitectureDiagramZoom(12)).toBe(10);
  });

  it("converts between percent and zoom scale factors", () => {
    expect(architectureDiagramZoomToPercent(1)).toBe(100);
    expect(architectureDiagramPercentToZoom(350)).toBe(3.5);
    expect(architectureDiagramPercentToZoom(1500)).toBe(10);
    expect(architectureDiagramPercentToZoom(5)).toBe(0.1);
  });
});
