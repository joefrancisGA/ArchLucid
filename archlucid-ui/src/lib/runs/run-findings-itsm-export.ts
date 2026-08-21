import {
  buildTraceRowWorkItemBody,
  type FindingWorkItemJsonDocument,
} from "@/lib/copy-finding-as-work-item";
import { severityBadgeLabel, type QuickDecisionFinding } from "@/lib/quick-decision-summary-derive";

/** Bulk JSON export envelope for external ticketing scripts (UI-only seam until V1.1 connectors). */
export type RunFindingsItsmJsonExportDocument = {
  schema: "archlucid.findings-export.v1";
  runId: string;
  exportedAtUtc: string;
  findingCount: number;
  recordStatus?: string;
  workItems: FindingWorkItemJsonDocument[];
};

export type GovernanceFindingsItsmJsonExportDocument = {
  schema: "archlucid.governance-findings-export.v1";
  exportedAtUtc: string;
  findingCount: number;
  workItems: FindingWorkItemJsonDocument[];
};

function severityLabelFromQuickDecisionFinding(finding: QuickDecisionFinding): string {
  return severityBadgeLabel(finding.severityValue);
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

function escapeCsvCell(value: string): string {
  if (value.includes(",") || value.includes('"') || value.includes("\n") || value.includes("\r")) {
    return `"${value.replaceAll('"', '""')}"`;
  }

  return value;
}

/** Pre-finalize marker stamped into exports when no Finalized review record exists yet. */
export const PRE_FINALIZE_FINDINGS_EXPORT_MARKER =
  "Pre-finalize assessment findings — not a Finalized review record";

export type RunFindingsExportOptions = {
  readonly packageCommitted?: boolean;
};

function resolveExportRecordStatus(options?: RunFindingsExportOptions): string {
  if (options?.packageCommitted === false) {
    return PRE_FINALIZE_FINDINGS_EXPORT_MARKER;
  }

  return "Open";
}

/** Builds a CSV export for the on-screen findings set (client-side; matches visible rows). */
export function buildQuickDecisionFindingsCsv(
  runId: string,
  findings: readonly QuickDecisionFinding[],
  options?: RunFindingsExportOptions,
): string {
  const recordStatus = resolveExportRecordStatus(options);
  const header = "FindingId,RunId,Severity,Title,Recommendation,Confidence,PolicyRuleId,Status,RecordStatus";
  const lines = findings.map((finding) =>
    [
      finding.findingId,
      runId,
      severityLabelFromQuickDecisionFinding(finding),
      escapeCsvCell(finding.title),
      escapeCsvCell(finding.recommendation),
      finding.confidenceLevel ?? "",
      finding.policyRuleId ?? "",
      finding.isMuted ? "Muted" : "Open",
      escapeCsvCell(recordStatus),
    ].join(","),
  );

  return [header, ...lines].join("\n");
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
  const workItems: FindingWorkItemJsonDocument[] = findings.map((finding) => {
    const jsonBody = buildTraceRowWorkItemBody("json", {
      runId,
      findingId: finding.findingId,
      findingTitle: finding.title,
      severityLabel: severityLabelFromQuickDecisionFinding(finding),
      recommendedAction: finding.recommendation,
      statusLabel: finding.isMuted ? "Muted" : "Open",
      ruleId: finding.policyRuleId ?? null,
      siteOrigin,
      trustLabel: finding.trustLabel ?? null,
      trustLabelReason: finding.trustLabelReason ?? null,
    });

    return JSON.parse(jsonBody) as FindingWorkItemJsonDocument;
  });

  const document: RunFindingsItsmJsonExportDocument = {
    schema: "archlucid.findings-export.v1",
    runId,
    exportedAtUtc: new Date().toISOString(),
    findingCount: workItems.length,
    workItems,
  };

  if (options?.packageCommitted === false) {
    return {
      ...document,
      recordStatus: PRE_FINALIZE_FINDINGS_EXPORT_MARKER,
    };
  }

  return document;
}

export function downloadRunFindingsItsmJsonExport(
  runId: string,
  findings: readonly QuickDecisionFinding[],
  siteOrigin: string,
  options?: RunFindingsExportOptions,
): void {
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
  const document = buildGovernanceFindingsItsmJsonExportDocument(rows, siteOrigin);
  const json = JSON.stringify(document, null, 2);
  triggerJsonDownload(json, "architecture-risk-register-work-items.json");
}
