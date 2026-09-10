import type { ArchitectureDecisionRegisterEntry } from "@/lib/api/governance-stickiness-api";
import {
  buildSemanticSupportBandExportStamp,
  resolveSupportingFindingSemanticSupportBands,
  type SemanticSupportBandExportStamp,
} from "@/lib/findings/finding-semantic-support-band-export";
import type { FindingSemanticSupportBandValue } from "@/lib/findings/semantic-support-band-presentation";
import type { QuickDecisionFinding } from "@/lib/quick-decision-summary-derive";
import type { StructuralExecutionModeInput } from "@/lib/structural-execution-mode";

export const DECISION_REGISTER_EXPORT_DISPOSITION_HONESTY_HEADER =
  "Disposition honesty: confidenceSource and buyerConfidenceSource describe how each row's confidence was determined — do not treat Unknown or heuristic basis as evidence-backed without review.";

export type DecisionRegisterExportContext = {
  readonly findings?: readonly QuickDecisionFinding[];
  readonly structuralExecutionMode?: StructuralExecutionModeInput;
};

export type DecisionRegisterExportSemanticSupportBandStampDocument = {
  readonly scorerVersion: string;
  readonly supported: number;
  readonly unchecked: number;
  readonly unsupported: number;
  readonly notScored: number;
  readonly decisionGradeTotal: number;
  readonly stampLine: string | null;
};

export type DecisionRegisterExportDocument = {
  readonly schema: "archlucid.decision-register-export.v1";
  readonly exportedAtUtc: string;
  readonly dispositionHonesty: string;
  readonly decisionCount: number;
  readonly semanticSupportBandStamp?: DecisionRegisterExportSemanticSupportBandStampDocument;
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
  readonly supportingFindingSemanticSupportBands?: Record<string, FindingSemanticSupportBandValue>;
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

function mapSemanticSupportBandStampDocument(
  stamp: SemanticSupportBandExportStamp,
): DecisionRegisterExportSemanticSupportBandStampDocument {
  return {
    scorerVersion: stamp.scorerVersion,
    supported: stamp.counts.supported,
    unchecked: stamp.counts.unchecked,
    unsupported: stamp.counts.unsupported,
    notScored: stamp.counts.notScored,
    decisionGradeTotal: stamp.counts.decisionGradeTotal,
    stampLine: stamp.stampLine,
  };
}

export function mapDecisionRegisterExportRows(
  decisions: readonly ArchitectureDecisionRegisterEntry[],
  context?: DecisionRegisterExportContext,
): DecisionRegisterExportRow[] {
  const findings = context?.findings ?? [];

  return decisions.map((decision) => {
    const supportingFindingIds = decision.supportingFindingIds ?? [];
    const supportingFindingSemanticSupportBands =
      findings.length === 0
        ? undefined
        : resolveSupportingFindingSemanticSupportBands(supportingFindingIds, findings);

    return {
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
      supportingFindingIds,
      ...(supportingFindingSemanticSupportBands !== undefined
      && Object.keys(supportingFindingSemanticSupportBands).length > 0
        ? { supportingFindingSemanticSupportBands }
        : {}),
    };
  });
}

export function buildDecisionRegisterExportDocument(
  decisions: readonly ArchitectureDecisionRegisterEntry[],
  context?: DecisionRegisterExportContext,
): DecisionRegisterExportDocument {
  const findings = context?.findings ?? [];
  const semanticStamp =
    findings.length === 0
      ? null
      : buildSemanticSupportBandExportStamp(findings, context?.structuralExecutionMode);

  return {
    schema: "archlucid.decision-register-export.v1",
    exportedAtUtc: new Date().toISOString(),
    dispositionHonesty: DECISION_REGISTER_EXPORT_DISPOSITION_HONESTY_HEADER,
    decisionCount: decisions.length,
    ...(semanticStamp === null
      ? {}
      : { semanticSupportBandStamp: mapSemanticSupportBandStampDocument(semanticStamp) }),
    decisions: mapDecisionRegisterExportRows(decisions, context),
  };
}

export function formatDecisionRegisterExportJson(
  decisions: readonly ArchitectureDecisionRegisterEntry[],
  context?: DecisionRegisterExportContext,
): string {
  return `${JSON.stringify(buildDecisionRegisterExportDocument(decisions, context), null, 2)}\n`;
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
  context?: DecisionRegisterExportContext,
): void {
  triggerBinaryDownload(
    formatDecisionRegisterExportJson(decisions, context),
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
