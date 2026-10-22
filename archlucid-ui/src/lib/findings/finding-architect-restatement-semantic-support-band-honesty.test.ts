import { describe, expect, it } from "vitest";

import {
  ARCHITECT_RESTATEMENT_SEMANTIC_SUPPORT_BAND_DISPOSITION_COPY,
  ARCHITECT_RESTATEMENT_SEMANTIC_SUPPORT_BAND_RESTATEMENT_LINE_COPY,
  latestTrailBackedArchitectRestatement,
  resolveArchitectRestatementHumanJudgmentBand,
  shouldShowArchitectRestatementSemanticSupportBandSplit,
} from "@/lib/findings/finding-architect-restatement-semantic-support-band-honesty";

describe("finding-architect-restatement-semantic-support-band-honesty (AS-070)", () => {
  it("disposition copy states restatement does not change claim band", () => {
    expect(ARCHITECT_RESTATEMENT_SEMANTIC_SUPPORT_BAND_DISPOSITION_COPY).toContain("human judgment");
    expect(ARCHITECT_RESTATEMENT_SEMANTIC_SUPPORT_BAND_DISPOSITION_COPY).toContain(
      "does not change the semantic support band",
    );
  });

  it("latestTrailBackedArchitectRestatement returns newest non-blank restatement", () => {
    expect(
      latestTrailBackedArchitectRestatement([
        { architectRestatement: "   " },
        { architectRestatement: "We will tell the ARB that replication lag is accepted." },
      ]),
    ).toBe("We will tell the ARB that replication lag is accepted.");
  });

  it("resolveArchitectRestatementHumanJudgmentBand maps Supported to NotScored", () => {
    expect(resolveArchitectRestatementHumanJudgmentBand("Supported")).toBe("NotScored");
    expect(resolveArchitectRestatementHumanJudgmentBand("Unsupported")).toBe("Unsupported");
    expect(resolveArchitectRestatementHumanJudgmentBand(null)).toBe("NotScored");
  });

  it("shouldShowArchitectRestatementSemanticSupportBandSplit is true when restatement exists", () => {
    expect(shouldShowArchitectRestatementSemanticSupportBandSplit("ARB wording")).toBe(true);
    expect(shouldShowArchitectRestatementSemanticSupportBandSplit("  ")).toBe(false);
    expect(shouldShowArchitectRestatementSemanticSupportBandSplit(null)).toBe(false);
  });

  it("restatement line copy never implies Supported", () => {
    expect(ARCHITECT_RESTATEMENT_SEMANTIC_SUPPORT_BAND_RESTATEMENT_LINE_COPY).toContain(
      "not scored as Supported",
    );
  });
});
