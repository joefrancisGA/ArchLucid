import { describe, expect, it } from "vitest";

import {
  formatSubmittedArchitectureTextForSummary,
  SUBMITTED_ARCHITECTURE_TEXT_NOT_STORED,
  SUBMITTED_ARCHITECTURE_TEXT_STORED_EMPTY,
} from "@/lib/reviews/submitted-architecture-text-honesty";

describe("submitted-architecture-text-honesty (P-07)", () => {
  it("distinguishes omitted text from stored empty description", () => {
    expect(formatSubmittedArchitectureTextForSummary(null, null)).toBe(SUBMITTED_ARCHITECTURE_TEXT_NOT_STORED);
    expect(formatSubmittedArchitectureTextForSummary(null, "   ")).toBe(
      SUBMITTED_ARCHITECTURE_TEXT_STORED_EMPTY,
    );
    expect(formatSubmittedArchitectureTextForSummary("Real overview", null)).toBe("Real overview");
  });
});
