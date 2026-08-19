import { describe, expect, it } from "vitest";

import {
  DEFAULT_DECISION_REGISTER_DATE_PRESET,
  resolveDecisionRegisterDateRange,
  toDateInputValue,
} from "./decision-register-date-range";

describe("decision-register-date-range", () => {
  it("defaults to the last 90 days", () => {
    const today = new Date("2026-07-09T12:00:00.000Z");
    const range = resolveDecisionRegisterDateRange(DEFAULT_DECISION_REGISTER_DATE_PRESET, today);

    expect(range.recordedBefore).toBe(toDateInputValue(today));
    expect(range.recordedAfter).toBe("2026-04-10");
  });

  it("clears dates for all-time preset", () => {
    expect(resolveDecisionRegisterDateRange("all").recordedAfter).toBe("");
    expect(resolveDecisionRegisterDateRange("all").recordedBefore).toBe("");
  });
});
