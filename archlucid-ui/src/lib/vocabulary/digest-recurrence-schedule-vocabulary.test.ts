import { describe, expect, it } from "vitest";

import {
  DIGEST_RECURRENCE_SCHEDULE_COMPACT_LINE,
  DIGEST_RECURRENCE_SCHEDULE_DIGEST_LINK,
  DIGEST_RECURRENCE_SCHEDULE_HEADING,
  DIGEST_RECURRENCE_SCHEDULE_RECURRENCE_LINK,
  DIGEST_RECURRENCE_SCHEDULE_WHY_TWO,
  buildDigestRecurrenceScheduleVocabulary,
  resolveDigestRecurrenceSchedulePeerLink,
} from "@/lib/vocabulary/digest-recurrence-schedule-vocabulary";
import { DIGESTS_SCHEDULE_TAB_PATH } from "@/lib/digests-route-paths";
import { RECURRENCE_SCHEDULES_MANAGE_PATH } from "@/lib/recurrence-schedules-copy";

describe("digest-recurrence-schedule-vocabulary (TB-2226)", () => {
  it("explains why two schedule surfaces exist and deep-links both", () => {
    const model = buildDigestRecurrenceScheduleVocabulary();

    expect(model.heading).toBe(DIGEST_RECURRENCE_SCHEDULE_HEADING);
    expect(model.heading.toLowerCase()).toContain("schedule");
    expect(model.whyTwo).toBe(DIGEST_RECURRENCE_SCHEDULE_WHY_TWO);
    expect(model.whyTwo.toLowerCase()).toContain("email");
    expect(model.whyTwo.toLowerCase()).toContain("re-review");
    expect(model.whyTwo.toLowerCase()).toContain("architecture review");
    expect(model.compactLine).toBe(DIGEST_RECURRENCE_SCHEDULE_COMPACT_LINE);

    expect(model.digestLink).toEqual(DIGEST_RECURRENCE_SCHEDULE_DIGEST_LINK);
    expect(model.digestLink.href).toBe(DIGESTS_SCHEDULE_TAB_PATH);
    expect(model.digestLink.href).toBe("/architecture/digests?tab=schedule");

    expect(model.recurrenceLink).toEqual(DIGEST_RECURRENCE_SCHEDULE_RECURRENCE_LINK);
    expect(model.recurrenceLink.href).toBe(RECURRENCE_SCHEDULES_MANAGE_PATH);
    expect(model.recurrenceLink.href).toBe("/governance/recurrence-schedules");
  });

  it("resolves the peer deep link from each surface", () => {
    expect(resolveDigestRecurrenceSchedulePeerLink("digest-executive-schedule")).toEqual(
      DIGEST_RECURRENCE_SCHEDULE_RECURRENCE_LINK,
    );
    expect(resolveDigestRecurrenceSchedulePeerLink("recurrence-schedules")).toEqual(
      DIGEST_RECURRENCE_SCHEDULE_DIGEST_LINK,
    );
  });
});
