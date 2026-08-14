import { describe, expect, it } from "vitest";

import { ARCHITECTURE_SPONSOR_DASHBOARD_CANONICAL_PATH } from "@/lib/architecture/architecture-sponsor-dashboard-evidence-copy";
import {
  SPONSOR_DASHBOARD_HELP_CLAIM_DISCIPLINE,
  SPONSOR_DASHBOARD_HELP_SOURCES,
} from "@/lib/sponsor-dashboard-help-evidence-copy";
import {
  SPONSOR_DASHBOARD_HELP_GUIDE_HEADINGS,
  SPONSOR_DASHBOARD_HELP_NEGATION_DRIFT_MARKERS,
  SPONSOR_DASHBOARD_HELP_OVERVIEW,
  SPONSOR_DASHBOARD_HELP_PAGE_SUBTITLE,
  SPONSOR_DASHBOARD_HELP_PRIMARY_ACTION,
  SPONSOR_DASHBOARD_HELP_START_HERE_CARD_TITLE,
} from "@/lib/sponsor-dashboard-help-guide-content";

describe("sponsor dashboard help drift guard", () => {
  it("keeps claim discipline free of Sources package jargon", () => {
    for (const phrase of SPONSOR_DASHBOARD_HELP_NEGATION_DRIFT_MARKERS.claimMustNotContain) {
      expect(SPONSOR_DASHBOARD_HELP_CLAIM_DISCIPLINE.toLowerCase(), `claim must not contain "${phrase}"`).not.toContain(
        phrase,
      );
    }
  });

  it("uses distinct Start here card title and primary action label", () => {
    expect(SPONSOR_DASHBOARD_HELP_START_HERE_CARD_TITLE).not.toBe(SPONSOR_DASHBOARD_HELP_PRIMARY_ACTION.label);
  });

  it("keeps overview distinct from the page subtitle", () => {
    expect(SPONSOR_DASHBOARD_HELP_OVERVIEW).not.toBe(SPONSOR_DASHBOARD_HELP_PAGE_SUBTITLE);
  });

  it("lists five guide headings so the topic rail renders at xl", () => {
    expect(SPONSOR_DASHBOARD_HELP_GUIDE_HEADINGS).toHaveLength(5);
    expect(SPONSOR_DASHBOARD_HELP_GUIDE_HEADINGS[1]?.id).toBe("before-you-start");
    expect(SPONSOR_DASHBOARD_HELP_GUIDE_HEADINGS[4]?.id).toBe("where-to-go-next");
    expect(
      SPONSOR_DASHBOARD_HELP_GUIDE_HEADINGS.some(
        (heading) => heading.id === "help-sponsor-dashboard-claim-discipline-heading",
      ),
    ).toBe(true);
  });

  it("lists sponsor dashboard help sources with unique hrefs and no self-href", () => {
    const sourceHrefs = SPONSOR_DASHBOARD_HELP_SOURCES.map((source) => source.href);

    expect(new Set(sourceHrefs).size).toBe(sourceHrefs.length);
    expect(SPONSOR_DASHBOARD_HELP_SOURCES.every((source) => source.href.startsWith("/"))).toBe(true);
    expect(sourceHrefs).not.toContain(ARCHITECTURE_SPONSOR_DASHBOARD_CANONICAL_PATH);
    expect(sourceHrefs).not.toContain("/help/sponsor-dashboard");
  });
});
