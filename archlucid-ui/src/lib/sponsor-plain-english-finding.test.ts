import { describe, expect, it } from "vitest";

import { FINDING_DERIVATION_NOT_AVAILABLE } from "@/lib/findings/finding-derivation-sentence";
import {
  buildSponsorPlainEnglishFinding,
  SPONSOR_PLAIN_ENGLISH_CAUTION,
  sponsorSeverityUrgencyClause,
} from "@/lib/sponsor-plain-english-finding";

describe("sponsor-plain-english-finding (TB-2192)", () => {
  it("builds headline, plain English, and caution from title, message, and severity", () => {
    const result = buildSponsorPlainEnglishFinding({
      title: "Public ingress on intake API",
      message: "The intake API accepts traffic from the public internet.",
      severity: "High",
    });

    expect(result.headline).toBe("High finding: Public ingress on intake API");
    expect(result.plainEnglish).toContain("elevated concern");
    expect(result.plainEnglish).toContain(
      "In plain terms: The intake API accepts traffic from the public internet.",
    );
    expect(result.sponsorCaution).toBe(SPONSOR_PLAIN_ENGLISH_CAUTION);
    expect(result.plainEnglish).toContain("does not add proof");
  });

  it("handles nulls and empty strings without inventing a finding message", () => {
    const result = buildSponsorPlainEnglishFinding({
      title: "   ",
      message: null,
      severity: undefined,
      derivationSentence: "  ",
      residualRisk: null,
    });

    expect(result.headline).toBe("Architecture review finding");
    expect(result.plainEnglish).toContain("still needs a human disposition");
    expect(result.plainEnglish).toContain(
      "No sponsor-safe finding summary was supplied beyond severity and related notes.",
    );
    expect(result.plainEnglish).not.toContain("How reviewers derived it");
    expect(result.plainEnglish).not.toContain("Residual risk note");
    expect(result.sponsorCaution).toBe(SPONSOR_PLAIN_ENGLISH_CAUTION);
  });

  it("maps severity bands to distinct sponsor urgency clauses", () => {
    expect(sponsorSeverityUrgencyClause("Critical")).toContain("material delivery");
    expect(sponsorSeverityUrgencyClause("High")).toContain("elevated concern");
    expect(sponsorSeverityUrgencyClause("Medium")).toContain("planning-priority");
    expect(sponsorSeverityUrgencyClause("Info")).toContain("improvement opportunity");
    expect(sponsorSeverityUrgencyClause(null)).toContain("human disposition");
  });

  it("includes derivation and residual risk when present, skips unavailable derivation", () => {
    const withExtras = buildSponsorPlainEnglishFinding({
      title: "PHI minimization gap",
      message: "OCR bypass may retain residual PHI.",
      severity: "High",
      derivationSentence: 'Policy rule "PHI minimization" produced a High severity finding.',
      residualRisk: "Accepted with weekly sampling by the privacy owner.",
    });

    expect(withExtras.plainEnglish).toContain("How reviewers derived it:");
    expect(withExtras.plainEnglish).toContain("Residual risk note:");
    expect(withExtras.plainEnglish).toContain("weekly sampling");

    const withoutDerivation = buildSponsorPlainEnglishFinding({
      title: "PHI minimization gap",
      message: "OCR bypass may retain residual PHI.",
      severity: "High",
      derivationSentence: FINDING_DERIVATION_NOT_AVAILABLE,
    });

    expect(withoutDerivation.plainEnglish).not.toContain("How reviewers derived it");
  });

  it("falls back to titled finding language when message is empty", () => {
    const result = buildSponsorPlainEnglishFinding({
      title: "Missing private endpoint",
      message: "",
      severity: "Low",
    });

    expect(result.headline).toBe("Low finding: Missing private endpoint");
    expect(result.plainEnglish).toContain('The recorded finding is titled "Missing private endpoint".');
  });
});
