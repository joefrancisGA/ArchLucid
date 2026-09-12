import { describe, expect, it } from "vitest";

import { POLICY_PACK_INFLUENCE_HONESTY_LINE } from "@/components/reviews/PolicyPackInfluenceHonestyChip";
import {
  coerceSendableExportCoverFindingsFromSnapshot,
  formatSendableExportCoverMarkdown,
  resolveSendableExportCoverFindings,
} from "@/lib/export-markdown-sendable-cover";
import { SEMANTIC_SUPPORT_BAND_ASYNC_MAY_LAG_COPY } from "@/lib/semantic-support-band-async-honesty";

describe("formatSendableExportCoverMarkdown", () => {
  it("includes WK-21 policy influence on every sendable cover", () => {
    const markdown = formatSendableExportCoverMarkdown({ runId: "run-1" });

    expect(markdown).toContain("Policy influence");
    expect(markdown).toContain(POLICY_PACK_INFLUENCE_HONESTY_LINE);
    expect(markdown).toContain("Sponsor ROI");
    expect(markdown).toContain("do not sum to the headline");
  });

  it("includes Lane B disclaimer when decision-grade findings include Unchecked bands", () => {
    const markdown = formatSendableExportCoverMarkdown({
      runId: "run-1",
      findings: [
        {
          classification: "DecisionGradeFinding",
          semanticSupportBand: "Unchecked",
        },
      ],
    });

    expect(markdown).toContain("Semantic support");
    expect(markdown).toContain(SEMANTIC_SUPPORT_BAND_ASYNC_MAY_LAG_COPY);
  });

  it("omits Lane B disclaimer when no unchecked decision-grade bands exist", () => {
    const markdown = formatSendableExportCoverMarkdown({
      runId: "run-1",
      findings: [
        {
          classification: "DecisionGradeFinding",
          semanticSupportBand: "Supported",
        },
      ],
    });

    expect(markdown).not.toContain(SEMANTIC_SUPPORT_BAND_ASYNC_MAY_LAG_COPY);
  });
});

describe("resolveSendableExportCoverFindings", () => {
  it("prefers exportFindings over findingsSnapshot wire", () => {
    const findings = resolveSendableExportCoverFindings({
      exportFindings: [{ classification: "DecisionGradeFinding", semanticSupportBand: "Supported" }],
      findingsSnapshot: { findings: [{ classification: "DecisionGradeFinding", semanticSupportBand: "Unchecked" }] },
    });

    expect(findings).toHaveLength(1);
    expect(findings[0]?.semanticSupportBand).toBe("Supported");
  });

  it("coerces findingsSnapshot wire when exportFindings are absent", () => {
    const findings = coerceSendableExportCoverFindingsFromSnapshot({
      findings: [{ classification: "DecisionGradeFinding", semanticSupportBand: "Unchecked" }],
    });

    expect(findings[0]?.semanticSupportBand).toBe("Unchecked");
  });
});
