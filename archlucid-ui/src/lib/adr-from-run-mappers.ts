import type { QuickDecisionFinding } from "@/lib/quick-decision-summary-derive";
import { sortQuickDecisionFindings } from "@/lib/quick-decision-summary-derive";
import type { RunExplanationSummary } from "@/types/explanation";
import { isDeterministicExplanationFallback } from "@/types/explanation";

import {
  DEFAULT_MAX_FINDINGS,
  EXCERPT_CAP,
  type AdrGeneratorExplanationSlice,
  type AdrGeneratorFindingSlice,
  type AdrGeneratorRunInput,
} from "./adr-from-run-slices";

function truncatePlain(text: string, maxChars: number): string {
  const t = text.trim();

  if (t.length === 0) {
    return "";
  }

  if (t.length <= maxChars) {
    return t;
  }

  return `${t.slice(0, Math.max(0, maxChars - 1))}…`;
}

function asTrimmedStrings(values: unknown): string[] {
  if (!Array.isArray(values)) {
    return [];
  }

  return values
    .filter((v): v is string => typeof v === "string" && v.trim().length > 0)
    .map((s) => s.trim());
}

/**
 * Maps aggregate explanation API shape into a JSON-safe slice for ADR drafting.
 */
export function buildAdrExplanationSlice(summary: RunExplanationSummary | null): AdrGeneratorExplanationSlice | null {
  if (summary === null) {
    return null;
  }

  const exp = summary.explanation;
  const structured = exp?.structured ?? null;
  const provenance = exp?.provenance ?? null;
  let provenanceLine: string | null = null;

  if (provenance !== null) {
    const agentType = typeof provenance.agentType === "string" ? provenance.agentType.trim() : "";
    const modelId = typeof provenance.modelId === "string" ? provenance.modelId.trim() : "";

    if (agentType.length > 0 || modelId.length > 0) {
      provenanceLine = [agentType, modelId].filter((s) => s.length > 0).join(" · ");
    }
  }

  return {
    overallAssessment: typeof summary.overallAssessment === "string" ? summary.overallAssessment.trim() : "",
    riskPosture: typeof summary.riskPosture === "string" ? summary.riskPosture.trim() : "",
    themeSummaries: asTrimmedStrings(summary.themeSummaries),
    summary: typeof exp?.summary === "string" ? exp.summary.trim() : "",
    keyDrivers: asTrimmedStrings(exp?.keyDrivers),
    riskImplications: asTrimmedStrings(exp?.riskImplications),
    costImplications: asTrimmedStrings(exp?.costImplications),
    complianceImplications: asTrimmedStrings(exp?.complianceImplications),
    detailedNarrative: typeof exp?.detailedNarrative === "string" ? exp.detailedNarrative.trim() : "",
    structuredReasoning: typeof structured?.reasoning === "string" ? structured.reasoning.trim() : null,
    alternativesConsidered:
      structured !== null && Array.isArray(structured.alternativesConsidered)
        ? asTrimmedStrings(structured.alternativesConsidered)
        : null,
    caveats:
      structured !== null && Array.isArray(structured.caveats) ? asTrimmedStrings(structured.caveats) : null,
    provenanceLine,
    faithfulnessWarning: typeof summary.faithfulnessWarning === "string" ? summary.faithfulnessWarning.trim() : null,
    deterministicFallbackUsed: isDeterministicExplanationFallback(summary),
  };
}

/**
 * Builds ADR input from live run-detail findings + explanation (caller supplies display strings for manifest).
 */
export function buildAdrGeneratorRunInput(args: {
  runId: string;
  projectId: string;
  reviewTitle: string;
  createdUtc: string;
  manifestStatusLabel: string | null;
  policyPackLabel: string | null;
  manifestCounts: import("./adr-from-run-slices").AdrGeneratorManifestCounts | null;
  explanationSummary: RunExplanationSummary | null;
  quickDecisionFindings: readonly QuickDecisionFinding[];
  maxFindings?: number;
  severityLabelForFinding: (severityValue: number) => string;
}): AdrGeneratorRunInput {
  const maxFindings = typeof args.maxFindings === "number" && Number.isFinite(args.maxFindings) ? args.maxFindings : DEFAULT_MAX_FINDINGS;
  const explanation = buildAdrExplanationSlice(args.explanationSummary);
  const sorted = sortQuickDecisionFindings(args.quickDecisionFindings).filter((f) => f.isMuted !== true);
  const capped = sorted.slice(0, Math.max(0, Math.trunc(maxFindings)));
  const findings: AdrGeneratorFindingSlice[] = capped.map((f) => ({
    findingId: f.findingId,
    title: f.title,
    recommendation: f.recommendation,
    severityLabel: args.severityLabelForFinding(f.severityValue),
    aiReasoningExcerpt: truncatePlain(f.aiReasoning.reasoningTrace, EXCERPT_CAP),
    trustLabel: f.trustLabel ?? null,
    trustLabelReason: f.trustLabelReason ?? null,
  }));

  return {
    runId: args.runId,
    projectId: args.projectId,
    reviewTitle: args.reviewTitle,
    createdUtc: args.createdUtc,
    manifestStatusLabel: args.manifestStatusLabel,
    policyPackLabel: args.policyPackLabel,
    manifestCounts: args.manifestCounts,
    explanation,
    findings,
  };
}
