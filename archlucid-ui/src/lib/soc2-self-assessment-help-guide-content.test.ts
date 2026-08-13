import { describe, expect, it } from "vitest";

import {
  SOC2_SELF_ASSESSMENT_HELP_CANONICAL_PATH,
  SOC2_SELF_ASSESSMENT_HELP_CLAIM_DISCIPLINE,
  SOC2_SELF_ASSESSMENT_HELP_JOB_MATRIX,
  SOC2_SELF_ASSESSMENT_HELP_ORIENTATION,
  SOC2_SELF_ASSESSMENT_HELP_PRIMARY_ACTIONS,
  SOC2_SELF_ASSESSMENT_HELP_SOURCES,
  formatSoc2SelfAssessmentHelpReviewedCopy,
} from "@/lib/soc2-self-assessment-help-guide-content";

describe("soc2-self-assessment-help-guide-content", () => {
  it("keeps primary CTAs on Trust Center, CAIQ/SIG, and procurement", () => {
    expect(SOC2_SELF_ASSESSMENT_HELP_PRIMARY_ACTIONS.openTrustCenter.href).toBe("/trust");
    expect(SOC2_SELF_ASSESSMENT_HELP_PRIMARY_ACTIONS.openCaiqSig.href).toBe("/help/caiq-sig-response");
    expect(SOC2_SELF_ASSESSMENT_HELP_PRIMARY_ACTIONS.openProcurement.href).toBe("/help/procurement");
  });

  it("lists orientation steps without implying CPA attestation", () => {
    expect(SOC2_SELF_ASSESSMENT_HELP_ORIENTATION).toHaveLength(3);
    expect(SOC2_SELF_ASSESSMENT_HELP_ORIENTATION.join(" ").toLowerCase()).not.toContain("type ii report");
  });

  it("splits diligence jobs across self-assessment, CAIQ, Trust, and procurement", () => {
    expect(SOC2_SELF_ASSESSMENT_HELP_JOB_MATRIX).toHaveLength(4);
    expect(
      SOC2_SELF_ASSESSMENT_HELP_JOB_MATRIX.some((row) => row.href === SOC2_SELF_ASSESSMENT_HELP_CANONICAL_PATH),
    ).toBe(false);
    expect(
      SOC2_SELF_ASSESSMENT_HELP_JOB_MATRIX.some((row) => row.label === "This SOC 2 self-assessment"),
    ).toBe(true);
    expect(SOC2_SELF_ASSESSMENT_HELP_JOB_MATRIX.some((row) => row.href === "/trust")).toBe(true);
    expect(SOC2_SELF_ASSESSMENT_HELP_JOB_MATRIX.some((row) => row.href === "/help/caiq-sig-response")).toBe(
      true,
    );
  });

  it("formats last-reviewed provenance copy with source doc reference", () => {
    expect(formatSoc2SelfAssessmentHelpReviewedCopy("2026-05-26")).toContain("2026-05-26");
    expect(formatSoc2SelfAssessmentHelpReviewedCopy("2026-05-26")).toContain("SOC2_SELF_ASSESSMENT_2026.md");
    expect(formatSoc2SelfAssessmentHelpReviewedCopy("2026-05-26").toLowerCase()).toContain("last reviewed");
  });

  it("lists Sources without a self-link to this topic", () => {
    expect(
      SOC2_SELF_ASSESSMENT_HELP_SOURCES.some((link) => link.href === SOC2_SELF_ASSESSMENT_HELP_CANONICAL_PATH),
    ).toBe(false);
    expect(SOC2_SELF_ASSESSMENT_HELP_SOURCES.some((link) => link.href === "/trust")).toBe(true);
  });

  it("states claim discipline without implying CPA attestation or pen-test publication", () => {
    expect(SOC2_SELF_ASSESSMENT_HELP_CLAIM_DISCIPLINE.toLowerCase()).toContain("self-assessment");
    expect(SOC2_SELF_ASSESSMENT_HELP_CLAIM_DISCIPLINE.toLowerCase()).toContain("cpa");
    expect(SOC2_SELF_ASSESSMENT_HELP_CLAIM_DISCIPLINE.toLowerCase()).toContain("pen test");
  });
});
