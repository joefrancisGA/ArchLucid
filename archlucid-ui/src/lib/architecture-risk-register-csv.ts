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
      row.ownerUserId ?? "unassigned",
      row.recommended,
      row.status,
      row.evidenceHref ?? inspectPath(row.runId, row.findingId),
      row.waiverExpiresAtUtc ?? "",
      row.revisitDueUtc ?? "",
      row.agingDays !== undefined ? String(row.agingDays) : "",
      row.isStale ? "yes" : "no",
      row.humanReviewStatusLabel ?? "",
      row.itsmLinkedTicketsSummary ?? "",
    ].map((c) => escapeCsvCell(c));

    lines.push(cells.join(","));
  }

  return `${lines.join("\r\n")}\r\n`;
}

function inspectPath(runId: string, findingId: string): string {
  if (runId === "—" || runId.trim().length === 0) {
    return findingId;
  }

  return `/reviews/${runId}/findings/${findingId}/inspect`;
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
