import { describe, expect, it } from "vitest";

import {
  WEBHOOKS_INTEGRATION_HELP_CLAIM_DISCIPLINE,
  WEBHOOKS_INTEGRATION_HELP_SOURCES,
} from "@/lib/webhooks-integration-help-evidence-copy";
import {
  WEBHOOKS_INTEGRATION_HELP_DELIVERY_SECTION_ID,
  WEBHOOKS_INTEGRATION_HELP_GUIDE_HEADINGS,
  WEBHOOKS_INTEGRATION_HELP_NEGATION_DRIFT_MARKERS,
  WEBHOOKS_INTEGRATION_HELP_OVERVIEW,
  WEBHOOKS_INTEGRATION_HELP_PAGE_SUBTITLE,
} from "@/lib/webhooks-integration-help-guide-content";
import { WEBHOOKS_DELIVERY_CONTRACT_HEADING, WEBHOOKS_PAGE_DESCRIPTION } from "@/lib/webhooks-page-copy";

describe("webhooks integration help drift guard", () => {
  it("keeps claim discipline free of Sources package jargon", () => {
    for (const phrase of WEBHOOKS_INTEGRATION_HELP_NEGATION_DRIFT_MARKERS.claimMustNotContain) {
      expect(
        WEBHOOKS_INTEGRATION_HELP_CLAIM_DISCIPLINE.toLowerCase(),
        `claim must not contain "${phrase}"`,
      ).not.toContain(phrase);
    }
  });

  it("keeps overview free of diligence negation drift", () => {
    for (const phrase of WEBHOOKS_INTEGRATION_HELP_NEGATION_DRIFT_MARKERS.overviewMustNotContain) {
      expect(WEBHOOKS_INTEGRATION_HELP_OVERVIEW.toLowerCase(), `overview must not contain "${phrase}"`).not.toContain(
        phrase.toLowerCase(),
      );
    }
  });

  it("keeps overview and subtitle distinct from the product page description", () => {
    expect(WEBHOOKS_INTEGRATION_HELP_OVERVIEW).not.toBe(WEBHOOKS_INTEGRATION_HELP_PAGE_SUBTITLE);
    expect(WEBHOOKS_INTEGRATION_HELP_PAGE_SUBTITLE).not.toBe(WEBHOOKS_PAGE_DESCRIPTION);
  });

  it("lists five guide headings including delivery contract before how webhooks work", () => {
    expect(WEBHOOKS_INTEGRATION_HELP_GUIDE_HEADINGS).toHaveLength(5);
    expect(WEBHOOKS_INTEGRATION_HELP_GUIDE_HEADINGS[1]?.id).toBe(WEBHOOKS_INTEGRATION_HELP_DELIVERY_SECTION_ID);
    expect(WEBHOOKS_INTEGRATION_HELP_GUIDE_HEADINGS[1]?.title).toBe(WEBHOOKS_DELIVERY_CONTRACT_HEADING);
    expect(WEBHOOKS_INTEGRATION_HELP_GUIDE_HEADINGS[4]?.id).toBe("where-to-go-next");
    expect(
      WEBHOOKS_INTEGRATION_HELP_GUIDE_HEADINGS.some(
        (heading) => heading.id === "help-webhooks-integration-claim-discipline-heading",
      ),
    ).toBe(true);
  });

  it("lists webhooks integration help sources with unique hrefs, when captions, and no help self-href", () => {
    const sourceHrefs = WEBHOOKS_INTEGRATION_HELP_SOURCES.map((source) => source.href);

    expect(new Set(sourceHrefs).size).toBe(sourceHrefs.length);
    expect(WEBHOOKS_INTEGRATION_HELP_SOURCES.every((source) => source.href.startsWith("/"))).toBe(true);
    expect(WEBHOOKS_INTEGRATION_HELP_SOURCES.every((source) => source.when.trim().length > 0)).toBe(true);
    expect(sourceHrefs).not.toContain("/help/webhooks-integration");
    expect(sourceHrefs).not.toContain("/integrations/webhooks");
  });
});
