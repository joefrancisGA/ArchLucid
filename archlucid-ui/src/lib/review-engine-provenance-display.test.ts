import { describe, expect, it } from "vitest";

import {
  formatReviewEngineOptionalStoredField,
  formatReviewEngineRunTimestamp,
} from "@/lib/review-engine-provenance-display";

describe("review-engine-provenance-display (P-15, P-17)", () => {
  it("distinguishes null, stored-empty, and stored optional fields", () => {
    expect(
      formatReviewEngineOptionalStoredField(null, "Output schema version was not stored.", "Output schema version was stored empty."),
    ).toBe("Output schema version was not stored.");
    expect(
      formatReviewEngineOptionalStoredField("  ", "Engine profile was not stored.", "Engine profile was stored empty."),
    ).toBe("Engine profile was stored empty.");
    expect(
      formatReviewEngineOptionalStoredField("v2", "Evidence snapshot version was not stored.", "Evidence snapshot version was stored empty."),
    ).toBe("v2");
  });

  it("labels missing and invalid run timestamps honestly", () => {
    expect(formatReviewEngineRunTimestamp("")).toBe("Run timestamp was not stored.");
    expect(formatReviewEngineRunTimestamp("not-a-time")).toBe("Run timestamp was not a valid time.");
    expect(formatReviewEngineRunTimestamp("2026-01-15T12:00:00.000Z")).toContain("UTC");
  });
});
