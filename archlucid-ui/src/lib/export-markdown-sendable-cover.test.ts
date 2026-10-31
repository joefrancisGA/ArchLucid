import { describe, expect, it } from "vitest";

import { POLICY_PACK_INFLUENCE_HONESTY_LINE } from "@/components/reviews/PolicyPackInfluenceHonestyChip";
import {
  coerceSendableExportCoverFindingsFromSnapshot,
  formatSendableExportCoverMarkdown,
  resolveSendableExportCoverFindings,
} from "@/lib/export-markdown-sendable-cover";
import { SEMANTIC_SUPPORT_BAND_ASYNC_MAY_LAG_COPY } from "@/lib/semantic-support-band-async-honesty";

describe("formatSendableExportCoverMarkdown", () => {
  it("labels absent cover fields explicitly", () => {
    const markdown = formatSendableExportCoverMarkdown({});

    expect(markdown).toContain("Review id was not stored");
    expect(markdown).toContain("Policy pack was not stored");
    expect(markdown).toContain("Review record status was not stored");
    expect(markdown).toContain("Gate outcome was not stored");
    expect(markdown).toContain("Execution mode was not stored");
  });

  it("includes WK-21 policy influence on every sendable cover", () => {
    const markdown = formatSendableExportCoverMarkdown({ runId: "run-1" });

    expect(markdown).toContain("Policy influence");
    expect(markdown).toContain(POLICY_PACK_INFLUENCE_HONESTY_LINE);
    expect(markdown).not.toContain("headline savings");
  });

  it("distinguishes omitted sponsor ROI from a stored zero row count", () => {
    const omitted = formatSendableExportCoverMarkdown({ runId: "run-1" });
    const storedZero = formatSendableExportCoverMarkdown({ runId: "run-1", sponsorRoiRowCount: 0 });
    const withRows = formatSendableExportCoverMarkdown({ runId: "run-1", sponsorRoiRowCount: 2 });

    expect(omitted).toContain("Sponsor savings were not stored on this export cover.");
    expect(storedZero).toContain("No sponsor savings rows were stored.");
    expect(storedZero).not.toContain("Sponsor savings were not stored on this export cover.");
    expect(withRows).toContain("do not sum to the headline");
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

  it("distinguishes a missing verdict summary from a stored empty summary", () => {
    const missing = formatSendableExportCoverMarkdown({
      feasibilityVerdict: { kind: "SoftInfeasible", summary: null as never },
    });
    const storedEmpty = formatSendableExportCoverMarkdown({
      feasibilityVerdict: { kind: "SoftInfeasible", summary: "" },
    });

    expect(missing).toContain("Verdict summary was not stored.");
    expect(storedEmpty).toContain("Verdict summary was stored empty.");
    expect(storedEmpty).not.toContain("Verdict summary was not stored.");
  });

  it("reports an omitted verdict kind and preserves unexpected stored kinds", () => {
    const missing = formatSendableExportCoverMarkdown({
      feasibilityVerdict: { kind: undefined as never, summary: "No kind." },
    });
    const unexpected = formatSendableExportCoverMarkdown({
      feasibilityVerdict: { kind: "FutureKind" as never, summary: "Unknown kind." },
    });

    expect(missing).toContain("Verdict kind was not stored.");
    expect(unexpected).toContain("**Gate outcome:** FutureKind");
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

    expect(findings).not.toBeNull();
    expect(findings?.[0]?.semanticSupportBand).toBe("Unchecked");
  });

  it("returns null when findings snapshot omits the findings key", () => {
    expect(coerceSendableExportCoverFindingsFromSnapshot({})).toBeNull();
    expect(
      resolveSendableExportCoverFindings({
        exportFindings: null,
        findingsSnapshot: {},
      }),
    ).toBeNull();
  });

  it("preserves a missing findings snapshot as an omission", () => {
    expect(resolveSendableExportCoverFindings({
      exportFindings: null,
      findingsSnapshot: null,
    })).toBeNull();
  });
});
