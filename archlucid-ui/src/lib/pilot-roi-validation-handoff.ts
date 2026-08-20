import {
  describeSponsorProofReadiness,
  formatStructuralExecutionModeLabel,
  isAgentOutputPilotStrictSponsorSafe,
  isExternalSponsorPdfBlockedForExecutionMode,
  isProjectedDollarClaimsSponsorSafe,
  type PilotRunDeltasProofSummaryJson,
} from "@/lib/pilot-proof-readiness";

export type PilotRoiValidationVerdict = "hold" | "internal-only" | "sendable";

export type PilotRoiValidationVerdictCopy = {
  readonly verdict: PilotRoiValidationVerdict;
  readonly headline: string;
  readonly detail: string;
};

export type RoiEvidenceConfidenceTier = "Strong" | "Partial" | "Low" | "Unknown";

export const PILOT_ROI_VALIDATION_INTERVIEW_QUESTIONS: readonly {
  readonly prompt: string;
  readonly ledgerField: string;
}[] = [
  {
    prompt: "Did a decision change because of a finding?",
    ledgerField: "decisionChanged.changed / decisionChanged.why",
  },
  {
    prompt: "Which finding IDs drove it?",
    ledgerField: "decisionChanged.findingIds[]",
  },
  {
    prompt: "Would the sponsor approve budget without ArchLucid?",
    ledgerField: "decisionChanged.attributionNote",
  },
  {
    prompt: "Are baseline hours buyer-reported or model-default?",
    ledgerField: "baselineSourceConfidence.level / sources[]",
  },
  {
    prompt: "What sponsor action occurred within 30 days?",
    ledgerField: "sponsorActionTaken.action / description",
  },
  {
    prompt: "Conversion signal (annual order, deferred, declined, etc.)?",
    ledgerField: "conversionSignal.status",
  },
];

export function describeRoiEvidenceConfidence(raw: string | undefined | null): {
  readonly tier: RoiEvidenceConfidenceTier;
  readonly meaning: string;
} {
  const normalized = (raw ?? "").trim();

  if (normalized === "Strong") {
    return {
      tier: "Strong",
      meaning: "Buyer-reported or attested baselines support external ROI framing with caveats in the model doc.",
    };
  }

  if (normalized === "Partial") {
    return {
      tier: "Partial",
      meaning: "Some ROI inputs are estimated or incomplete — use directional language only.",
    };
  }

  if (normalized === "Low") {
    return {
      tier: "Low",
      meaning: "ROI evidence is weak — do not quote dollar savings externally.",
    };
  }

  return {
    tier: "Unknown",
    meaning: "ROI evidence confidence was not returned — confirm in the first-value report before handoff.",
  };
}

export function resolvePilotRoiValidationVerdict(
  payload: PilotRunDeltasProofSummaryJson | null,
  options?: { readonly curatedSampleRun?: boolean },
): PilotRoiValidationVerdictCopy {
  const curatedSampleRun = options?.curatedSampleRun === true;
  const readiness = describeSponsorProofReadiness(payload);
  const roiRaw = payload?.proofPackageCompleteness?.roiEvidenceConfidence;
  const roi = describeRoiEvidenceConfidence(roiRaw);
  const executionMode = formatStructuralExecutionModeLabel(payload);
  const dollarSafe = isProjectedDollarClaimsSponsorSafe(payload);

  const holdWithoutCuratedOverride =
    readiness?.variant === "blocked"
    || roi.tier === "Low"
    || isExternalSponsorPdfBlockedForExecutionMode(payload)
    || !isAgentOutputPilotStrictSponsorSafe(payload)
    || !dollarSafe;

  if (!curatedSampleRun && holdWithoutCuratedOverride) {
    return {
      verdict: "hold",
      headline: "Do not send sponsor PDF",
      detail:
        "Persisted proof gates block external sponsor circulation. Resolve execution mode, ROI baseline, or proof completeness before handoff.",
    };
  }

  const sendable =
    roi.tier === "Strong"
    && dollarSafe
    && executionMode === "Real"
    && (readiness?.variant === "ready" || readiness?.classification === "Sendable");

  if (sendable) {
    return {
      verdict: "sendable",
      headline: "Safe to quote ROI externally",
      detail:
        "Strong ROI confidence, Real execution mode, and sponsor-send classification align — still verify ledger interview before purchase proof.",
    };
  }

  return {
    verdict: "internal-only",
    headline: "Internal directional only",
    detail:
      "Use findings and cycle-time deltas for internal steering. External dollar or customer-specific ROI claims need stronger baselines or caveats.",
  };
}

export function buildPilotRoiValidationChecklistMarkdown(
  runId: string,
  payload: PilotRunDeltasProofSummaryJson | null,
): string {
  const verdict = resolvePilotRoiValidationVerdict(payload);
  const readiness = describeSponsorProofReadiness(payload);
  const roi = describeRoiEvidenceConfidence(payload?.proofPackageCompleteness?.roiEvidenceConfidence);
  const executionMode = formatStructuralExecutionModeLabel(payload);
  const dollarSafe = isProjectedDollarClaimsSponsorSafe(payload);

  const lines: string[] = [
    "# Pilot ROI validation session notes",
    "",
    `Run ID: ${runId}`,
    "",
    "## Persisted signals (from pilot-run-deltas)",
    "",
    `- ROI evidence confidence: ${roi.tier} — ${roi.meaning}`,
    `- Projected dollar claims export-ready: ${dollarSafe ? "yes" : "no"}`,
    `- Structural execution mode: ${executionMode}`,
    `- Sponsor proof readiness: ${readiness?.classification ?? readiness?.title ?? "unknown"}`,
    `- Validation verdict: ${verdict.headline}`,
    "",
    "## 15-minute validation interview",
    "",
  ];

  for (const question of PILOT_ROI_VALIDATION_INTERVIEW_QUESTIONS) {
    lines.push(`### ${question.prompt}`);
    lines.push(`Ledger field: \`${question.ledgerField}\``);
    lines.push("");
    lines.push("Answer:");
    lines.push("");
  }

  lines.push("---");
  lines.push("Populate `templates/paid-pilot-evidence-ledger.template.json` — see PAID_PILOT_EVIDENCE_LEDGER.md.");

  return lines.join("\n");
}
