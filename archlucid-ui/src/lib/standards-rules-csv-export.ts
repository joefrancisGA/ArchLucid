import type { StandardsRuleRow } from "@/lib/standards-rules-rows";

function escapeCsvCell(value: string): string {
  const normalized = value.replace(/\r\n/g, "\n").trim();

  if (/[",\n]/.test(normalized)) {
    return `"${normalized.replace(/"/g, '""')}"`;
  }

  return normalized;
}

export function buildStandardsRulesCsv(rows: readonly StandardsRuleRow[]): string {
  const header = [
    "Rule",
    "Standard / framework",
    "Category",
    "Severity",
    "Enforcement mode",
    "Source policy pack",
    "Linked findings",
    "Evidence",
  ];

  const lines = rows.map((row) => {
    const cells = [
      row.ruleName,
      row.standardFramework,
      row.category,
      row.severity,
      row.enforcementMode,
      row.sourcePolicyPack,
      row.linkedFindingsLabel ?? "",
      row.evidenceHref !== null ? "Evidenced" : "Not evidenced",
    ];

    return cells.map(escapeCsvCell).join(",");
  });

  return [header.join(","), ...lines].join("\n");
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

export function triggerStandardsRulesCsvDownload(rows: readonly StandardsRuleRow[]): void {
  const csv = buildStandardsRulesCsv(rows);
  const exportedAt = new Date().toISOString().slice(0, 10);

  triggerBinaryDownload(csv, "text/csv;charset=utf-8", `standards-rules-${exportedAt}.csv`);
}
