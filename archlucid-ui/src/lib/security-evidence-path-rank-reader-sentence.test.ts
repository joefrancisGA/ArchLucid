import { describe, expect, it } from "vitest";

import {
  formatSecurityEvidencePathRankReaderSentence,
  SECURITY_EVIDENCE_PATH_RANK_NO_LEADING_REASON,
} from "@/lib/security-evidence-path-rank-reader-sentence";

describe("formatSecurityEvidencePathRankReaderSentence", () => {
  it("names the two strongest dimension scores", () => {
    expect(
      formatSecurityEvidencePathRankReaderSentence({
        technicalExposureScore: 0.9,
        privilegeDepthScore: 0.8,
        blastRadiusScore: 0.7,
        businessConsequenceScore: null,
      }),
    ).toBe("Exposed on the network. Deep privilege.");
  });

  it("breaks score ties in the fixed dimension order", () => {
    expect(
      formatSecurityEvidencePathRankReaderSentence({
        technicalExposureScore: 0.5,
        privilegeDepthScore: 0.5,
        blastRadiusScore: 0.1,
        businessConsequenceScore: 0.5,
      }),
    ).toBe("Exposed on the network. Deep privilege.");
  });

  it("ignores null business consequence and zero scores", () => {
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
