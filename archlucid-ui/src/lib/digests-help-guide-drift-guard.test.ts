import { describe, expect, it } from "vitest";

import {
  DIGESTS_HELP_CANONICAL_PATH,
  DIGESTS_HELP_CLAIM_DISCIPLINE,
  DIGESTS_HELP_SOURCES,
} from "@/lib/digests-help-evidence-copy";
import {
  DIGESTS_HELP_GUIDE_HEADINGS,
  DIGESTS_HELP_NEGATION_DRIFT_MARKERS,
  DIGESTS_HELP_OVERVIEW,
  DIGESTS_HELP_PAGE_SUBTITLE,
  DIGESTS_HELP_PRIMARY_ACTION,
} from "@/lib/digests-help-guide-content";

describe("digests help drift guard", () => {
  it("keeps claim discipline free of Sources package jargon", () => {
    for (const phrase of DIGESTS_HELP_NEGATION_DRIFT_MARKERS.claimMustNotContain) {
      expect(DIGESTS_HELP_CLAIM_DISCIPLINE.toLowerCase(), `claim must not contain "${phrase}"`).not.toContain(phrase);
    }
  });

  it("keeps overview free of diligence negation drift", () => {
    for (const phrase of DIGESTS_HELP_NEGATION_DRIFT_MARKERS.overviewMustNotContain) {
      expect(DIGESTS_HELP_OVERVIEW.toLowerCase(), `overview must not contain "${phrase}"`).not.toContain(
        phrase.toLowerCase(),
      );
    }
  });

  it("keeps overview distinct from the page subtitle", () => {
    expect(DIGESTS_HELP_OVERVIEW).not.toBe(DIGESTS_HELP_PAGE_SUBTITLE);
  });

  it("lists five guide headings including claim discipline", () => {
    expect(DIGESTS_HELP_GUIDE_HEADINGS).toHaveLength(5);
    expect(DIGESTS_HELP_GUIDE_HEADINGS[4]?.id).toBe("where-to-go-next");
    expect(
      DIGESTS_HELP_GUIDE_HEADINGS.some((heading) => heading.id === "help-digests-claim-discipline-heading"),
    ).toBe(true);
  });

  it("lists digests help sources with unique hrefs and no self-href", () => {
    const sourceHrefs = DIGESTS_HELP_SOURCES.map((source) => source.href);

    expect(new Set(sourceHrefs).size).toBe(sourceHrefs.length);
    expect(DIGESTS_HELP_SOURCES.every((source) => source.href.startsWith("/"))).toBe(true);
    expect(sourceHrefs).not.toContain(DIGESTS_HELP_CANONICAL_PATH);
    expect(DIGESTS_HELP_PRIMARY_ACTION.href.startsWith("/")).toBe(true);
  });
});
