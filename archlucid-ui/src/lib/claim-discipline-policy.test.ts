import { describe, expect, it } from "vitest";

import {
  CLAIM_DISCIPLINE_BAND_OMIT_SLUGS,
  expectsVisibleClaimDisciplineBand,
  resolveClaimDisciplineForStrip,
  resolveGuideHeadingsForStrip,
  shouldOmitClaimDisciplineBand,
} from "@/lib/claim-discipline-policy";

describe("claim-discipline-policy", () => {
  it("omits low-risk operational slugs", () => {
    expect(shouldOmitClaimDisciplineBand("help-preferences")).toBe(true);
    expect(shouldOmitClaimDisciplineBand("preferences-settings")).toBe(true);
    expect(shouldOmitClaimDisciplineBand("cloud-connections-gcp")).toBe(true);
    expect(shouldOmitClaimDisciplineBand("provenance")).toBe(true);
    expect(shouldOmitClaimDisciplineBand("sealed-record-detail")).toBe(true);
  });

  it("keeps print-orientation slugs that must ship a visible claim band", () => {
    expect(shouldOmitClaimDisciplineBand("package-print")).toBe(false);
    expect(expectsVisibleClaimDisciplineBand("package-print")).toBe(true);
  });

  it("folds operator hub slugs into the page title block", () => {
    expect(shouldOmitClaimDisciplineBand("pilot-outcomes")).toBe(true);
    expect(shouldOmitClaimDisciplineBand("roi-summary")).toBe(true);
    expect(shouldOmitClaimDisciplineBand("architecture-scorecard")).toBe(true);
    expect(shouldOmitClaimDisciplineBand("audit-trail")).toBe(true);
    expect(shouldOmitClaimDisciplineBand("help-hub")).toBe(true);
  });

  it("resolveClaimDisciplineForStrip returns undefined for omitted slugs", () => {
    expect(resolveClaimDisciplineForStrip("help-system-health", "not a package.")).toBeUndefined();
    expect(resolveClaimDisciplineForStrip("findings-help", "not a package.")).toBeUndefined();
    expect(resolveClaimDisciplineForStrip("findings-help", undefined)).toBeUndefined();
    expect(resolveClaimDisciplineForStrip("enterprise-onboarding-help", "not a package.")).toBeUndefined();
    expect(resolveClaimDisciplineForStrip("integration-readiness-help", "not a package.")).toBeUndefined();
    expect(resolveClaimDisciplineForStrip("repeat-review-loop-help", "not a package.")).toBeUndefined();
    expect(resolveClaimDisciplineForStrip("help-standards-rules", "not a package.")).toBeUndefined();
    expect(resolveClaimDisciplineForStrip("comparison-replay-help", "not a package.")).toBeUndefined();
    expect(resolveClaimDisciplineForStrip("help-accelerator-chooser", "not a package.")).toBeUndefined();
    expect(resolveClaimDisciplineForStrip("help-path-chooser", "not a package.")).toBeUndefined();
    expect(resolveClaimDisciplineForStrip("help-first-review", "not a package.")).toBeUndefined();
    expect(resolveClaimDisciplineForStrip("help-roi-summary", "not a package.")).toBeUndefined();
    expect(resolveClaimDisciplineForStrip("help-evidence-graph", "not a package.")).toBeUndefined();
    expect(resolveClaimDisciplineForStrip("help-search-review-evidence", "not a package.")).toBeUndefined();
    expect(resolveClaimDisciplineForStrip("help-architecture-scorecard", "not a package.")).toBeUndefined();
    expect(resolveClaimDisciplineForStrip("help-architecture-intelligence", "not a package.")).toBeUndefined();
    expect(resolveClaimDisciplineForStrip("help-decision-register", "not a package.")).toBeUndefined();
    expect(resolveClaimDisciplineForStrip("help-impact-preview", "not a package.")).toBeUndefined();
    expect(resolveClaimDisciplineForStrip("help-improvement-planning", "not a package.")).toBeUndefined();
    expect(resolveClaimDisciplineForStrip("help-structured-brief", "not a package.")).toBeUndefined();
    expect(resolveClaimDisciplineForStrip("help-pilot-feedback", "not a package.")).toBeUndefined();
    expect(resolveClaimDisciplineForStrip("help-azure-boards", "not a package.")).toBeUndefined();
    expect(resolveClaimDisciplineForStrip("help-soc2-self-assessment", "not a package.")).toBeUndefined();
    expect(resolveClaimDisciplineForStrip("help-dpa-template", "not a package.")).toBeUndefined();
    expect(resolveClaimDisciplineForStrip("help-caiq-sig-response", "not a package.")).toBeUndefined();
  });

  it("expectsVisibleClaimDisciplineBand mirrors omit policy", () => {
    expect(expectsVisibleClaimDisciplineBand("help-digests")).toBe(false);
    expect(expectsVisibleClaimDisciplineBand("help-decision-register")).toBe(false);
    expect(expectsVisibleClaimDisciplineBand("help-impact-preview")).toBe(false);
    expect(expectsVisibleClaimDisciplineBand("help-improvement-planning")).toBe(false);
    expect(expectsVisibleClaimDisciplineBand("help-structured-brief")).toBe(false);
    expect(expectsVisibleClaimDisciplineBand("help-pilot-feedback")).toBe(false);
    expect(expectsVisibleClaimDisciplineBand("help-azure-boards")).toBe(false);
    expect(expectsVisibleClaimDisciplineBand("help-soc2-self-assessment")).toBe(false);
    expect(expectsVisibleClaimDisciplineBand("help-dpa-template")).toBe(false);
    expect(expectsVisibleClaimDisciplineBand("help-caiq-sig-response")).toBe(false);
  });

  it("has no duplicate omit slugs", () => {
    expect(CLAIM_DISCIPLINE_BAND_OMIT_SLUGS.size).toBe([...CLAIM_DISCIPLINE_BAND_OMIT_SLUGS].length);
  });

  it("resolveGuideHeadingsForStrip drops claim heading for omitted slugs", () => {
    const headings = [
      { id: "overview", title: "Overview" },
      { id: "help-preferences-claim-discipline-heading", title: "Claim discipline" },
      { id: "where-to-go-next", title: "Where to go next" },
    ] as const;

    expect(
      resolveGuideHeadingsForStrip("help-preferences", headings, "help-preferences-claim-discipline-heading"),
    ).toEqual([headings[0], headings[2]]);
    expect(
      resolveGuideHeadingsForStrip("help-evidence-graph", headings, "help-preferences-claim-discipline-heading"),
    ).toEqual([headings[0], headings[2]]);
  });
});
