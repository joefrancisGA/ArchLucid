import { describe, expect, it } from "vitest";

import {
  SLACK_INTEGRATION_HELP_CLAIM_DISCIPLINE,
  SLACK_INTEGRATION_HELP_SOURCES,
} from "@/lib/slack-integration-help-evidence-copy";
import {
  SLACK_INTEGRATION_HELP_GUIDE_HEADINGS,
  SLACK_INTEGRATION_HELP_NEGATION_DRIFT_MARKERS,
  SLACK_INTEGRATION_HELP_OVERVIEW,
  SLACK_INTEGRATION_HELP_PAGE_SUBTITLE,
  SLACK_INTEGRATION_HELP_PRIMARY_ACTION,
  SLACK_INTEGRATION_HELP_SETUP_STEPS,
  SLACK_INTEGRATION_HELP_START_HERE_CARD_TITLE,
} from "@/lib/slack-integration-help-guide-content";
import {
  SLACK_SETUP_STEP_ADD_DESTINATION,
  SLACK_SETUP_STEP_CREATE_WEBHOOK,
  SLACK_SETUP_STEP_SAVE_DESTINATION,
  SLACK_SETUP_STEP_SEND_TEST,
} from "@/lib/slack-integration-page-copy";

describe("slack integration help drift guard", () => {
  it("keeps claim discipline free of Sources package jargon", () => {
    for (const phrase of SLACK_INTEGRATION_HELP_NEGATION_DRIFT_MARKERS.claimMustNotContain) {
      expect(SLACK_INTEGRATION_HELP_CLAIM_DISCIPLINE.toLowerCase(), `claim must not contain "${phrase}"`).not.toContain(
        phrase,
      );
    }
  });

  it("uses distinct Start here card title and primary action label", () => {
    expect(SLACK_INTEGRATION_HELP_START_HERE_CARD_TITLE).not.toBe(SLACK_INTEGRATION_HELP_PRIMARY_ACTION.label);
  });

  it("keeps overview distinct from the page subtitle", () => {
    expect(SLACK_INTEGRATION_HELP_OVERVIEW).not.toBe(SLACK_INTEGRATION_HELP_PAGE_SUBTITLE);
  });

  it("lists five guide headings so the topic rail renders at xl", () => {
    expect(SLACK_INTEGRATION_HELP_GUIDE_HEADINGS).toHaveLength(5);
    expect(SLACK_INTEGRATION_HELP_GUIDE_HEADINGS[1]?.id).toBe("set-up-slack-notifications");
    expect(SLACK_INTEGRATION_HELP_GUIDE_HEADINGS[4]?.id).toBe("where-to-go-next");
    expect(
      SLACK_INTEGRATION_HELP_GUIDE_HEADINGS.some((heading) => heading.id === "help-slack-integration-claim-discipline-heading"),
    ).toBe(true);
  });

  it("matches setup steps to Slack page copy exports", () => {
    expect(SLACK_INTEGRATION_HELP_SETUP_STEPS).toEqual([
      SLACK_SETUP_STEP_CREATE_WEBHOOK,
      SLACK_SETUP_STEP_ADD_DESTINATION,
      SLACK_SETUP_STEP_SEND_TEST,
      SLACK_SETUP_STEP_SAVE_DESTINATION,
    ]);
  });

  it("lists slack integration help sources with unique hrefs and no self-href", () => {
    const sourceHrefs = SLACK_INTEGRATION_HELP_SOURCES.map((source) => source.href);

    expect(new Set(sourceHrefs).size).toBe(sourceHrefs.length);
    expect(SLACK_INTEGRATION_HELP_SOURCES.every((source) => source.href.startsWith("/"))).toBe(true);
    expect(sourceHrefs).not.toContain("/integrations/slack");
  });
});
