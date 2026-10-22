import { describe, expect, it } from "vitest";

import {
  RECURRENCE_SCHEDULES_HELP_CANONICAL_PATH,
  RECURRENCE_SCHEDULES_HELP_CLAIM_DISCIPLINE,
  RECURRENCE_SCHEDULES_HELP_SOURCES,
} from "@/lib/recurrence-schedules-help-evidence-copy";
import {
  RECURRENCE_SCHEDULES_HELP_GUIDE_HEADINGS,
  RECURRENCE_SCHEDULES_HELP_NEGATION_DRIFT_MARKERS,
  RECURRENCE_SCHEDULES_HELP_OVERVIEW,
  RECURRENCE_SCHEDULES_HELP_PAGE_SUBTITLE,
  RECURRENCE_SCHEDULES_HELP_PRIMARY_ACTION,
} from "@/lib/recurrence-schedules-help-guide-content";
import { RECURRENCE_SCHEDULES_PAGE_SUBTITLE } from "@/lib/recurrence-schedules-copy";

describe("recurrence schedules help drift guard", () => {
  it("keeps claim discipline free of Sources package jargon", () => {
    for (const phrase of RECURRENCE_SCHEDULES_HELP_NEGATION_DRIFT_MARKERS.claimMustNotContain) {
      expect(
        RECURRENCE_SCHEDULES_HELP_CLAIM_DISCIPLINE.toLowerCase(),
        `claim must not contain "${phrase}"`,
      ).not.toContain(phrase);
    }
  });

  it("keeps overview free of diligence negation drift", () => {
    for (const phrase of RECURRENCE_SCHEDULES_HELP_NEGATION_DRIFT_MARKERS.overviewMustNotContain) {
      expect(RECURRENCE_SCHEDULES_HELP_OVERVIEW.toLowerCase(), `overview must not contain "${phrase}"`).not.toContain(
        phrase.toLowerCase(),
      );
    }
  });

  it("keeps guide subtitle distinct from the product manage page subtitle", () => {
    expect(RECURRENCE_SCHEDULES_HELP_PAGE_SUBTITLE).not.toBe(RECURRENCE_SCHEDULES_PAGE_SUBTITLE);
  });

  it("requires when captions on every follow-up source link", () => {
    expect(RECURRENCE_SCHEDULES_HELP_SOURCES.length).toBeGreaterThan(0);
    expect(RECURRENCE_SCHEDULES_HELP_SOURCES.every((source) => source.when.trim().length > 0)).toBe(true);
  });

  it("lists seven guide headings including claim discipline", () => {
    expect(RECURRENCE_SCHEDULES_HELP_GUIDE_HEADINGS).toHaveLength(7);
    expect(RECURRENCE_SCHEDULES_HELP_GUIDE_HEADINGS[6]?.id).toBe("where-to-go-next");
    expect(
      RECURRENCE_SCHEDULES_HELP_GUIDE_HEADINGS.some(
        (heading) => heading.id === "help-recurrence-schedules-claim-discipline-heading",
      ),
    ).toBe(true);
  });

  it("lists recurrence schedules help sources with unique hrefs and no self-href", () => {
    const sourceHrefs = RECURRENCE_SCHEDULES_HELP_SOURCES.map((source) => source.href);

    expect(new Set(sourceHrefs).size).toBe(sourceHrefs.length);
    expect(RECURRENCE_SCHEDULES_HELP_SOURCES.every((source) => source.href.startsWith("/"))).toBe(true);
    expect(sourceHrefs).not.toContain(RECURRENCE_SCHEDULES_HELP_CANONICAL_PATH);
    expect(RECURRENCE_SCHEDULES_HELP_PRIMARY_ACTION.href.startsWith("/")).toBe(true);
  });
});
