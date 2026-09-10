import { describe, expect, it } from "vitest";

import {
  GOVERNANCE_INFRASTRUCTURE_DRIFT_HELP_CANONICAL_PATH,
  GOVERNANCE_INFRASTRUCTURE_DRIFT_HELP_CLAIM_DISCIPLINE,
  GOVERNANCE_INFRASTRUCTURE_DRIFT_HELP_SOURCES,
} from "@/lib/governance/governance-infrastructure-drift-help-evidence-copy";
import {
  GOVERNANCE_INFRASTRUCTURE_DRIFT_HELP_GUIDE_HEADINGS,
  GOVERNANCE_INFRASTRUCTURE_DRIFT_HELP_NEGATION_DRIFT_MARKERS,
  GOVERNANCE_INFRASTRUCTURE_DRIFT_HELP_OVERVIEW,
  GOVERNANCE_INFRASTRUCTURE_DRIFT_HELP_PAGE_SUBTITLE,
  GOVERNANCE_INFRASTRUCTURE_DRIFT_HELP_PRIMARY_ACTION,
} from "@/lib/governance/governance-infrastructure-drift-help-guide-content";
import { GOVERNANCE_INFRASTRUCTURE_DRIFT_PAGE_LEAD } from "@/lib/governance/governance-infrastructure-copy";
import { GOVERNANCE_INFRASTRUCTURE_DRIFT_PATH } from "@/lib/governance/governance-infrastructure-route-paths";

describe("governance infrastructure drift help drift guard", () => {
  it("keeps claim discipline free of Sources package jargon", () => {
    for (const phrase of GOVERNANCE_INFRASTRUCTURE_DRIFT_HELP_NEGATION_DRIFT_MARKERS.claimMustNotContain) {
      expect(
        GOVERNANCE_INFRASTRUCTURE_DRIFT_HELP_CLAIM_DISCIPLINE.toLowerCase(),
        `claim must not contain "${phrase}"`,
      ).not.toContain(phrase);
    }
  });

  it("keeps overview free of diligence negation drift", () => {
    for (const phrase of GOVERNANCE_INFRASTRUCTURE_DRIFT_HELP_NEGATION_DRIFT_MARKERS.overviewMustNotContain) {
      expect(GOVERNANCE_INFRASTRUCTURE_DRIFT_HELP_OVERVIEW.toLowerCase(), `overview must not contain "${phrase}"`).not.toContain(
        phrase.toLowerCase(),
      );
    }
  });

  it("keeps page subtitle aligned with drift workbench lead copy", () => {
    expect(GOVERNANCE_INFRASTRUCTURE_DRIFT_HELP_PAGE_SUBTITLE).toBe(GOVERNANCE_INFRASTRUCTURE_DRIFT_PAGE_LEAD);
  });

  it("lists guide headings including claim discipline and where-to-go-next", () => {
    expect(
      GOVERNANCE_INFRASTRUCTURE_DRIFT_HELP_GUIDE_HEADINGS.some(
        (heading) => heading.id === "help-governance-infrastructure-drift-claim-discipline-heading",
      ),
    ).toBe(true);
    expect(GOVERNANCE_INFRASTRUCTURE_DRIFT_HELP_GUIDE_HEADINGS.some((heading) => heading.id === "where-to-go-next")).toBe(
      true,
    );
  });

  it("lists drift help sources with unique hrefs and no self-href", () => {
    const sourceHrefs = GOVERNANCE_INFRASTRUCTURE_DRIFT_HELP_SOURCES.map((source) => source.href);

    expect(new Set(sourceHrefs).size).toBe(sourceHrefs.length);
    expect(GOVERNANCE_INFRASTRUCTURE_DRIFT_HELP_SOURCES.every((source) => source.href.startsWith("/"))).toBe(true);
    expect(sourceHrefs).not.toContain(GOVERNANCE_INFRASTRUCTURE_DRIFT_HELP_CANONICAL_PATH);
    expect(sourceHrefs).not.toContain(GOVERNANCE_INFRASTRUCTURE_DRIFT_PATH);
  });

  it("links the primary action to the drift workbench", () => {
    expect(GOVERNANCE_INFRASTRUCTURE_DRIFT_HELP_PRIMARY_ACTION.href).toBe(GOVERNANCE_INFRASTRUCTURE_DRIFT_PATH);
  });
});
