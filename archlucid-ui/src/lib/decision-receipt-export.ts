import {
  buildTransparencyTrailExportSection,
  type TransparencyTrailExportSection,
} from "@/lib/feasibility/export-transparency-trail-section";
import { resolveHardInfeasibleCitationExportBlockedReason } from "@/lib/feasibility/format-feasibility-verdict-markdown-section";
import {
  resolveDecisionReceiptCareerPosture,
  type DecisionReceiptCareerPosture,
} from "@/lib/decision-receipt-career-posture";
import type { FeasibilityVerdictKind, ManifestFeasibilityVerdict } from "@/types/feasibility-verdict";
import type { RunSummary } from "@/types/authority";
import type { StructuralExecutionModeInput } from "@/lib/structural-execution-mode";
import type { WorkingCareerRehearsalDoorId } from "@/lib/governance/working-career-rehearsal-door";

export const DECISION_RECEIPT_SCHEMA_VERSION = "archlucid.decision-receipt.v2";

/** SAQ-011 — cost figures in the receipt are estimates, not audited financial advice. */
export const DECISION_RECEIPT_COST_ESTIMATE_LABEL =
  "Estimated — not audited financial advice (SAQ-011)";

export const DECISION_RECEIPT_COST_FIGURES_NOT_STORED =
  "Cost figures were not stored for this review.";

export const DECISION_RECEIPT_SESSION_COST_NOT_STORED = "Session cost was not stored.";

export const DECISION_RECEIPT_AVOIDED_ARCHITECT_COST_NOT_STORED =
  "Avoided human architect cost was not stored.";

export const DECISION_RECEIPT_AVOIDED_CALENDAR_WEEKS_NOT_STORED = "Avoided calendar time was not stored.";

export const DECISION_RECEIPT_RUN_ID_NOT_STORED = "Run id was not stored.";

export const DECISION_RECEIPT_DRAFT_ID_NOT_STORED = "Draft id was not stored.";

export const DECISION_RECEIPT_SYSTEM_NAME_NOT_STORED = "System name was not stored.";

export const DECISION_RECEIPT_BUSINESS_OUTCOME_NOT_STORED = "Business outcome was not stored.";

export const DECISION_RECEIPT_FREE_TEXT_INTENT_NOT_STORED = "Free-text intent was not stored.";

export type DecisionReceiptSource = "draft-admission" | "committed-run";

export type DecisionReceiptContext = {
  readonly source: DecisionReceiptSource;
  readonly verdict: ManifestFeasibilityVerdict;
  readonly redirectReason?: string;
  readonly draftId?: string;
  readonly runId?: string;
  readonly freeTextIntent?: string;
  readonly businessOutcome?: string;
  readonly systemName?: string;
  readonly structuralExecutionMode?: StructuralExecutionModeInput;
  readonly liveDoor?: WorkingCareerRehearsalDoorId | null;
  readonly progressSummary?: RunSummary | null;
};

export type DecisionReceiptDocument = {
  schemaVersion: typeof DECISION_RECEIPT_SCHEMA_VERSION;
  generatedUtc: string;
  source: DecisionReceiptSource;
  draftId: string;
  runId: string;
  redirectReason?: string;
  intake: {
    freeTextIntent: string;
    businessOutcome: string;
    systemName: string;
  };
  verdict: ManifestFeasibilityVerdict;
  transparencyTrail: TransparencyTrailExportSection | null;
  costStory: {
    label: typeof DECISION_RECEIPT_COST_ESTIMATE_LABEL;
    sessionCostUsdEstimate: string;
    avoidedHumanArchitectCostUsdEstimate: string;
    avoidedCalendarWeeksEstimate: string;
    narrative: string;
  };
  careerPosture?: DecisionReceiptCareerPosture;
};

export function isExportableDecisionVerdict(kind: FeasibilityVerdictKind): boolean {
  return kind === "SoftInfeasible" || kind === "HardInfeasible";
}

export function resolveDecisionReceiptExportBlockedReason(
  context: DecisionReceiptContext,
): string | null {
  return resolveHardInfeasibleCitationExportBlockedReason(context.verdict);
}

function storedReceiptField(value: string | undefined, notStoredLabel: string): string {
  const trimmed = value?.trim() ?? "";

  return trimmed.length > 0 ? trimmed : notStoredLabel;
}

export function buildDecisionReceiptDocument(context: DecisionReceiptContext): DecisionReceiptDocument {
  const careerPosture =
    context.source === "committed-run"
      ? resolveDecisionReceiptCareerPosture(context)
      : undefined;

  return {
    schemaVersion: DECISION_RECEIPT_SCHEMA_VERSION,
    generatedUtc: new Date().toISOString(),
    source: context.source,
    draftId: storedReceiptField(context.draftId, DECISION_RECEIPT_DRAFT_ID_NOT_STORED),
    runId: storedReceiptField(context.runId, DECISION_RECEIPT_RUN_ID_NOT_STORED),
    redirectReason: context.redirectReason,
    intake: {
      freeTextIntent: storedReceiptField(context.freeTextIntent, DECISION_RECEIPT_FREE_TEXT_INTENT_NOT_STORED),
      businessOutcome: storedReceiptField(context.businessOutcome, DECISION_RECEIPT_BUSINESS_OUTCOME_NOT_STORED),
      systemName: storedReceiptField(context.systemName, DECISION_RECEIPT_SYSTEM_NAME_NOT_STORED),
    },
    verdict: context.verdict,
    transparencyTrail: buildTransparencyTrailExportSection(context.verdict.transparencyTrail),
    costStory: {
      label: DECISION_RECEIPT_COST_ESTIMATE_LABEL,
      sessionCostUsdEstimate: DECISION_RECEIPT_SESSION_COST_NOT_STORED,
      avoidedHumanArchitectCostUsdEstimate: DECISION_RECEIPT_AVOIDED_ARCHITECT_COST_NOT_STORED,
      avoidedCalendarWeeksEstimate: DECISION_RECEIPT_AVOIDED_CALENDAR_WEEKS_NOT_STORED,
      narrative: DECISION_RECEIPT_COST_FIGURES_NOT_STORED,
    },
    careerPosture,
  };
}

export function buildDecisionReceiptFilename(context: DecisionReceiptContext): string {
  const stamp = new Date().toISOString().slice(0, 10);
  const runId = context.runId?.trim() ?? "";
  const draftId = context.draftId?.trim() ?? "";
  const id =
    runId.length > 0
      ? runId
      : draftId.length > 0
        ? draftId
        : "not-stored";

  return `archlucid-decision-receipt-${id}-${stamp}.json`;
}

export function triggerDecisionReceiptDownload(context: DecisionReceiptContext): void {
  const blockedReason = resolveDecisionReceiptExportBlockedReason(context);

  if (blockedReason !== null) {
    return;
  }

  const document = buildDecisionReceiptDocument(context);
  const json = JSON.stringify(document, null, 2);
  const blob = new Blob([json], { type: "application/json;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = window.document.createElement("a");
  anchor.href = url;
  anchor.download = buildDecisionReceiptFilename(context);
  anchor.click();
  URL.revokeObjectURL(url);
}
