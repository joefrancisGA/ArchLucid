import { describe, expect, it } from "vitest";

import {
  FINDINGS_HELP_CANONICAL_PATH,
  FINDINGS_HELP_CLAIM_DISCIPLINE,
  FINDINGS_HELP_SOURCES,
} from "@/lib/findings/findings-help-evidence-copy";
import {
  FINDINGS_HELP_GUIDE_HEADINGS,
  FINDINGS_HELP_NEGATION_DRIFT_MARKERS,
  FINDINGS_HELP_OVERVIEW,
  FINDINGS_HELP_PAGE_SUBTITLE,
} from "@/lib/findings/findings-help-guide-content";

describe("findings help drift guard", () => {
  it("keeps claim discipline free of Sources package jargon", () => {
    for (const phrase of FINDINGS_HELP_NEGATION_DRIFT_MARKERS.claimMustNotContain) {
      expect(FINDINGS_HELP_CLAIM_DISCIPLINE.toLowerCase(), `claim must not contain "${phrase}"`).not.toContain(phrase);
    }
  });

  it("keeps overview free of diligence negation drift", () => {
    for (const phrase of FINDINGS_HELP_NEGATION_DRIFT_MARKERS.overviewMustNotContain) {
      expect(FINDINGS_HELP_OVERVIEW.toLowerCase(), `overview must not contain "${phrase}"`).not.toContain(
        phrase.toLowerCase(),
      );
    }
  });

  it("keeps overview distinct from the page subtitle", () => {
    expect(FINDINGS_HELP_OVERVIEW).not.toBe(FINDINGS_HELP_PAGE_SUBTITLE);
  });

  it("lists ten guide headings including claim discipline and follow-ups", () => {
    expect(FINDINGS_HELP_GUIDE_HEADINGS).toHaveLength(10);
    expect(FINDINGS_HELP_GUIDE_HEADINGS[9]?.id).toBe("where-to-go-next");
    expect(
      FINDINGS_HELP_GUIDE_HEADINGS.some((heading) => heading.id === "help-findings-claim-discipline-heading"),
    ).toBe(true);
  });

  it("lists findings help sources with unique hrefs and no self-href", () => {
    const sourceHrefs = FINDINGS_HELP_SOURCES.map((source) => source.href);

    expect(new Set(sourceHrefs).size).toBe(sourceHrefs.length);
    expect(FINDINGS_HELP_SOURCES.every((source) => source.href.startsWith("/"))).toBe(true);
    expect(sourceHrefs).not.toContain(FINDINGS_HELP_CANONICAL_PATH);
  });
});
