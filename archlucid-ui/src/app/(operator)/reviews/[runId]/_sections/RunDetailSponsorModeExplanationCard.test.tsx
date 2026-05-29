import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import type { QuickDecisionFinding } from "@/lib/quick-decision-summary-derive";
import type { RunExplanationSummary } from "@/types/explanation";

import { RunDetailSponsorModeExplanationCard } from "./RunDetailSponsorModeExplanationCard";

function finding(input: Partial<QuickDecisionFinding> = {}): QuickDecisionFinding {
  return {
    findingId: input.findingId ?? "finding-1",
    title: input.title ?? "Encrypt PHI evidence stores before launch",
    recommendation: input.recommendation ?? "Enable storage encryption and verify key ownership.",
    severityValue: input.severityValue ?? 2,
    findingOrder: input.findingOrder ?? 0,
    aiReasoning: input.aiReasoning ?? { wireJson: "{}", reasoningTrace: "" },
    isMuted: input.isMuted ?? false,
    muteReason: input.muteReason ?? null,
    confidenceLevel: input.confidenceLevel,
    evaluationConfidenceScore: input.evaluationConfidenceScore,
    traceConfidenceLabel: input.traceConfidenceLabel,
    evidenceRefCount: input.evidenceRefCount,
    iacStub: input.iacStub,
  };
}

const summary: RunExplanationSummary = {
  explanation: {
    rawText: "",
    structured: null,
    confidence: 0.85,
    provenance: null,
    summary: "The architecture review is sponsor-ready with two focused risks.",
    keyDrivers: [],
    riskImplications: [],
    costImplications: [],
    complianceImplications: [],
    detailedNarrative: "",
  },
  themeSummaries: [],
  overallAssessment: "The architecture is viable if the top data-protection gaps are remediated.",
  riskPosture: "Moderate",
  findingCount: 2,
  decisionCount: 4,
  unresolvedIssueCount: 1,
  complianceGapCount: 1,
  faithfulnessSupportRatio: 0.86,
  citations: [
    {
      kind: "Manifest",
      id: "manifest-1",
      label: "Committed manifest",
      runId: "run-1",
    },
  ],
};

describe("RunDetailSponsorModeExplanationCard", () => {
  it("summarizes sponsor-ready explanation with evidence labels", () => {
    render(
      <RunDetailSponsorModeExplanationCard
        explanationSummary={summary}
        findings={[
          finding({ findingId: "low", title: "Low priority", severityValue: 0, findingOrder: 0 }),
          finding({ findingId: "high", title: "Fix public storage", severityValue: 2, findingOrder: 1 }),
        ]}
        buyerPolishedArtifactTable={false}
      />,
    );

    expect(screen.getByRole("heading", { name: /explain this review like i am the sponsor/i })).toBeInTheDocument();
    expect(screen.getByText(/The architecture is viable/i)).toBeInTheDocument();
    expect(screen.getByText("1 persisted citation")).toBeInTheDocument();
    expect(screen.getByText("Evidence-backed")).toBeInTheDocument();
    expect(screen.getByText(/High:/i)).toBeInTheDocument();
    expect(screen.getByText(/Fix public storage/i)).toBeInTheDocument();
    expect(screen.getByText(/not a legal or compliance attestation/i)).toBeInTheDocument();
  });

  it("caveats low-support explanations before sponsor send", () => {
    render(
      <RunDetailSponsorModeExplanationCard
        explanationSummary={{ ...summary, faithfulnessSupportRatio: 0.4, citations: [] }}
        findings={[finding()]}
        buyerPolishedArtifactTable
      />,
    );

    expect(screen.getByText(/committed manifest and finding records/i)).toBeInTheDocument();
    expect(screen.getByText("Low support")).toBeInTheDocument();
    expect(screen.getByText(/send the executive briefing package/i)).toBeInTheDocument();
  });
});
