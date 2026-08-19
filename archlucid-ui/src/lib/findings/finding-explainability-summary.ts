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

export function findingSeverityAudienceCopy(severityRaw: string): FindingSeverityInspectCopy {
  const trimmed = severityRaw.trim();
  const lowered = trimmed.toLowerCase();

  if (lowered.includes("critical") || lowered.includes(" blocker") || lowered === "blocking") {
    return {
      meaningForOperators:
        "Highest urgency — this signals material delivery, compliance, or security risk if it is left unaddressed.",
      suggestedNext:
        "Get an explicit owner decision (fix it, grant a time-bound waiver, or accept the residual risk) before rollout.",
    };
  }

  if (lowered.includes("high")) {
    return {
      meaningForOperators:
        "Elevated urgency — this is likely to affect a rollout decision or stakeholder trust if it goes unexplained.",
      suggestedNext:
        "Confirm it with the owning team soon, and rank it against the other findings rather than shelving it.",
    };
  }

  if (lowered.includes("medium") || lowered.includes("moderate")) {
    return {
      meaningForOperators:
        "Normal planning priority — a real gap, but not one that should stop work today.",
      suggestedNext:
        "Schedule the fix, or write down why you are accepting it, while the context is still fresh.",
    };
  }

  if (
    lowered.includes("low")
    || lowered.includes("info")
    || lowered.includes("informational")
    || lowered.includes("minor")
  ) {
    return {
      meaningForOperators:
        "Low urgency — an improvement opportunity rather than a risk that needs attention now.",
      suggestedNext:
        "Handle it with the rest of your backlog cleanup, unless another decision is waiting on it.",
    };
  }

  return {
    meaningForOperators: `This review reported severity "${trimmed}", which is outside the standard scale.`,
    suggestedNext: "Compare it against the other findings — relative order tells you more than the label does.",
  };
}

export function findingTraceCompletenessPlainEnglish(ratioPct: number): string {
  const r = Math.min(100, Math.max(0, Math.round(ratioPct)));

  if (!Number.isFinite(r)) {
    return "Unavailable — this review did not record a completeness score.";
  }

  if (r >= 90) {
    return "Strong — ArchLucid recorded nearly everything it uses to justify a finding.";
  }

  if (r >= 60) {
    return "Moderate — direct evidence exists, but some supporting detail was not captured.";
  }

  if (r >= 30) {
    return "Thin — read the technical audit below before relying on this finding on its own.";
  }

  return "Minimal — treat this finding as a prompt to look further, not as a settled conclusion.";
}

export function findingEvidenceCountPlainLine(evidenceRefs: readonly string[] | undefined | null): string {
  const n = evidenceRefs?.length ?? 0;

  if (n <= 0) {
    return "No structured sources were recorded for this finding.";
  }

  if (n === 1) {
    return "1 structured source supports this finding.";
  }

  return `${n} structured sources support this finding.`;
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
export function findingRationalePreview(input: FindingRationalePreviewInput): string | null {
  const stripped = stripFindingNarrativePreamble(input.narrativeText, input.findingId);
  const source = stripped.length > 0 ? stripped : input.conclusion.trim();
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
  readonly evidenceRefCount: number;
  readonly missingTraceFieldCount: number;
};

function evidenceSourceClause(count: number): string {
  if (count <= 0) {
    return "no supporting source was recorded";
  }

  if (count === 1) {
    return "only one supporting source was identified";
  }

  return `${count} supporting sources were identified`;
}

function traceDimensionClause(missingCount: number): string {
  if (missingCount <= 0) {
    return "every part of the reasoning trace was captured";
  }

  if (missingCount === 1) {
    return "one part of the reasoning trace was left empty";
  }

  return `${missingCount} parts of the reasoning trace were left empty`;
}

function confidenceLeadIn(label: string | null): string {
  if (label === "High") {
    return "The conclusion is well corroborated:";
  }

  if (label === "Medium") {
    return "The conclusion is partly corroborated:";
  }

  if (label === "Low") {
    return "The conclusion is stated clearly, but weakly corroborated:";
  }

  return "This review did not score confidence for the finding:";
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
