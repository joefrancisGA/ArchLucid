import { describe, expect, it } from "vitest";

import {
  TEAMS_INTEGRATION_HELP_CLAIM_DISCIPLINE,
  TEAMS_INTEGRATION_HELP_SOURCES,
} from "@/lib/teams-integration-help-evidence-copy";
import {
  TEAMS_INTEGRATION_HELP_GUIDE_HEADINGS,
  TEAMS_INTEGRATION_HELP_NEGATION_DRIFT_MARKERS,
  TEAMS_INTEGRATION_HELP_OVERVIEW,
  TEAMS_INTEGRATION_HELP_PAGE_SUBTITLE,
  TEAMS_INTEGRATION_HELP_PRIMARY_ACTION,
  TEAMS_INTEGRATION_HELP_SETUP_STEPS,
  TEAMS_INTEGRATION_HELP_START_HERE_CARD_TITLE,
} from "@/lib/teams-integration-help-guide-content";
import {
  TEAMS_SETUP_STEP_CREATE_WEBHOOK,
  TEAMS_SETUP_STEP_ENTER_SECRET,
  TEAMS_SETUP_STEP_SAVE_CONNECTION,
  TEAMS_SETUP_STEP_SEND_TEST,
} from "@/lib/teams-integration-page-copy";

describe("teams integration help drift guard", () => {
  it("keeps claim discipline free of Sources package jargon", () => {
    for (const phrase of TEAMS_INTEGRATION_HELP_NEGATION_DRIFT_MARKERS.claimMustNotContain) {
      expect(TEAMS_INTEGRATION_HELP_CLAIM_DISCIPLINE.toLowerCase(), `claim must not contain "${phrase}"`).not.toContain(
        phrase,
      );
    }
  });

  it("uses distinct Start here card title and primary action label", () => {
    expect(TEAMS_INTEGRATION_HELP_START_HERE_CARD_TITLE).not.toBe(TEAMS_INTEGRATION_HELP_PRIMARY_ACTION.label);
  });

  it("keeps overview distinct from the page subtitle", () => {
    expect(TEAMS_INTEGRATION_HELP_OVERVIEW).not.toBe(TEAMS_INTEGRATION_HELP_PAGE_SUBTITLE);
  });

  it("lists five guide headings so the topic rail renders at xl", () => {
    expect(TEAMS_INTEGRATION_HELP_GUIDE_HEADINGS).toHaveLength(5);
    expect(TEAMS_INTEGRATION_HELP_GUIDE_HEADINGS[1]?.id).toBe("set-up-teams-notifications");
    expect(TEAMS_INTEGRATION_HELP_GUIDE_HEADINGS[4]?.id).toBe("where-to-go-next");
    expect(
      TEAMS_INTEGRATION_HELP_GUIDE_HEADINGS.some(
        (heading) => heading.id === "help-teams-integration-claim-discipline-heading",
      ),
    ).toBe(true);
  });

  it("matches setup steps to Teams page copy exports", () => {
    expect(TEAMS_INTEGRATION_HELP_SETUP_STEPS).toEqual([
      TEAMS_SETUP_STEP_CREATE_WEBHOOK,
      TEAMS_SETUP_STEP_ENTER_SECRET,
      TEAMS_SETUP_STEP_SEND_TEST,
      TEAMS_SETUP_STEP_SAVE_CONNECTION,
    ]);
  });

  it("lists teams integration help sources with unique hrefs and no self-href", () => {
    const sourceHrefs = TEAMS_INTEGRATION_HELP_SOURCES.map((source) => source.href);

    expect(new Set(sourceHrefs).size).toBe(sourceHrefs.length);
    expect(TEAMS_INTEGRATION_HELP_SOURCES.every((source) => source.href.startsWith("/"))).toBe(true);
    expect(sourceHrefs).not.toContain("/integrations/teams");
    expect(sourceHrefs).not.toContain("/help/teams-integration");
  });
});
