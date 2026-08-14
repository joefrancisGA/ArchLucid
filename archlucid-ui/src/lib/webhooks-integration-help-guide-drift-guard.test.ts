import { describe, expect, it } from "vitest";

import { WEBHOOKS_INTEGRATION_CANONICAL_PATH } from "@/lib/webhooks-integration-evidence-copy";
import {
  WEBHOOKS_INTEGRATION_HELP_CLAIM_DISCIPLINE,
  WEBHOOKS_INTEGRATION_HELP_SOURCES,
} from "@/lib/webhooks-integration-help-evidence-copy";
import {
  WEBHOOKS_INTEGRATION_HELP_GUIDE_HEADINGS,
  WEBHOOKS_INTEGRATION_HELP_NEGATION_DRIFT_MARKERS,
  WEBHOOKS_INTEGRATION_HELP_OVERVIEW,
  WEBHOOKS_INTEGRATION_HELP_PAGE_SUBTITLE,
} from "@/lib/webhooks-integration-help-guide-content";

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

  it("keeps overview distinct from the page subtitle", () => {
    expect(WEBHOOKS_INTEGRATION_HELP_OVERVIEW).not.toBe(WEBHOOKS_INTEGRATION_HELP_PAGE_SUBTITLE);
  });

  it("lists four guide headings so the topic rail renders at xl", () => {
    expect(WEBHOOKS_INTEGRATION_HELP_GUIDE_HEADINGS).toHaveLength(4);
    expect(WEBHOOKS_INTEGRATION_HELP_GUIDE_HEADINGS[3]?.id).toBe("where-to-go-next");
    expect(
      WEBHOOKS_INTEGRATION_HELP_GUIDE_HEADINGS.some(
        (heading) => heading.id === "help-webhooks-integration-claim-discipline-heading",
      ),
    ).toBe(true);
  });

  it("lists webhooks integration help sources with unique hrefs and no help self-href", () => {
    const sourceHrefs = WEBHOOKS_INTEGRATION_HELP_SOURCES.map((source) => source.href);

    expect(new Set(sourceHrefs).size).toBe(sourceHrefs.length);
    expect(WEBHOOKS_INTEGRATION_HELP_SOURCES.every((source) => source.href.startsWith("/"))).toBe(true);
    expect(sourceHrefs).not.toContain("/help/webhooks-integration");
    expect(sourceHrefs).toContain(WEBHOOKS_INTEGRATION_CANONICAL_PATH);
  });
});
