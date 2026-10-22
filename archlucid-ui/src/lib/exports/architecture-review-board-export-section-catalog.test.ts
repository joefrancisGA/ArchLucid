import { describe, expect, it } from "vitest";

import {
  ARCHITECTURE_REVIEW_BOARD_EXPORT_SECTION_HEADINGS,
  ARCHITECTURE_REVIEW_BOARD_EXPORT_SECTION_KINDS,
} from "@/lib/exports/architecture-review-board-export-section-catalog";

describe("architecture-review-board-export-section-catalog", () => {
  it("lists canonical body section headings in sponsor export order", () => {
    expect(ARCHITECTURE_REVIEW_BOARD_EXPORT_SECTION_HEADINGS).toEqual([
      "Sponsor report",
      "System overview (architecture snapshot)",
      "Evidence reviewed",
      "Architecture decisions",
      "Key risks",
      "Policy findings",
      "AI-assisted analysis",
      "Traceability appendix",
      "Recommended next actions",
    ]);
  });

  it("defines one kind per heading", () => {
    expect(ARCHITECTURE_REVIEW_BOARD_EXPORT_SECTION_KINDS.length).toBe(
      ARCHITECTURE_REVIEW_BOARD_EXPORT_SECTION_HEADINGS.length,
    );
  });
});
