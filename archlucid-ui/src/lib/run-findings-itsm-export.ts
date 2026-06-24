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

function triggerJsonDownload(json: string, filename: string): void {
  const blob = new Blob([json], { type: "application/json;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

/** Builds Jira/ServiceNow-ready work-item JSON for every finding on a review. */
export function buildRunFindingsItsmJsonExportDocument(
  runId: string,
  findings: readonly QuickDecisionFinding[],
  siteOrigin: string,
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
    });

    return JSON.parse(jsonBody) as FindingWorkItemJsonDocument;
  });

  return {
    schema: "archlucid.findings-export.v1",
    runId,
    exportedAtUtc: new Date().toISOString(),
    findingCount: workItems.length,
    workItems,
  };
}

export function downloadRunFindingsItsmJsonExport(
  runId: string,
  findings: readonly QuickDecisionFinding[],
  siteOrigin: string,
): void {
  const document = buildRunFindingsItsmJsonExportDocument(runId, findings, siteOrigin);
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
