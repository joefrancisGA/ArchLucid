import { describe, expect, it } from "vitest";

import {
  TEAMS_INTEGRATION_HELP_ALERT_RULES_HREF,
  TEAMS_INTEGRATION_HELP_ALTERNATIVE_SOURCES,
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
  TEAMS_INTEGRATION_BEFORE_YOU_CONNECT_STEPS,
  TEAMS_INTEGRATION_PAGE_SUBTITLE,
} from "@/lib/teams-integration-page-copy";
import { inAppHelpHref } from "@/lib/product-documentation-registry";

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

  it("keeps overview and help subtitle distinct from the operator page subtitle", () => {
    expect(TEAMS_INTEGRATION_HELP_OVERVIEW).not.toBe(TEAMS_INTEGRATION_HELP_PAGE_SUBTITLE);
    expect(TEAMS_INTEGRATION_HELP_PAGE_SUBTITLE).not.toBe(TEAMS_INTEGRATION_PAGE_SUBTITLE);
  });

  it("lists six guide headings so the topic rail renders at xl", () => {
    expect(TEAMS_INTEGRATION_HELP_GUIDE_HEADINGS).toHaveLength(6);
    expect(TEAMS_INTEGRATION_HELP_GUIDE_HEADINGS[1]?.id).toBe("teams-webhook-secret-handling");
    expect(TEAMS_INTEGRATION_HELP_GUIDE_HEADINGS[2]?.id).toBe("set-up-teams-notifications");
    expect(TEAMS_INTEGRATION_HELP_GUIDE_HEADINGS[5]?.id).toBe("where-to-go-next");
    expect(
      TEAMS_INTEGRATION_HELP_GUIDE_HEADINGS.some(
        (heading) => heading.id === "help-teams-integration-claim-discipline-heading",
      ),
    ).toBe(true);
  });

  it("matches setup steps to shared Teams before-you-connect copy", () => {
    expect(TEAMS_INTEGRATION_HELP_SETUP_STEPS).toEqual(TEAMS_INTEGRATION_BEFORE_YOU_CONNECT_STEPS);
  });

  it("lists teams integration help sources with unique hrefs and no self-href", () => {
    const sourceHrefs = TEAMS_INTEGRATION_HELP_SOURCES.map((source) => source.href);

    expect(new Set(sourceHrefs).size).toBe(sourceHrefs.length);
    expect(TEAMS_INTEGRATION_HELP_SOURCES.every((source) => source.href.startsWith("/"))).toBe(true);
    expect(sourceHrefs).not.toContain("/integrations/teams");
    expect(sourceHrefs).not.toContain("/help/teams-integration");
    expect(sourceHrefs).toContain(TEAMS_INTEGRATION_HELP_ALERT_RULES_HREF);
  });

  it("routes sibling channels through help topics instead of live integration surfaces", () => {
    const alternativeHrefs = TEAMS_INTEGRATION_HELP_ALTERNATIVE_SOURCES.map((source) => source.href);

    expect(alternativeHrefs).toEqual([
      inAppHelpHref("slack-integration"),
      inAppHelpHref("webhooks-integration"),
    ]);
    expect(alternativeHrefs.every((href) => href.startsWith("/help/"))).toBe(true);
  });
});
