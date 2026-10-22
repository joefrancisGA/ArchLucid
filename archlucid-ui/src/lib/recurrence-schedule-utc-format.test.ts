import { describe, expect, it } from "vitest";

import { formatRecurrenceScheduleUtcLabel } from "./recurrence-schedule-utc-format";

describe("formatRecurrenceScheduleUtcLabel", () => {
  it("labels missing and invalid timestamps honestly", () => {
    expect(formatRecurrenceScheduleUtcLabel(null)).toBe("Date not recorded");
    expect(formatRecurrenceScheduleUtcLabel("not-a-date")).toBe("Date not readable");
  });
});
