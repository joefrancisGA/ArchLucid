import { describe, expect, it } from "vitest";

import {
  GOVERNANCE_APPROVAL_HELP_CANONICAL_PATH,
  GOVERNANCE_APPROVAL_HELP_CLAIM_DISCIPLINE,
  GOVERNANCE_APPROVAL_HELP_SOURCES,
} from "@/lib/governance/governance-approval-help-evidence-copy";
import {
  GOVERNANCE_APPROVAL_HELP_GUIDE_HEADINGS,
  GOVERNANCE_APPROVAL_HELP_NEGATION_DRIFT_MARKERS,
  GOVERNANCE_APPROVAL_HELP_OVERVIEW,
} from "@/lib/governance/governance-approval-help-guide-content";

describe("approval help drift guard", () => {
  it("keeps claim discipline free of Sources package jargon", () => {
    for (const phrase of GOVERNANCE_APPROVAL_HELP_NEGATION_DRIFT_MARKERS.claimMustNotContain) {
      expect(GOVERNANCE_APPROVAL_HELP_CLAIM_DISCIPLINE.toLowerCase(), `claim must not contain "${phrase}"`).not.toContain(
        phrase,
      );
    }
  });

  it("keeps overview distinct from claim discipline body", () => {
    expect(GOVERNANCE_APPROVAL_HELP_OVERVIEW).not.toBe(GOVERNANCE_APPROVAL_HELP_CLAIM_DISCIPLINE);
  });

  it("lists guide headings including claim discipline and where-to-go-next", () => {
    expect(
      GOVERNANCE_APPROVAL_HELP_GUIDE_HEADINGS.some(
        (heading) => heading.id === "help-governance-approval-claim-discipline-heading",
      ),
    ).toBe(true);
    expect(GOVERNANCE_APPROVAL_HELP_GUIDE_HEADINGS.some((heading) => heading.id === "where-to-go-next")).toBe(true);
  });

  it("lists approval help sources with unique hrefs and no self-href", () => {
    const sourceHrefs = GOVERNANCE_APPROVAL_HELP_SOURCES.map((source) => source.href);

    expect(new Set(sourceHrefs).size).toBe(sourceHrefs.length);
    expect(GOVERNANCE_APPROVAL_HELP_SOURCES.every((source) => source.href.startsWith("/"))).toBe(true);
    expect(sourceHrefs).not.toContain(GOVERNANCE_APPROVAL_HELP_CANONICAL_PATH);
  });
});
