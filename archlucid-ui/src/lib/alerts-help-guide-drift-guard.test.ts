import { describe, expect, it } from "vitest";

import {
  ALERTS_HELP_CANONICAL_PATH,
  ALERTS_HELP_CLAIM_DISCIPLINE,
  ALERTS_HELP_SOURCES,
} from "@/lib/alerts-help-evidence-copy";
import {
  ALERTS_HELP_GUIDE_HEADINGS,
  ALERTS_HELP_NEGATION_DRIFT_MARKERS,
  ALERTS_HELP_OVERVIEW,
} from "@/lib/alerts-help-guide-content";

describe("alerts help drift guard", () => {
  it("keeps claim discipline free of Sources package jargon", () => {
    for (const phrase of ALERTS_HELP_NEGATION_DRIFT_MARKERS.claimMustNotContain) {
      expect(ALERTS_HELP_CLAIM_DISCIPLINE.toLowerCase(), `claim must not contain "${phrase}"`).not.toContain(phrase);
    }
  });

  it("keeps overview distinct from claim discipline body", () => {
    expect(ALERTS_HELP_OVERVIEW).not.toBe(ALERTS_HELP_CLAIM_DISCIPLINE);
  });

  it("lists guide headings including claim discipline and where-to-go-next", () => {
    expect(
      ALERTS_HELP_GUIDE_HEADINGS.some((heading) => heading.id === "help-alerts-claim-discipline-heading"),
    ).toBe(true);
    expect(ALERTS_HELP_GUIDE_HEADINGS.some((heading) => heading.id === "where-to-go-next")).toBe(true);
  });

  it("lists alerts help sources with unique hrefs and no self-href", () => {
    const sourceHrefs = ALERTS_HELP_SOURCES.map((source) => source.href);

    expect(new Set(sourceHrefs).size).toBe(sourceHrefs.length);
    expect(ALERTS_HELP_SOURCES.every((source) => source.href.startsWith("/"))).toBe(true);
    expect(sourceHrefs).not.toContain(ALERTS_HELP_CANONICAL_PATH);
  });
});
