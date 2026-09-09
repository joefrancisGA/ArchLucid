import { describe, expect, it } from "vitest";

import {
  resolveGuidedPaletteLockedDestinations,
  shouldShowGuidedPaletteLockedDestinations,
} from "@/lib/usability/guided-palette-locked-destinations";

describe("guided-palette-locked-destinations (CD-08)", () => {
  it("lists Guided first-session Operate destinations with lock reasons", () => {
    const destinations = resolveGuidedPaletteLockedDestinations();

    expect(destinations.some((entry) => entry.href === "/insights/sponsor-report")).toBe(true);
    expect(destinations.every((entry) => entry.lockReason.length > 0)).toBe(true);
  });

  it("shows locked rows only for Guided pre-commit shells without full-nav escape hatch", () => {
    expect(
      shouldShowGuidedPaletteLockedDestinations({
        workingMode: false,
        hasCommittedArchitectureReview: false,
        showFullNav: false,
      }),
    ).toBe(true);

    expect(
      shouldShowGuidedPaletteLockedDestinations({
        workingMode: true,
        hasCommittedArchitectureReview: false,
        showFullNav: false,
      }),
    ).toBe(false);

    expect(
      shouldShowGuidedPaletteLockedDestinations({
        workingMode: false,
        hasCommittedArchitectureReview: true,
        showFullNav: false,
      }),
    ).toBe(false);

    expect(
      shouldShowGuidedPaletteLockedDestinations({
        workingMode: false,
        hasCommittedArchitectureReview: false,
        showFullNav: true,
      }),
    ).toBe(false);
  });
});
