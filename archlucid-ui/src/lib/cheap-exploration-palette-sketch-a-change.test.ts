import { describe, expect, it } from "vitest";

import {
  CHEAP_EXPLORATION_PALETTE_SKETCH_A_CHANGE_HANDLER,
  isCheapExplorationPaletteSketchArchitecturePath,
  resolveCheapExplorationPaletteSketchVisible,
} from "@/lib/cheap-exploration-palette-sketch-a-change";

describe("cheap-exploration palette sketch a change (CE-013)", () => {
  it("labels palette action Sketch a change", () => {
    expect(CHEAP_EXPLORATION_PALETTE_SKETCH_A_CHANGE_HANDLER.label).toBe("Sketch a change");
    expect(CHEAP_EXPLORATION_PALETTE_SKETCH_A_CHANGE_HANDLER.costCapChromeModule).toBe(
      "system-not-job-what-if-cost-cap-chrome",
    );
  });

  it("matches architecture desk and nested findings paths (IH-051)", () => {
    expect(isCheapExplorationPaletteSketchArchitecturePath("/architecture/architectures/a1")).toBe(
      true,
    );
    expect(
      isCheapExplorationPaletteSketchArchitecturePath("/architecture/architectures/a1/findings"),
    ).toBe(true);
    expect(isCheapExplorationPaletteSketchArchitecturePath("/architecture/reviews/r1")).toBe(false);
  });

  it("hides palette row when clone CTA is not available", () => {
    expect(resolveCheapExplorationPaletteSketchVisible("/architecture/architectures/a1")).toBe(
      false,
    );
  });
});
