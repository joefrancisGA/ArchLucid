import { describe, expect, it } from "vitest";

import {
  buildClarificationGapSourcePresentation,
  clarificationGapImpactCopy,
  formatClarificationGapSourceLabel,
  formatGapCapturedAtLabel,
} from "@/lib/architecture/architecture-clarification-gap-present";
import type { ArchitectureMissingItem } from "@/lib/architecture/architecture-created-home-gaps";

describe("architecture-clarification-gap-present", () => {
  it("labels captured time honesty states", () => {
    expect(formatGapCapturedAtLabel(null)).toBe("Captured time was not stored.");
    expect(formatGapCapturedAtLabel("")).toBe("Captured time was stored empty.");
    expect(formatGapCapturedAtLabel("not-a-date")).toBe("Captured time could not be read.");
    expect(formatGapCapturedAtLabel("2026-01-15T12:00:00Z")).toMatch(/^captured /);
  });

  it("appends captured time honesty to the gap source label", () => {
    const source = buildClarificationGapSourcePresentation({ capturedAtUtc: null, fromHandoff: true });
    expect(formatClarificationGapSourceLabel(source)).toContain("Captured time was not stored.");
  });

  it("uses heuristic intake copy when the gap was derived on-page", () => {
    const source = buildClarificationGapSourcePresentation({
      capturedAtUtc: "2026-01-15T12:00:00Z",
      fromHandoff: false,
      heuristicDerived: true,
    });

    expect(source.label).toBe("Checked on this page — not a line from the brief.");
    expect(formatClarificationGapSourceLabel(source)).toMatch(/captured /);
  });

  it("uses gap impact not-stored copy for unknown gap ids", () => {
    const item: ArchitectureMissingItem = {
      id: "other",
      label: "Other",
      href: "/architecture/reviews/new",
      category: "clarification",
      source: buildClarificationGapSourcePresentation({ capturedAtUtc: null, fromHandoff: true }),
    };

    expect(clarificationGapImpactCopy(item)).toBe("Standard prompt, not a stored impact.");
    expect(clarificationGapImpactCopy({ ...item, id: "business-outcome" })).toMatch(
      /Standard prompt, not a stored impact\..*Sponsors need/,
    );
  });
});
