import { describe, expect, it } from "vitest";

import {
  parseRecurrenceSchedulePostCommitOpenFromSearch,
  RECURRENCE_SCHEDULE_POST_COMMIT_OPEN_PARAM,
  recurrenceSchedulePostCommitDisclosureHrefFromSearch,
} from "./recurrence-schedule-post-commit-disclosure-url";

describe("recurrence schedule disclosure", () => {
  it("restores an explicit collapse when a stickiness prompt defaults the disclosure open", () => {
    const closedHref = recurrenceSchedulePostCommitDisclosureHrefFromSearch(
      "?tab=summary&recurrenceSchedulePostCommitOpen=1",
      false,
      "/review",
      true,
    );
    const closedSearch = new URL(closedHref, "https://example.test").searchParams;

    expect(closedSearch.get("tab")).toBe("summary");
    expect(closedSearch.get(RECURRENCE_SCHEDULE_POST_COMMIT_OPEN_PARAM)).toBe("0");
    expect(parseRecurrenceSchedulePostCommitOpenFromSearch(null, true)).toBe(true);
    expect(parseRecurrenceSchedulePostCommitOpenFromSearch("1", true)).toBe(true);
    expect(parseRecurrenceSchedulePostCommitOpenFromSearch("0", true)).toBe(false);
  });

  it("keeps a collapsed-by-default disclosure implicit", () => {
    const closedHref = recurrenceSchedulePostCommitDisclosureHrefFromSearch(
      "?tab=summary&recurrenceSchedulePostCommitOpen=1",
      false,
      "/review",
    );

    expect(closedHref).toBe("/review?tab=summary");
    expect(parseRecurrenceSchedulePostCommitOpenFromSearch(null)).toBe(false);
  });
});
