import { describe, expect, it } from "vitest";

import {
  formatSecurityEvidencePathRankReaderSentence,
  SECURITY_EVIDENCE_PATH_RANK_NO_LEADING_REASON,
} from "@/lib/security-evidence-path-rank-reader-sentence";

describe("formatSecurityEvidencePathRankReaderSentence", () => {
  it("joins the top two dimensions by score with tie-break order", () => {
    const sentence = formatSecurityEvidencePathRankReaderSentence({
      technicalExposureScore: 0.9,
      privilegeDepthScore: 0.8,
      blastRadiusScore: 0.7,
      businessConsequenceScore: null,
    });

    expect(sentence).toBe("Exposed on the network. Deep privilege.");
  });

  it("breaks ties in favor of technical exposure then privilege depth", () => {
    const sentence = formatSecurityEvidencePathRankReaderSentence({
      technicalExposureScore: 0.5,
      privilegeDepthScore: 0.5,
      blastRadiusScore: 0.5,
      businessConsequenceScore: 0.5,
    });

    expect(sentence).toBe("Exposed on the network. Deep privilege.");
  });

  it("skips null business consequence", () => {
    const sentence = formatSecurityEvidencePathRankReaderSentence({
      technicalExposureScore: 0,
      privilegeDepthScore: 0,
      blastRadiusScore: 0.4,
      businessConsequenceScore: null,
    });

    expect(sentence).toBe("Wide blast radius.");
  });

  it("labels omitted rank scores as not stored", () => {
    expect(
      formatSecurityEvidencePathRankReaderSentence({
        technicalExposureScore: null,
        privilegeDepthScore: null,
        blastRadiusScore: null,
        businessConsequenceScore: null,
      }),
    ).toBe("Path rank scores were not stored.");
  });

  it("returns the empty copy when every dimension is zero", () => {
    const sentence = formatSecurityEvidencePathRankReaderSentence({
      technicalExposureScore: 0,
      privilegeDepthScore: 0,
      blastRadiusScore: 0,
      businessConsequenceScore: 0,
    });

    expect(sentence).toBe(SECURITY_EVIDENCE_PATH_RANK_NO_LEADING_REASON);
  });

  it("ignores null business consequence and zero scores for the empty copy", () => {
    expect(
      formatSecurityEvidencePathRankReaderSentence({
        technicalExposureScore: 0,
        privilegeDepthScore: 0,
        blastRadiusScore: 0,
        businessConsequenceScore: null,
      }),
    ).toBe(SECURITY_EVIDENCE_PATH_RANK_NO_LEADING_REASON);
  });

  it("does not put a decimal or a percent sign in the sentence", () => {
    const sentence = formatSecurityEvidencePathRankReaderSentence({
      technicalExposureScore: 0.42,
      privilegeDepthScore: 0,
      blastRadiusScore: 0,
      businessConsequenceScore: null,
    });

    expect(sentence).toBe("Exposed on the network.");
    expect(sentence).not.toMatch(/\d/);
    expect(sentence).not.toContain("%");
  });
});
