import { getFindingEvidenceTraceHref } from "@/lib/findings/finding-evidence-navigation";

export const ARCHITECTURE_RISK_REGISTER_OWNER_NOT_STORED = "Owner was not stored." as const;

export const ARCHITECTURE_RISK_REGISTER_EVIDENCE_LINK_NOT_STORED = "Evidence link was not stored." as const;

export const ARCHITECTURE_RISK_REGISTER_STALE_FLAG_NOT_STORED = "Stale flag was not stored." as const;

export const ARCHITECTURE_RISK_REGISTER_LAST_REVIEWED_NOT_STORED = "Last reviewed was not stored." as const;

export const ARCHITECTURE_RISK_REGISTER_LAST_REVIEWED_STORED_EMPTY = "Last reviewed was stored empty." as const;

export type ArchitectureRiskRegisterCsvRow = {
  recordKind: "finding" | "decision";
  runId: string;
  findingId: string;
  title: string;
  severity: string;
  category: string;
  status: string;
  recommended: string;
  ownerUserId?: string | null;
  agingDays?: number;
  waiverExpiresAtUtc?: string | null;
  lastReviewedUtc?: string | null;
  revisitDueUtc?: string | null;
  evidenceHref?: string;
  isStale?: boolean;
  humanReviewStatusLabel?: string | null;
  itsmLinkedTicketsSummary?: string | null;
};

function escapeCsvCell(value: string): string {
  if (value.includes('"') || value.includes(",") || value.includes("\n") || value.includes("\r")) {
    return `"${value.replace(/"/g, '""')}"`;
  }

  return value;
}

/** Buyer-facing architecture risk register export (TB-057). */
export function buildArchitectureRiskRegisterCsv(rows: readonly ArchitectureRiskRegisterCsvRow[]): string {
  const header = [
    "System",
    "Risk",
    "Impact",
    "Owner",
    "Decision needed",
    "Current disposition",
    "Evidence link",
    "Last reviewed",
    "Next review",
    "Aging days",
    "Stale",
    "Human review",
    "ITSM linkage",
  ];

  const lines: string[] = [header.join(",")];

  for (const row of rows) {
    if (row.recordKind !== "finding") {
      continue;
    }

    const cells = [
      row.category,
      row.title,
      row.severity,
      formatRiskRegisterOwnerCell(row.ownerUserId),
      row.recommended,
      row.status,
      row.evidenceHref ?? inspectPath(row.runId, row.findingId),
      formatRiskRegisterLastReviewedCell(row.lastReviewedUtc),
      row.revisitDueUtc ?? "",
      row.agingDays !== undefined ? String(row.agingDays) : "",
      formatRiskRegisterStaleCell(row.isStale),
      row.humanReviewStatusLabel ?? "",
      row.itsmLinkedTicketsSummary ?? "",
    ].map((c) => escapeCsvCell(c));

    lines.push(cells.join(","));
  }

  return `${lines.join("\r\n")}\r\n`;
}

function formatRiskRegisterStaleCell(isStale: boolean | undefined): string {
  if (isStale === undefined) {
    return ARCHITECTURE_RISK_REGISTER_STALE_FLAG_NOT_STORED;
  }

  return isStale ? "yes" : "no";
}

function formatRiskRegisterLastReviewedCell(lastReviewedUtc: string | null | undefined): string {
  if (lastReviewedUtc === null || lastReviewedUtc === undefined) {
    return ARCHITECTURE_RISK_REGISTER_LAST_REVIEWED_NOT_STORED;
  }

  if (lastReviewedUtc.length === 0) {
    return ARCHITECTURE_RISK_REGISTER_LAST_REVIEWED_STORED_EMPTY;
  }

  return lastReviewedUtc;
}

function formatRiskRegisterOwnerCell(ownerUserId: string | null | undefined): string {
  const trimmed = ownerUserId?.trim() ?? "";

  if (trimmed.length === 0) {
    return ARCHITECTURE_RISK_REGISTER_OWNER_NOT_STORED;
  }

  return trimmed;
}

function inspectPath(runId: string, findingId: string): string {
  const trimmedRunId = runId.trim();

  if (trimmedRunId.length === 0 || trimmedRunId === "—" || trimmedRunId === " — ") {
    return ARCHITECTURE_RISK_REGISTER_EVIDENCE_LINK_NOT_STORED;
  }

  return getFindingEvidenceTraceHref(trimmedRunId, findingId);
}

export function downloadArchitectureRiskRegisterCsv(
  rows: readonly ArchitectureRiskRegisterCsvRow[],
  filename = "architecture-risk-register.csv",
): void {
  const csv = buildArchitectureRiskRegisterCsv(rows);
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}
