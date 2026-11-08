import { getFindingEvidenceTraceHref } from "@/lib/findings/finding-evidence-navigation";
import { isUuidLike } from "@/lib/resolve-governance-finding-resource-group";

export const ARCHITECTURE_RISK_REGISTER_SYSTEM_NAME_NOT_STORED = "System name was not stored." as const;

export const ARCHITECTURE_RISK_REGISTER_OWNER_NOT_STORED = "Owner was not stored." as const;

export const ARCHITECTURE_RISK_REGISTER_OWNER_DISPLAY_NAME_NOT_STORED =
  "Owner display name was not stored." as const;

export const ARCHITECTURE_RISK_REGISTER_EVIDENCE_LINK_NOT_STORED = "Evidence link was not stored." as const;

export const ARCHITECTURE_RISK_REGISTER_EVIDENCE_LINK_STORED_EMPTY = "Evidence link was stored empty." as const;

export const ARCHITECTURE_RISK_REGISTER_STALE_FLAG_NOT_STORED = "Stale flag was not stored." as const;

export const ARCHITECTURE_RISK_REGISTER_LAST_REVIEWED_NOT_STORED = "Last reviewed was not stored." as const;

export const ARCHITECTURE_RISK_REGISTER_LAST_REVIEWED_STORED_EMPTY = "Last reviewed was stored empty." as const;

export const ARCHITECTURE_RISK_REGISTER_NEXT_REVIEW_NOT_STORED = "Next review was not stored." as const;

export const ARCHITECTURE_RISK_REGISTER_NEXT_REVIEW_STORED_EMPTY = "Next review was stored empty." as const;

export const ARCHITECTURE_RISK_REGISTER_HUMAN_REVIEW_NOT_STORED = "Human review status was not stored." as const;

export const ARCHITECTURE_RISK_REGISTER_HUMAN_REVIEW_STORED_EMPTY = "Human review status was stored empty." as const;

export const ARCHITECTURE_RISK_REGISTER_ITSM_LINKAGE_NOT_STORED = "ITSM linkage was not stored." as const;

export const ARCHITECTURE_RISK_REGISTER_ITSM_LINKAGE_STORED_EMPTY = "ITSM linkage was stored empty." as const;

export const ARCHITECTURE_RISK_REGISTER_AGING_DAYS_NOT_STORED = "Aging days was not stored." as const;

export type ArchitectureRiskRegisterCsvRow = {
  recordKind: "finding" | "decision";
  runId: string;
  findingId: string;
  title: string;
  severity: string;
  category: string;
  systemName?: string | null;
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
      formatRiskRegisterSystemNameCell(row.systemName),
      row.title,
      row.severity,
      formatRiskRegisterOwnerCell(row.ownerUserId),
      row.recommended,
      row.status,
      formatRiskRegisterEvidenceLinkCell(row.evidenceHref),
      formatRiskRegisterLastReviewedCell(row.lastReviewedUtc),
      formatRiskRegisterNextReviewCell(row.revisitDueUtc),
      formatRiskRegisterAgingDaysCell(row.agingDays),
      formatRiskRegisterStaleCell(row.isStale),
      formatRiskRegisterHumanReviewCell(row.humanReviewStatusLabel),
      formatRiskRegisterItsmLinkageCell(row.itsmLinkedTicketsSummary),
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

function formatRiskRegisterNextReviewCell(revisitDueUtc: string | null | undefined): string {
  if (revisitDueUtc === null || revisitDueUtc === undefined) {
    return ARCHITECTURE_RISK_REGISTER_NEXT_REVIEW_NOT_STORED;
  }

  if (revisitDueUtc.length === 0) {
    return ARCHITECTURE_RISK_REGISTER_NEXT_REVIEW_STORED_EMPTY;
  }

  return revisitDueUtc;
}

function formatRiskRegisterAgingDaysCell(agingDays: number | undefined): string {
  if (agingDays === undefined) {
    return ARCHITECTURE_RISK_REGISTER_AGING_DAYS_NOT_STORED;
  }

  return String(agingDays);
}

function formatRiskRegisterHumanReviewCell(humanReviewStatusLabel: string | null | undefined): string {
  if (humanReviewStatusLabel === null || humanReviewStatusLabel === undefined) {
    return ARCHITECTURE_RISK_REGISTER_HUMAN_REVIEW_NOT_STORED;
  }

  if (humanReviewStatusLabel.length === 0) {
    return ARCHITECTURE_RISK_REGISTER_HUMAN_REVIEW_STORED_EMPTY;
  }

  return humanReviewStatusLabel;
}

function formatRiskRegisterItsmLinkageCell(itsmLinkedTicketsSummary: string | null | undefined): string {
  if (itsmLinkedTicketsSummary === null || itsmLinkedTicketsSummary === undefined) {
    return ARCHITECTURE_RISK_REGISTER_ITSM_LINKAGE_NOT_STORED;
  }

  if (itsmLinkedTicketsSummary.length === 0) {
    return ARCHITECTURE_RISK_REGISTER_ITSM_LINKAGE_STORED_EMPTY;
  }

  return itsmLinkedTicketsSummary;
}

function formatRiskRegisterSystemNameCell(systemName: string | null | undefined): string {
  const trimmed = systemName?.trim() ?? "";

  if (trimmed.length === 0) {
    return ARCHITECTURE_RISK_REGISTER_SYSTEM_NAME_NOT_STORED;
  }

  return trimmed;
}

function formatRiskRegisterOwnerCell(ownerUserId: string | null | undefined): string {
  const trimmed = ownerUserId?.trim() ?? "";

  if (trimmed.length === 0) {
    return ARCHITECTURE_RISK_REGISTER_OWNER_NOT_STORED;
  }

  if (isUuidLike(trimmed)) {
    return ARCHITECTURE_RISK_REGISTER_OWNER_DISPLAY_NAME_NOT_STORED;
  }

  return trimmed;
}

function formatRiskRegisterEvidenceLinkCell(evidenceHref: string | undefined): string {
  if (evidenceHref === undefined) {
    return ARCHITECTURE_RISK_REGISTER_EVIDENCE_LINK_NOT_STORED;
  }

  if (evidenceHref.trim().length === 0) {
    return ARCHITECTURE_RISK_REGISTER_EVIDENCE_LINK_STORED_EMPTY;
  }

  return evidenceHref.trim();
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
