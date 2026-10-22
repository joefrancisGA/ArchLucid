export type ProseAssumptionDisposition = "contradicted" | "consistent" | "notVerifiable";

export type ProseAssumptionRegisterEntry = {
  readonly statement: string;
  readonly documentPath: string;
  readonly lineNumber: number;
  readonly evidenceRef: string;
  readonly logicalPropertyName: string | null;
  readonly disposition: ProseAssumptionDisposition;
  readonly findingId: string | null;
};

const PROSE_ASSUMPTION_DISPOSITIONS: readonly ProseAssumptionDisposition[] = [
  "contradicted",
  "consistent",
  "notVerifiable",
];

function isProseAssumptionDisposition(value: string): value is ProseAssumptionDisposition {
  return (PROSE_ASSUMPTION_DISPOSITIONS as readonly string[]).includes(value);
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
      continue;
    }

    const statementRaw = (rawEntry as { statement?: unknown }).statement;
    const documentPathRaw = (rawEntry as { documentPath?: unknown }).documentPath;
    const lineNumberRaw = (rawEntry as { lineNumber?: unknown }).lineNumber;
    const evidenceRefRaw = (rawEntry as { evidenceRef?: unknown }).evidenceRef;
    const logicalPropertyNameRaw = (rawEntry as { logicalPropertyName?: unknown }).logicalPropertyName;
    const dispositionRaw = (rawEntry as { disposition?: unknown }).disposition;
    const findingIdRaw = (rawEntry as { findingId?: unknown }).findingId;

    if (typeof statementRaw !== "string" || statementRaw.trim().length === 0) {
      continue;
    }

    if (typeof documentPathRaw !== "string" || documentPathRaw.trim().length === 0) {
      continue;
    }

    if (typeof lineNumberRaw !== "number" || !Number.isFinite(lineNumberRaw)) {
      continue;
    }

    if (typeof evidenceRefRaw !== "string" || evidenceRefRaw.trim().length === 0) {
      continue;
    }

    if (typeof dispositionRaw !== "string" || !isProseAssumptionDisposition(dispositionRaw)) {
      continue;
    }

    entries.push({
      statement: statementRaw.trim(),
      documentPath: documentPathRaw.trim(),
      lineNumber: Math.max(1, Math.trunc(lineNumberRaw)),
      evidenceRef: evidenceRefRaw.trim(),
      logicalPropertyName:
        typeof logicalPropertyNameRaw === "string" && logicalPropertyNameRaw.trim().length > 0
          ? logicalPropertyNameRaw.trim()
          : null,
      disposition: dispositionRaw,
      findingId: typeof findingIdRaw === "string" && findingIdRaw.trim().length > 0 ? findingIdRaw.trim() : null,
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

  return `${statement.slice(0, PROSE_ASSUMPTION_STATEMENT_MAX_LENGTH - 1).trimEnd()}…`;
}

export function formatProseAssumptionRegisterLabels(
  entries: readonly ProseAssumptionRegisterEntry[],
): readonly string[] {
  return entries.map((entry) => {
    const dispositionLabel = formatProseAssumptionDispositionLabel(entry.disposition);

    return `${truncateProseAssumptionStatement(entry.statement)} — ${dispositionLabel} (${entry.evidenceRef})`;
  });
}
