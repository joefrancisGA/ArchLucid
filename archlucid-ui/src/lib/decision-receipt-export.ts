import type { ManifestFeasibilityVerdict } from "@/types/feasibility-verdict";
import type { FeasibilityVerdictKind } from "@/types/feasibility-verdict";

export const DECISION_RECEIPT_SCHEMA_VERSION = "archlucid.decision-receipt.v1";

/** SAQ-011 — cost figures in the receipt are estimates, not audited financial advice. */
export const DECISION_RECEIPT_COST_ESTIMATE_LABEL =
  "Estimated — not audited financial advice (SAQ-011)";

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
};

export type DecisionReceiptDocument = {
  schemaVersion: typeof DECISION_RECEIPT_SCHEMA_VERSION;
  generatedUtc: string;
  source: DecisionReceiptSource;
  draftId?: string;
  runId?: string;
  redirectReason?: string;
  intake?: {
    freeTextIntent?: string;
    businessOutcome?: string;
    systemName?: string;
  };
  verdict: ManifestFeasibilityVerdict;
  costStory: {
    label: typeof DECISION_RECEIPT_COST_ESTIMATE_LABEL;
    sessionCostUsdEstimate: number;
    avoidedHumanArchitectCostUsdEstimate: number;
    avoidedCalendarWeeksEstimate: string;
    narrative: string;
  };
};

export function isExportableDecisionVerdict(kind: FeasibilityVerdictKind): boolean {
  return kind === "SoftInfeasible" || kind === "HardInfeasible";
}

export function buildDecisionReceiptDocument(context: DecisionReceiptContext): DecisionReceiptDocument {
  return {
    schemaVersion: DECISION_RECEIPT_SCHEMA_VERSION,
    generatedUtc: new Date().toISOString(),
    source: context.source,
    draftId: context.draftId,
    runId: context.runId,
    redirectReason: context.redirectReason,
    intake:
      context.freeTextIntent !== undefined
      || context.businessOutcome !== undefined
      || context.systemName !== undefined
        ? {
            freeTextIntent: context.freeTextIntent,
            businessOutcome: context.businessOutcome,
            systemName: context.systemName,
          }
        : undefined,
    verdict: context.verdict,
    costStory: {
      label: DECISION_RECEIPT_COST_ESTIMATE_LABEL,
      sessionCostUsdEstimate: 1,
      avoidedHumanArchitectCostUsdEstimate: 25_000,
      avoidedCalendarWeeksEstimate: "2–4",
      narrative:
        "A defensible decision delivered in minutes at low compute cost versus weeks of human architecture review.",
    },
  };
}

export function buildDecisionReceiptFilename(context: DecisionReceiptContext): string {
  const stamp = new Date().toISOString().slice(0, 10);
  const id = context.runId ?? context.draftId ?? "decision";

  return `archlucid-decision-receipt-${id}-${stamp}.json`;
}

export function triggerDecisionReceiptDownload(context: DecisionReceiptContext): void {
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
