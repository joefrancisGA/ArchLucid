import { describe, expect, it } from "vitest";

import { GOVERNANCE_RECURRENCE_SCHEDULES_PATH } from "@/lib/governance/recurrence-schedules-route";
import {
  RECURRENCE_SCHEDULES_CLAIM_DISCIPLINE,
  RECURRENCE_SCHEDULES_FOLLOW_UPS_TITLE,
  RECURRENCE_SCHEDULES_ORIENTATION_SOURCES,
  RECURRENCE_SCHEDULES_SOURCES,
  RECURRENCE_SCHEDULES_SOURCES_INTRO,
} from "@/lib/recurrence-schedules-evidence-copy";

describe("recurrence-schedules-evidence-copy", () => {
  it("exports non-empty claim discipline and orientation Sources for GRX", () => {
    expect(RECURRENCE_SCHEDULES_FOLLOW_UPS_TITLE.length).toBeGreaterThan(0);
    expect(RECURRENCE_SCHEDULES_CLAIM_DISCIPLINE).toContain("architecture reviews repeat");
    expect(RECURRENCE_SCHEDULES_SOURCES_INTRO.length).toBeGreaterThan(0);
    expect(RECURRENCE_SCHEDULES_SOURCES.length).toBeGreaterThan(0);
    expect(RECURRENCE_SCHEDULES_ORIENTATION_SOURCES.length).toBeGreaterThan(0);

    for (const link of RECURRENCE_SCHEDULES_ORIENTATION_SOURCES) {
      expect(link.href).not.toBe(GOVERNANCE_RECURRENCE_SCHEDULES_PATH);
    }
  });
});
