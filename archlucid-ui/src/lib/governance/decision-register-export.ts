import type { ArchitectureDecisionRegisterEntry } from "@/lib/api/governance-stickiness-api";

export const DECISION_REGISTER_EXPORT_DISPOSITION_HONESTY_HEADER =
  "Disposition honesty: confidenceSource and buyerConfidenceSource describe how each row's confidence was determined — do not treat Unknown or heuristic basis as evidence-backed without review.";

export type DecisionRegisterExportDocument = {
  readonly schema: "archlucid.decision-register-export.v1";
  readonly exportedAtUtc: string;
  readonly dispositionHonesty: string;
  readonly decisionCount: number;
  readonly decisions: readonly DecisionRegisterExportRow[];
};

export type DecisionRegisterExportRow = {
  readonly decisionId: string;
  readonly title: string;
  readonly category: string;
  readonly selectedOption: string;
  readonly rationale: string;
  readonly confidence: string;
  readonly confidenceSource: string;
  readonly buyerConfidenceSource: string;
  readonly recordedAtUtc: string;
  readonly runId: string;
  readonly manifestId: string;
  readonly supportingFindingIds: readonly string[];
};

function escapeCsvCell(value: string): string {
  if (value.includes(",") || value.includes('"') || value.includes("\n") || value.includes("\r")) {
    return `"${value.replaceAll('"', '""')}"`;
  }

  return value;
}

function formatConfidence(decision: ArchitectureDecisionRegisterEntry): string {
  if (decision.confidence !== null && decision.confidence !== undefined) {
    return String(decision.confidence);
  }

  return "Unknown";
}

function formatDispositionSource(value: string | null | undefined): string {
  const trimmed = value?.trim() ?? "";

  if (trimmed.length === 0) {
    return "Unknown";
  }

  return trimmed;
}

export function mapDecisionRegisterExportRows(
  decisions: readonly ArchitectureDecisionRegisterEntry[],
): DecisionRegisterExportRow[] {
  return decisions.map((decision) => ({
    decisionId: decision.decisionId,
    title: decision.title,
    category: decision.category,
    selectedOption: decision.selectedOption,
    rationale: decision.rationale,
    confidence: formatConfidence(decision),
    confidenceSource: formatDispositionSource(decision.confidenceSource),
    buyerConfidenceSource: formatDispositionSource(decision.buyerConfidenceSource),
    recordedAtUtc: decision.recordedAtUtc,
    runId: decision.runId,
    manifestId: decision.manifestId,
    supportingFindingIds: decision.supportingFindingIds ?? [],
  }));
}

export function buildDecisionRegisterExportDocument(
  decisions: readonly ArchitectureDecisionRegisterEntry[],
): DecisionRegisterExportDocument {
  return {
    schema: "archlucid.decision-register-export.v1",
    exportedAtUtc: new Date().toISOString(),
    dispositionHonesty: DECISION_REGISTER_EXPORT_DISPOSITION_HONESTY_HEADER,
    decisionCount: decisions.length,
    decisions: mapDecisionRegisterExportRows(decisions),
  };
}

export function formatDecisionRegisterExportJson(
  decisions: readonly ArchitectureDecisionRegisterEntry[],
): string {
  return `${JSON.stringify(buildDecisionRegisterExportDocument(decisions), null, 2)}\n`;
}

export function formatDecisionRegisterExportCsv(
  decisions: readonly ArchitectureDecisionRegisterEntry[],
): string {
  const rows = mapDecisionRegisterExportRows(decisions);
  const lines: string[] = [
    `# ${DECISION_REGISTER_EXPORT_DISPOSITION_HONESTY_HEADER}`,
    "decisionId,title,category,selectedOption,rationale,confidence,confidenceSource,buyerConfidenceSource,recordedAtUtc,runId,manifestId,supportingFindingIds",
  ];

  for (const row of rows) {
    lines.push(
      [
        escapeCsvCell(row.decisionId),
        escapeCsvCell(row.title),
        escapeCsvCell(row.category),
        escapeCsvCell(row.selectedOption),
        escapeCsvCell(row.rationale),
        escapeCsvCell(row.confidence),
        escapeCsvCell(row.confidenceSource),
        escapeCsvCell(row.buyerConfidenceSource),
        escapeCsvCell(row.recordedAtUtc),
        escapeCsvCell(row.runId),
        escapeCsvCell(row.manifestId),
        escapeCsvCell(row.supportingFindingIds.join(";")),
      ].join(","),
    );
  }

  return `${lines.join("\n")}\n`;
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

export function triggerDecisionRegisterJsonDownload(
  decisions: readonly ArchitectureDecisionRegisterEntry[],
  filename = "architecture-decision-register.json",
): void {
  triggerBinaryDownload(
    formatDecisionRegisterExportJson(decisions),
    "application/json;charset=utf-8",
    filename,
  );
}

export function triggerDecisionRegisterCsvDownload(
  decisions: readonly ArchitectureDecisionRegisterEntry[],
  filename = "architecture-decision-register.csv",
): void {
  triggerBinaryDownload(formatDecisionRegisterExportCsv(decisions), "text/csv;charset=utf-8", filename);
}
