import {
  formatStoredTextPreview,
  STORED_TEXT_PREVIEW_CONTINUATION,
} from "@/lib/format-stored-text-preview";

export type ProseAssumptionDisposition = "contradicted" | "consistent" | "notVerifiable";

export const PROSE_ASSUMPTION_ROW_NOT_STORED_IN_FULL = "An assumption row was not stored in full." as const;

export const PROSE_ASSUMPTION_STATEMENT_NOT_STORED = "Assumption statement was not stored." as const;
export const PROSE_ASSUMPTION_DOCUMENT_PATH_NOT_STORED = "Document path was not stored." as const;
export const PROSE_ASSUMPTION_LINE_NOT_STORED = "Line was not stored." as const;
export const PROSE_ASSUMPTION_EVIDENCE_REF_NOT_STORED = "Evidence ref was not stored." as const;
export const PROSE_ASSUMPTION_DISPOSITION_NOT_STORED = "Disposition was not stored." as const;

export type ProseAssumptionRegisterEntry = {
  readonly statement: string;
  readonly documentPath: string;
  readonly lineNumber: number;
  readonly lineNumberStored: boolean;
  readonly evidenceRef: string;
  readonly logicalPropertyName: string | null;
  readonly disposition: ProseAssumptionDisposition;
  readonly dispositionStored: boolean;
  readonly findingId: string | null;
  readonly rowNotStoredInFull?: boolean;
};

const PROSE_ASSUMPTION_DISPOSITIONS: readonly ProseAssumptionDisposition[] = [
  "contradicted",
  "consistent",
  "notVerifiable",
];

function isProseAssumptionDisposition(value: string): value is ProseAssumptionDisposition {
  return (PROSE_ASSUMPTION_DISPOSITIONS as readonly string[]).includes(value);
}

function readOptionalTrimmedString(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();

  return trimmed.length > 0 ? trimmed : null;
}

/** Reads prose assumption register rows persisted on findings snapshot curation (DX-61). */
export function readProseAssumptionRegisterFromFindingsSnapshot(
  findingsSnapshot: unknown,
): readonly ProseAssumptionRegisterEntry[] {
  if (findingsSnapshot === null || typeof findingsSnapshot !== "object") {
    return [];
  }

  const curation = (findingsSnapshot as { insightDensityCuration?: unknown }).insightDensityCuration;

  if (curation === null || typeof curation !== "object") {
    return [];
  }

  const rawEntries = (curation as { proseAssumptionRegisterEntries?: unknown }).proseAssumptionRegisterEntries;

  if (!Array.isArray(rawEntries)) {
    return [];
  }

  const entries: ProseAssumptionRegisterEntry[] = [];

  for (const rawEntry of rawEntries) {
    if (rawEntry === null || typeof rawEntry !== "object") {
      entries.push({
        statement: PROSE_ASSUMPTION_ROW_NOT_STORED_IN_FULL,
        documentPath: PROSE_ASSUMPTION_DOCUMENT_PATH_NOT_STORED,
        lineNumber: 0,
        lineNumberStored: false,
        evidenceRef: PROSE_ASSUMPTION_EVIDENCE_REF_NOT_STORED,
        logicalPropertyName: null,
        disposition: "notVerifiable",
        dispositionStored: false,
        findingId: null,
        rowNotStoredInFull: true,
      });
      continue;
    }

    const statementRaw = (rawEntry as { statement?: unknown }).statement;
    const documentPathRaw = (rawEntry as { documentPath?: unknown }).documentPath;
    const lineNumberRaw = (rawEntry as { lineNumber?: unknown }).lineNumber;
    const evidenceRefRaw = (rawEntry as { evidenceRef?: unknown }).evidenceRef;
    const logicalPropertyNameRaw = (rawEntry as { logicalPropertyName?: unknown }).logicalPropertyName;
    const dispositionRaw = (rawEntry as { disposition?: unknown }).disposition;
    const findingIdRaw = (rawEntry as { findingId?: unknown }).findingId;

    const lineNumberStored = typeof lineNumberRaw === "number" && Number.isFinite(lineNumberRaw);
    const dispositionStored =
      typeof dispositionRaw === "string" && isProseAssumptionDisposition(dispositionRaw);

    entries.push({
      statement: readOptionalTrimmedString(statementRaw) ?? PROSE_ASSUMPTION_STATEMENT_NOT_STORED,
      documentPath: readOptionalTrimmedString(documentPathRaw) ?? PROSE_ASSUMPTION_DOCUMENT_PATH_NOT_STORED,
      lineNumber: lineNumberStored ? Math.trunc(lineNumberRaw) : 0,
      lineNumberStored,
      evidenceRef: readOptionalTrimmedString(evidenceRefRaw) ?? PROSE_ASSUMPTION_EVIDENCE_REF_NOT_STORED,
      logicalPropertyName: readOptionalTrimmedString(logicalPropertyNameRaw),
      disposition: dispositionStored ? dispositionRaw : "notVerifiable",
      dispositionStored,
      findingId: readOptionalTrimmedString(findingIdRaw),
    });
  }

  return entries;
}

export function formatProseAssumptionDispositionLabel(disposition: ProseAssumptionDisposition): string {
  switch (disposition) {
    case "contradicted":
      return "contradicted";
    case "consistent":
      return "consistent";
    case "notVerifiable":
      return "not verifiable";
    default: {
      const exhaustive: never = disposition;
      return exhaustive;
    }
  }
}

const PROSE_ASSUMPTION_STATEMENT_MAX_LENGTH = 96;

function truncateProseAssumptionStatement(statement: string): string {
  if (statement.length <= PROSE_ASSUMPTION_STATEMENT_MAX_LENGTH) {
    return statement;
  }

  return formatStoredTextPreview(
    statement,
    PROSE_ASSUMPTION_STATEMENT_MAX_LENGTH,
    STORED_TEXT_PREVIEW_CONTINUATION.proseAssumptionStatement,
  );
}

export function formatProseAssumptionRegisterLabels(
  entries: readonly ProseAssumptionRegisterEntry[],
): readonly string[] {
  return entries.map((entry) => {
    if (entry.rowNotStoredInFull === true) {
      return PROSE_ASSUMPTION_ROW_NOT_STORED_IN_FULL;
    }

    const dispositionLabel = entry.dispositionStored
      ? formatProseAssumptionDispositionLabel(entry.disposition)
      : PROSE_ASSUMPTION_DISPOSITION_NOT_STORED;
    const lineLabel = entry.lineNumberStored
      ? `line ${entry.lineNumber}`
      : PROSE_ASSUMPTION_LINE_NOT_STORED;

    return `${truncateProseAssumptionStatement(entry.statement)} — ${dispositionLabel} (${entry.evidenceRef}, ${lineLabel})`;
  });
}
