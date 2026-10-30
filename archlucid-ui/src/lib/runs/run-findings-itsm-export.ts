import {
  buildTraceRowWorkItemBody,
  type FindingWorkItemJsonDocument,
} from "@/lib/copy-finding-as-work-item";
import { workItemStoredText } from "@/lib/copy-finding-as-work-item-types";
import {
  buildSemanticSupportBandExportStamp,
  resolveFindingSemanticSupportBandScorerVersion,
} from "@/lib/findings/finding-semantic-support-band-export";
import {
  humanReviewStatusDisplay,
  severityBadgeLabel,
  type QuickDecisionFinding,
} from "@/lib/quick-decision-summary-derive";
import {
  ARCHITECTURE_RISK_REGISTER_ITSM_LINKAGE_NOT_STORED,
  ARCHITECTURE_RISK_REGISTER_ITSM_LINKAGE_STORED_EMPTY,
} from "@/lib/architecture/architecture-risk-register-csv";
import { partitionFindingsForItsmExport } from "@/lib/findings/decision-grade-finding-export-filter";
import { findingTrustExportJsonFields } from "@/lib/findings/finding-trust-export";
import { findingWorkItemSealedManifestCopyBlockedReason } from "@/lib/findings/finding-work-item-sealed-manifest-guard";
import { showError } from "@/lib/toast";

/** Bulk JSON export envelope for external ticketing scripts (UI-only seam until V1.1 connectors). */
export type SemanticSupportBandExportStampDocument = {
  readonly scorerVersion: string;
  readonly supported: number;
  readonly unchecked: number;
  readonly unsupported: number;
  readonly notScored: number;
  readonly decisionGradeTotal: number;
  readonly stampLine: string | null;
};

export type RunFindingsItsmJsonExportDocument = {
  schema: "archlucid.findings-export.v1";
  runId: string;
  exportedAtUtc: string;
  findingCount: number;
  omittedChecklistCoverageCount?: number;
  recordStatus?: string;
  semanticSupportBandStamp?: SemanticSupportBandExportStampDocument;
  workItems: FindingWorkItemJsonDocument[];
};

export type GovernanceFindingsItsmJsonExportDocument = {
  schema: "archlucid.governance-findings-export.v1";
  exportedAtUtc: string;
  findingCount: number;
  workItems: FindingWorkItemJsonDocument[];
};

function severityLabelFromQuickDecisionFinding(finding: QuickDecisionFinding): string {
  if (finding.severityStored === false) {
    return "Severity was not stored";
  }

  return severityBadgeLabel(finding.severityValue);
}

function humanReviewStatusLabelForExport(finding: QuickDecisionFinding): string {
  return humanReviewStatusDisplay(finding.humanReviewStatus, {
    stored: finding.humanReviewStatusStored,
  }).label;
}

function formatItsmFindingIdCell(findingId: string | null | undefined): string {
  if (findingId === null || findingId === undefined) {
    return "Finding id was not stored.";
  }

  if (findingId.length === 0 || findingId.trim().length === 0) {
    return "Finding id was stored empty.";
  }

  return findingId;
}

function formatItsmPolicyRuleIdCell(policyRuleId: string | null | undefined): string {
  if (policyRuleId === null || policyRuleId === undefined) {
    return "Policy rule id was not stored.";
  }

  if (policyRuleId.length === 0 || policyRuleId.trim().length === 0) {
    return "Policy rule id was stored empty.";
  }

  return policyRuleId.trim();
}

function formatItsmFindingTitleCell(title: string | null | undefined): string {
  if (title === null || title === undefined || title.length === 0) {
    return "Finding title was not stored.";
  }

  if (title.trim().length === 0) {
    return "Finding title was stored empty.";
  }

  return title;
}

function formatItsmFindingConfidenceCell(confidence: string | null | undefined): string {
  if (confidence === null || confidence === undefined) {
    return "Confidence level was not stored";
  }

  const trimmed = confidence.trim();

  if (trimmed.length === 0) {
    return "Confidence level was stored empty.";
  }

  if (trimmed.toLowerCase() === "unknown") {
    return "Confidence level was not recognized.";
  }

  return trimmed;
}

