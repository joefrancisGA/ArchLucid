import { describe, expect, it } from "vitest";

import {
  ADVISORY_RECURRENCE_SCHEDULE_ADVISORY_LINK,
  ADVISORY_RECURRENCE_SCHEDULE_COMPACT_LINE,
  ADVISORY_RECURRENCE_SCHEDULE_HEADING,
  ADVISORY_RECURRENCE_SCHEDULE_RECURRENCE_LINK,
  ADVISORY_RECURRENCE_SCHEDULE_WHY_TWO,
  buildAdvisoryRecurrenceScheduleVocabulary,
  resolveAdvisoryRecurrenceSchedulePeerLink,
} from "@/lib/vocabulary/advisory-recurrence-schedule-vocabulary";
import { ADVISORY_SCANS_SCHEDULES_HREF } from "@/lib/advisory-scans-route";
import { RECURRENCE_SCHEDULES_MANAGE_PATH } from "@/lib/recurrence-schedules-copy";

describe("advisory-recurrence-schedule-vocabulary (TB-2246)", () => {
  it("explains why two schedule surfaces exist and deep-links both", () => {
    const model = buildAdvisoryRecurrenceScheduleVocabulary();

    expect(model.heading).toBe(ADVISORY_RECURRENCE_SCHEDULE_HEADING);
    expect(model.heading.toLowerCase()).toContain("schedule");
    expect(model.whyTwo).toBe(ADVISORY_RECURRENCE_SCHEDULE_WHY_TWO);
    expect(model.whyTwo.toLowerCase()).toContain("advisory");
    expect(model.whyTwo.toLowerCase()).toContain("re-review");
    expect(model.whyTwo.toLowerCase()).toContain("architecture review");
    expect(model.compactLine).toBe(ADVISORY_RECURRENCE_SCHEDULE_COMPACT_LINE);
    expect(model.compactLine.toLowerCase()).toContain("architecture reviews");
    expect(model.compactLine).not.toContain("open the other when you need both");

    expect(model.advisoryLink).toEqual(ADVISORY_RECURRENCE_SCHEDULE_ADVISORY_LINK);
    expect(model.advisoryLink.href).toBe(ADVISORY_SCANS_SCHEDULES_HREF);
    expect(model.advisoryLink.href).toBe("/governance/advisory-scans?tab=schedules");

    expect(model.recurrenceLink).toEqual(ADVISORY_RECURRENCE_SCHEDULE_RECURRENCE_LINK);
    expect(model.recurrenceLink.whenToUse.toLowerCase()).toContain("architecture reviews");
    expect(model.recurrenceLink.href).toBe(RECURRENCE_SCHEDULES_MANAGE_PATH);
    expect(model.recurrenceLink.href).toBe("/governance/recurrence-schedules");
  });

  it("resolves the peer deep link from each surface", () => {
    expect(resolveAdvisoryRecurrenceSchedulePeerLink("advisory-schedules")).toEqual(
      ADVISORY_RECURRENCE_SCHEDULE_RECURRENCE_LINK,
    );
    expect(resolveAdvisoryRecurrenceSchedulePeerLink("recurrence-schedules")).toEqual(
      ADVISORY_RECURRENCE_SCHEDULE_ADVISORY_LINK,
    );
  });

  it("stays distinct from digest-recurrence vocabulary (different advisory job)", () => {
    const model = buildAdvisoryRecurrenceScheduleVocabulary();

    expect(model.whyTwo.toLowerCase()).not.toContain("email");
    expect(model.whyTwo.toLowerCase()).not.toContain("digest");
    expect(model.advisoryLink.href).toContain("advisory-scans");
  });
});

