import { describe, expect, it } from "vitest";

import {
  CHEAP_EXPLORATION_REHEARSAL_DEFAULT_DOOR,
  resolveCheapExplorationSketchConfirmDescription,
} from "@/lib/cheap-exploration-rehearsal-default-sketches";

describe("cheap-exploration rehearsal default sketches (CE-004)", () => {
  it("defaults sketch door to rehearsal", () => {
    expect(CHEAP_EXPLORATION_REHEARSAL_DEFAULT_DOOR).toBe("rehearsal");
  });

  it("confirm copy names Rehearsal stamp for default sketch door", () => {
    const description = resolveCheapExplorationSketchConfirmDescription();

    expect(description).toMatch(/Practice/i);
    expect(description).toMatch(/ADR 0092/);
  });
});
