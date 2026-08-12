/**
 * Normalizes run labels into a short, single-line review title.
 *
 * The API sets `RunSummaryResponse.displayName` to the run description, and first-pilot intake stores an
 * auto-generated multi-sentence brief as that description when the operator does not type a long one. Without
 * normalization the review heading renders the entire intake prompt. Until the request `systemName` is carried
 * onto the run read model, the title the operator typed is only recoverable from that generated brief.
 */

/** Longest title rendered before an ellipsis; keeps the operator `h1` to one line at common widths. */
const MAX_REVIEW_TITLE_CHARS = 80;

/**
 * Opening sentence of `buildEvidenceBackedIntakeBrief`, which quotes the operator-entered title.
 * `\s*` before the period tolerates briefs written before the sentence separator was fixed.
 */
const GENERATED_INTAKE_BRIEF_PATTERN = /^Architecture review intake for\s+"(.+?)"\s*\./;

/** True when the text is the auto-generated intake brief rather than operator-authored content. */
export function isGeneratedIntakeBrief(text: string | null | undefined): boolean {
  return GENERATED_INTAKE_BRIEF_PATTERN.test((text ?? "").trim());
}

/** Recovers the operator-entered title quoted inside the generated intake brief. */
export function extractGeneratedIntakeBriefTitle(text: string | null | undefined): string | null {
  const match: RegExpExecArray | null = GENERATED_INTAKE_BRIEF_PATTERN.exec((text ?? "").trim());

  return match === null ? null : match[1].trim();
}

function firstNonEmptyLine(text: string): string {
  return text.split(/\r?\n/).map((line) => line.trim()).find((line) => line.length > 0) ?? "";
}

/** Requires whitespace or end-of-string after the terminator so decimals and abbreviations do not split. */
function firstSentence(text: string): string {
  const match: RegExpExecArray | null = /^(.+?[.!?])(?:\s|$)/.exec(text);

  return match === null ? text : match[1];
}

function clampTitle(text: string): string {
  if (text.length <= MAX_REVIEW_TITLE_CHARS) {
    return text;
  }

  return `${text.slice(0, MAX_REVIEW_TITLE_CHARS - 1).trimEnd()}…`;
}

/** Turns any run label candidate (display name or description) into a single-line review title. */
export function toReviewDisplayTitle(candidate: string | null | undefined): string {
  const trimmed: string = (candidate ?? "").trim();

  if (trimmed.length === 0) {
    return "";
  }

  const generatedTitle: string | null = extractGeneratedIntakeBriefTitle(trimmed);

  if (generatedTitle !== null && generatedTitle.length > 0) {
    return clampTitle(generatedTitle);
  }

  return clampTitle(firstSentence(firstNonEmptyLine(trimmed)));
}
