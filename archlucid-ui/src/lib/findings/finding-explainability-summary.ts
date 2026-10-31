/**
 * Plain-language lines for the Finding explainability dialog (deterministic payloads only).
 *
 * These helpers exist so the human-facing ordering and wording of the dialog is a reviewable,
 * unit-tested artifact rather than an accident of JSX layout. The dialog renders what these
 * functions return; it does not compose sentences itself.
 */

export type FindingSeverityInspectCopy = {
  meaningForOperators: string;
  suggestedNext: string;
};

const NEXT_STEP_NOT_STORED_WITH_SEVERITY = "A next step was not stored with this severity label.";

export const FINDING_EXPLAINABILITY_SEVERITY_MEANING_NOT_STORED =
  "Severity meaning was not stored." as const;

export function findingSeverityAudienceCopy(severityRaw: string): FindingSeverityInspectCopy {
  const trimmed = severityRaw.trim();

  if (trimmed.length === 0 || trimmed === "Severity was not stored") {
    return {
      meaningForOperators: FINDING_EXPLAINABILITY_SEVERITY_MEANING_NOT_STORED,
      suggestedNext: "",
    };
  }

  return {
    meaningForOperators: `Stored severity is ${trimmed}.`,
    suggestedNext: NEXT_STEP_NOT_STORED_WITH_SEVERITY,
  };
}

export function findingTraceCompletenessPlainEnglish(ratioPct: number): string {
  const r = Math.min(100, Math.max(0, Math.round(ratioPct)));

  if (!Number.isFinite(r)) {
    return "Unavailable — this review did not record a completeness score.";
  }

  return "Trace field fill was stored. It does not confirm the finding.";
}

/** Operator-facing policy rule id from explainability payloads (unspecified → honesty). */
export function formatFindingExplainabilityPolicyRuleDisplay(ruleId: string | null | undefined): string {
  const trimmed = ruleId?.trim() ?? "";

  if (trimmed.length === 0 || trimmed.toLowerCase() === "unspecified") {
    return "Policy rule was not stored.";
  }

  return trimmed;
}

export function findingEvidenceCountPlainLine(evidenceRefs: readonly string[] | undefined | null): string {
  if (evidenceRefs === null || evidenceRefs === undefined) {
    return "Sources were not stored for this finding.";
  }

  const n = evidenceRefs.length;

  if (n <= 0) {
    return "No structured sources were recorded for this finding.";
  }

  if (n === 1) {
    return "1 evidence reference was stored.";
  }

  return `${n} evidence references were stored.`;
}

/**
 * The pipeline prefixes persisted narratives with `Finding <id>:`. That preamble is meaningless to a
 * human reader and duplicates the identifier shown elsewhere, so it is stripped before display.
 */
export function stripFindingNarrativePreamble(narrativeText: string, findingId: string): string {
  const trimmed = narrativeText.trim();
  const id = findingId.trim();

  if (id.length === 0) {
    return trimmed;
  }

  // Literal prefix comparison rather than a regex: finding ids are caller-supplied and would need escaping.
  const preamble = `finding ${id.toLowerCase()}`;

  if (!trimmed.toLowerCase().startsWith(preamble)) {
    return trimmed;
  }

  return stripLeadingSeparators(trimmed.slice(preamble.length));
}

function stripLeadingSeparators(value: string): string {
  return value.replace(/^[\s:;,.\u2013\u2014-]+/, "").trim();
}

function normalizeForComparison(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, " ").replace(/[\s.:;,]+$/, "");
}

/**
 * Drops a leading restatement of `title` so the rationale adds information instead of repeating
 * the sentence already shown above it.
 */
function dropLeadingRestatement(source: string, title: string): string {
  const normalizedTitle = normalizeForComparison(title);

  if (normalizedTitle.length === 0) {
    return source.trim();
  }

  const normalizedSource = normalizeForComparison(source);

  if (normalizedSource === normalizedTitle) {
    return "";
  }

  if (!normalizedSource.startsWith(normalizedTitle)) {
    return source.trim();
  }

  return stripLeadingSeparators(source.trim().slice(title.trim().length));
}

export type FindingRationalePreviewInput = {
  readonly narrativeText: string;
  readonly conclusion: string;
  readonly title: string;
  readonly findingId: string;
};

/**
 * Rationale text worth showing above the fold, or `null` when everything it would say is already
 * on screen as the finding title.
 */
export const FINDING_EXPLAINABILITY_RATIONALE_NOT_STORED = "Rationale was not stored." as const;

export const FINDING_EXPLAINABILITY_TITLE_NOT_STORED = "Finding title was not stored." as const;

export const FINDING_EXPLAINABILITY_ENGINE_NOT_STORED = "Engine was not stored." as const;

export function findingRationalePreview(input: FindingRationalePreviewInput): string | null {
  const stripped = stripFindingNarrativePreamble(input.narrativeText, input.findingId);
  const source = stripped.length > 0 ? stripped : input.conclusion.trim();

  if (source.trim().length === 0) {
    return FINDING_EXPLAINABILITY_RATIONALE_NOT_STORED;
  }

  const withoutRestatement = dropLeadingRestatement(source, input.title);

  return withoutRestatement.length > 0 ? withoutRestatement : null;
}

export type FindingConfidenceExplanation = {
  /** Coarse bucket as persisted, or `null` when the review did not score confidence. */
  readonly label: string | null;
  /** Why the bucket is what it is, so a low score reads as an explanation rather than a warning. */
  readonly reason: string;
};

export type FindingConfidenceExplanationInput = {
  readonly level: string | null | undefined;
  /** `null` when the explainability payload omitted the evidence object. */
  readonly evidenceRefCount: number | null;
  /** `null` when the explainability payload omitted missingTraceFields. */
  readonly missingTraceFieldCount: number | null;
};

export const REASONING_TRACE_FIELDS_NOT_STORED_LABEL = "Reasoning trace fields were not stored." as const;

function evidenceSourceClause(count: number | null): string {
  if (count === null) {
    return "supporting sources were not stored";
  }

  if (count <= 0) {
    return "no supporting source was recorded";
  }

  if (count === 1) {
    return "only one supporting source was identified";
  }

  return `${count} supporting sources were identified`;
}

function traceDimensionClause(missingCount: number | null): string {
  if (missingCount === null) {
    return REASONING_TRACE_FIELDS_NOT_STORED_LABEL;
  }

  if (missingCount <= 0) {
    return "every part of the reasoning trace was captured";
  }

  if (missingCount === 1) {
    return "one part of the reasoning trace was left empty";
  }

  return `${missingCount} parts of the reasoning trace were left empty`;
}

function confidenceLeadIn(label: string | null): string {
  if (label === "High" || label === "Medium" || label === "Low") {
    return `Stored confidence is ${label}.`;
  }

  return "Confidence was not stored.";
}

/**
 * Turns the bare confidence bucket into a statement of *why* ArchLucid is more or less certain,
 * using signals already present on the explainability payload.
 */
export function findingConfidenceExplanation(
  input: FindingConfidenceExplanationInput,
): FindingConfidenceExplanation {
  const label =
    input.level === "High" || input.level === "Medium" || input.level === "Low" ? input.level : null;

  const reason = `${confidenceLeadIn(label)} ${evidenceSourceClause(input.evidenceRefCount)}, and ${traceDimensionClause(input.missingTraceFieldCount)}.`;

  return { label, reason };
}
