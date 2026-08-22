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

  it("keeps diligence-sensitive slugs", () => {
    expect(shouldOmitClaimDisciplineBand("help-evidence-graph")).toBe(false);
    expect(shouldOmitClaimDisciplineBand("audit-trail-help")).toBe(false);
    expect(shouldOmitClaimDisciplineBand("security-trust-help")).toBe(false);
    expect(shouldOmitClaimDisciplineBand("see-it")).toBe(false);
    expect(shouldOmitClaimDisciplineBand("architecture-findings")).toBe(false);
  });

  it("resolveClaimDisciplineForStrip returns undefined for omitted slugs", () => {
    expect(resolveClaimDisciplineForStrip("help-system-health", "not a package.")).toBeUndefined();
    expect(resolveClaimDisciplineForStrip("findings-help", "not a package.")).toBe("not a package.");
    expect(resolveClaimDisciplineForStrip("findings-help", undefined)).toBeUndefined();
  });

  it("expectsVisibleClaimDisciplineBand mirrors omit policy", () => {
    expect(expectsVisibleClaimDisciplineBand("help-digests")).toBe(false);
    expect(expectsVisibleClaimDisciplineBand("help-decision-register")).toBe(true);
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
    ).toEqual(headings);
  });
});