function triggerBinaryDownload(content: string, mimeType: string, filename: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

function triggerJsonDownload(json: string, filename: string): void {
  triggerBinaryDownload(json, "application/json;charset=utf-8", filename);
}

function formatFindingsCsvItsmLinkageCell(itsmLinkedTicketsSummary: string | null | undefined): string {
  if (itsmLinkedTicketsSummary === null || itsmLinkedTicketsSummary === undefined) {
    return ARCHITECTURE_RISK_REGISTER_ITSM_LINKAGE_NOT_STORED;
  }

  if (itsmLinkedTicketsSummary.length === 0) {
    return ARCHITECTURE_RISK_REGISTER_ITSM_LINKAGE_STORED_EMPTY;
  }

  return itsmLinkedTicketsSummary.trim().length > 0
    ? itsmLinkedTicketsSummary.trim()
    : ARCHITECTURE_RISK_REGISTER_ITSM_LINKAGE_STORED_EMPTY;
}

function formatItsmFindingRecommendationCell(recommendation: string | null | undefined): string {
  if (recommendation === null || recommendation === undefined) {
    return "Recommended action was not stored.";
  }

  if (recommendation.trim().length === 0) {
    return "Recommended action was stored empty.";
  }

  return recommendation;
}

function escapeCsvCell(value: string): string {
  if (value.includes(",") || value.includes('"') || value.includes("\n") || value.includes("\r")) {
    return `"${value.replaceAll('"', '""')}"`;
  }

  return value;
}

/** Pre-finalize marker stamped into exports when no Finalized review record exists yet. */
export const PRE_FINALIZE_FINDINGS_EXPORT_MARKER =
  "Assessment findings before finalize — not a Finalized review record";

export type RunFindingsExportOptions = {
  readonly packageCommitted?: boolean;
  readonly manifestVersion?: string | null;
};

function ensureRunFindingsExportAllowed(runId: string, options?: RunFindingsExportOptions): boolean {
  const blockedReason = findingWorkItemSealedManifestCopyBlockedReason({
    runId,
    manifestVersion: options?.manifestVersion,
  });

  if (blockedReason !== null) {
    showError(blockedReason);

    return false;
  }

  return true;
}

function resolveExportRecordStatus(options?: RunFindingsExportOptions): string {
  if (options?.packageCommitted === false) {
    return PRE_FINALIZE_FINDINGS_EXPORT_MARKER;
  }

  if (options?.packageCommitted === true) {
    return "Finalized review record";
  }

  return "Record status was not included on this export.";
}

/** Builds a CSV export for decision-grade findings only (client-side; checklist coverage omitted). */
export function buildQuickDecisionFindingsCsv(
  runId: string,
  findings: readonly QuickDecisionFinding[],
  options?: RunFindingsExportOptions,
): string {
  const { exportableFindings, omittedChecklistCount } = partitionFindingsForItsmExport(findings);
  const recordStatus = resolveExportRecordStatus(options);
  const checklistOmissionLine =
    omittedChecklistCount > 0
      ? `Checklist coverage rows omitted from this file: ${omittedChecklistCount}`
      : "No checklist coverage rows were omitted.";
  const header =
    "FindingId,RunId,Severity,Title,Recommendation,Confidence,PolicyRuleId,TrustLabel,TrustLabelReason,SemanticSupportBand,SemanticSupportBandScorerVersion,Status,ItsmLinkage,RecordStatus";
  const lines = exportableFindings.map((finding) => {
    const trustFields = findingTrustExportJsonFields(finding);
    const semanticSupportBand =
      finding.semanticSupportBand === null || finding.semanticSupportBand === undefined
        ? "Semantic support band was not stored"
        : finding.semanticSupportBand.length === 0
          ? "Semantic support band was stored empty."
          : finding.semanticSupportBand;

    return [
      formatItsmFindingIdCell(finding.findingId),
      runId,
      severityLabelFromQuickDecisionFinding(finding),
      escapeCsvCell(formatItsmFindingTitleCell(finding.title)),
      escapeCsvCell(formatItsmFindingRecommendationCell(finding.recommendation)),
      formatItsmFindingConfidenceCell(finding.confidenceLevel),
      formatItsmPolicyRuleIdCell(finding.policyRuleId),
      "trustLabel" in trustFields
        ? trustFields.trustLabel.trim().length > 0
          ? trustFields.trustLabel
          : trustFields.trustLabel.length > 0
            ? "Trust label was stored empty."
            : "Trust label was not stored"
        : "Trust label was not stored",
      "trustLabelReason" in trustFields
        ? trustFields.trustLabelReason === null || trustFields.trustLabelReason === undefined
          ? "Trust label reason was not stored"
          : trustFields.trustLabelReason.trim().length > 0
            ? trustFields.trustLabelReason
            : "Trust label reason was stored empty."
        : "Trust label reason was not stored",
      semanticSupportBand,
      resolveFindingSemanticSupportBandScorerVersion(finding),
      finding.isMuted ? "Muted" : humanReviewStatusLabelForExport(finding),
      escapeCsvCell(formatFindingsCsvItsmLinkageCell(finding.itsmLinkedTicketsSummary)),
      escapeCsvCell(recordStatus),
    ].join(",");
  });

  const exportRowsAbsentLine =
    exportableFindings.length === 0
      ? "No ITSM work-item rows were exported."
      : null;

  return [checklistOmissionLine, exportRowsAbsentLine, header, ...lines].filter((line) => line !== null).join("\n");
}

export function downloadQuickDecisionFindingsCsv(
  runId: string,
  findings: readonly QuickDecisionFinding[],
  options?: RunFindingsExportOptions,
): void {
  const csv = buildQuickDecisionFindingsCsv(runId, findings, options);
  triggerBinaryDownload(csv, "text/csv;charset=utf-8", `architecture-run-${runId}-findings.csv`);
}

/** Builds Jira/ServiceNow-ready work-item JSON for every finding on a review. */
export function buildRunFindingsItsmJsonExportDocument(
  runId: string,
  findings: readonly QuickDecisionFinding[],
  siteOrigin: string,
  options?: RunFindingsExportOptions,
): RunFindingsItsmJsonExportDocument {
  const { exportableFindings, omittedChecklistCount } = partitionFindingsForItsmExport(findings);
  const workItems: FindingWorkItemJsonDocument[] = exportableFindings.map((finding) => {
    const jsonBody = buildTraceRowWorkItemBody("json", {
      runId,
      findingId: finding.findingId,
      findingTitle: finding.title,
      severityLabel: severityLabelFromQuickDecisionFinding(finding),
      recommendedAction: finding.recommendation,
      statusLabel: finding.isMuted ? "Muted" : humanReviewStatusLabelForExport(finding),
      ruleId: finding.policyRuleId ?? null,
      siteOrigin,
      trustLabel: finding.trustLabel ?? null,
      trustLabelReason: finding.trustLabelReason ?? null,
      classification: finding.classification ?? null,
      semanticSupportBand: finding.semanticSupportBand ?? null,
      semanticSupportBandScorerVersion: finding.semanticSupportBandScorerVersion ?? null,
    });

    return JSON.parse(jsonBody) as FindingWorkItemJsonDocument;
  });

  const semanticStamp = buildSemanticSupportBandExportStamp(exportableFindings);
  const document: RunFindingsItsmJsonExportDocument = {
    schema: "archlucid.findings-export.v1",
    runId,
    exportedAtUtc: new Date().toISOString(),
    findingCount: workItems.length,
    omittedChecklistCoverageCount: omittedChecklistCount > 0 ? omittedChecklistCount : undefined,
    semanticSupportBandStamp: {
      scorerVersion: semanticStamp.scorerVersion,
      supported: semanticStamp.counts.supported,
      unchecked: semanticStamp.counts.unchecked,
      unsupported: semanticStamp.counts.unsupported,
      notScored: semanticStamp.counts.notScored,
      decisionGradeTotal: semanticStamp.counts.decisionGradeTotal,
      stampLine: semanticStamp.stampLine,
    },
    workItems,
  };

  if (options?.packageCommitted === false) {
    return {
      ...document,
      recordStatus: PRE_FINALIZE_FINDINGS_EXPORT_MARKER,
    };
  }

  return {
    ...document,
    recordStatus: options?.packageCommitted === true
      ? "Finalized review record"
      : "Record status was not included on this export.",
  };
}

export function downloadRunFindingsItsmJsonExport(
  runId: string,
  findings: readonly QuickDecisionFinding[],
  siteOrigin: string,
  options?: RunFindingsExportOptions,
): void {
  if (!ensureRunFindingsExportAllowed(runId, options)) {
    return;
  }

  const document = buildRunFindingsItsmJsonExportDocument(runId, findings, siteOrigin, options);
  const json = JSON.stringify(document, null, 2);
  triggerJsonDownload(json, `architecture-run-${runId}-findings-work-items.json`);
}

export type GovernanceFindingWorkItemExportRow = {
  runId: string;
  findingId: string;
  title: string;
  severity: string;
  recommended: string;
  status: string;
  policyRuleId?: string | null;
  trustLabel?: string | null;
  trustLabelReason?: string | null;
  manifestVersion?: string | null;
  recordKind: "finding" | "decision";
};

export function buildGovernanceFindingsItsmJsonExportDocument(
  rows: readonly GovernanceFindingWorkItemExportRow[],
  siteOrigin: string,
): GovernanceFindingsItsmJsonExportDocument {
  const workItems: FindingWorkItemJsonDocument[] = rows
    .filter((row) => row.recordKind === "finding")
    .map((row) => {
      const jsonBody = buildTraceRowWorkItemBody("json", {
        runId: row.runId,
        findingId: row.findingId,
        findingTitle: row.title,
        severityLabel: row.severity,
        recommendedAction: row.recommended,
        statusLabel: row.status,
        ruleId: row.policyRuleId ?? null,
        siteOrigin,
        trustLabel: row.trustLabel ?? null,
        trustLabelReason: row.trustLabelReason ?? null,
      });

      return JSON.parse(jsonBody) as FindingWorkItemJsonDocument;
    });

  return {
    schema: "archlucid.governance-findings-export.v1",
    exportedAtUtc: new Date().toISOString(),
    findingCount: workItems.length,
    workItems,
  };
}

export function downloadGovernanceFindingsItsmJsonExport(
  rows: readonly GovernanceFindingWorkItemExportRow[],
  siteOrigin: string,
): void {
  for (const row of rows) {
    if (row.recordKind !== "finding") {
      continue;
    }

    if (!ensureRunFindingsExportAllowed(row.runId, { manifestVersion: row.manifestVersion })) {
      return;
    }
  }

  const document = buildGovernanceFindingsItsmJsonExportDocument(rows, siteOrigin);
  const json = JSON.stringify(document, null, 2);
  triggerJsonDownload(json, "architecture-risk-register-work-items.json");
}
