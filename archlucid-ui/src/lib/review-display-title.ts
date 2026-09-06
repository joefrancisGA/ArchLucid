/**
 * Normalizes run labels into a short, single-line review title.
 *
 * The API sets `RunSummaryResponse.displayName` to the run description, and first-pilot intake stores an
 * auto-generated multi-sentence brief as that description when the operator does not type a long one. Without
 * normalization the review heading renders the entire intake prompt. Until the request `systemName` is carried
 * onto the run read model, the title the operator typed is only recoverable from that generated brief.
 */

/** Longest title rendered before an ellipsis; keeps the operator `h1` to one line at common widths. */
export const MAX_REVIEW_TITLE_CHARS = 120;

/** List-surface clamp — wider than workspace h1 so table cells use available width before ellipsis. */
export const MAX_REVIEW_LIST_TITLE_CHARS = 160;

/** Defensive workspace header clamp — no data path should exceed this on the review `h1`. */
export const MAX_REVIEW_WORKSPACE_H1_CHARS = 120;

/**
 * Opening sentence of `buildEvidenceBackedIntakeBrief`, which quotes the operator-entered title.
 * `\s*` before the period tolerates briefs written before the sentence separator was fixed.
 */
const GENERATED_INTAKE_BRIEF_PATTERN = /^Architecture review intake for\s+"(.+?)"\s*\./;

const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}(?:[tT\s].*)?$/;

const METADATA_DATE_FRAGMENT_PATTERN = /^(?:reviewed|updated|created|modified|date|status)\s*:\s*.+$/i;

/** Synthetic evaluation packets store a canonical heading inside the review body. */
const ARCHITECTURE_REVIEW_PACKET_TITLE_PATTERN =
  /Architecture Review Packet:\s*(.+?)(?=\s+(?:Classification|Domain|\*\*|[1-9]+\.)|\s{2,}|$)/i;

const MARKDOWN_HEADING_LINE_PATTERN = /^#{1,6}\s+(.+)$/;

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

function extractArchitectureReviewPacketTitle(text: string): string | null {
  const strippedBlob = stripInlineMarkdownFromReviewText(text);
  const match = ARCHITECTURE_REVIEW_PACKET_TITLE_PATTERN.exec(strippedBlob);

  if (match === null) {
    return null;
  }

  const title = `Architecture Review Packet: ${match[1].trim()}`;

  return isUnusableReviewTitleCandidate(title) ? null : clampTitle(title);
}

function extractMarkdownHeadingTitle(text: string): string | null {
  for (const rawLine of text.split(/\r?\n/)) {
    const strippedLine = stripLinePrefixMarkdown(rawLine.trim());
    const headingMatch = MARKDOWN_HEADING_LINE_PATTERN.exec(strippedLine);

    if (headingMatch === null) {
      continue;
    }

    const normalized = clampTitle(headingMatch[1]);

    if (!isUnusableReviewTitleCandidate(normalized)) {
      return normalized;
    }
  }

  return null;
}

function firstUsableLineTitle(text: string): string {
  for (const rawLine of text.split(/\r?\n/)) {
    const strippedLine = stripLinePrefixMarkdown(rawLine.trim());

    if (strippedLine.length === 0) {
      continue;
    }

    const normalized = clampTitle(firstSentence(strippedLine));

    if (!isUnusableReviewTitleCandidate(normalized)) {
      return normalized;
    }
  }

  const fallbackLine = firstNonEmptyLine(text);

  return fallbackLine.length > 0 ? clampTitle(firstSentence(fallbackLine)) : "";
}

function stripLinePrefixMarkdown(line: string): string {
  let result = line.trim();

  // Blockquote carets must be removed per line before whitespace collapse.
  while (/^>\s?/.test(result)) {
    result = result.replace(/^>\s?/, "").trim();
  }

  result = result.replace(/^[-*+]\s+/, "");
  result = result.replace(/^\d+\.\s+/, "");

  return result;
}

/** Strips inline markdown so package blobs never render literal `**` or `#` in titles. */
export function stripInlineMarkdownFromReviewText(text: string): string {
  const lines = text.split(/\r?\n/);
  const normalizedLines: string[] = [];

  for (const rawLine of lines) {
    const trimmedLine = rawLine.trim();

    if (trimmedLine.length === 0) {
      continue;
    }

    if (/^\s*\|.*\|\s*$/.test(trimmedLine)) {
      continue;
    }

    const strippedLine = stripLinePrefixMarkdown(trimmedLine);

    if (strippedLine.length > 0) {
      normalizedLines.push(strippedLine);
    }
  }

  let result = normalizedLines.join(" ");

  result = result.replace(/\*\*(.+?)\*\*/g, "$1");
  result = result.replace(/\*(.+?)\*/g, "$1");
  // Underscore emphasis only counts at word boundaries so identifiers such as `my_api_gateway` survive intact.
  result = result.replace(/(^|[\s(])__(\S(?:[\s\S]*?\S)?)__(?=[\s).,;:!?]|$)/g, "$1$2");
  result = result.replace(/(^|[\s(])_(\S(?:[\s\S]*?\S)?)_(?=[\s).,;:!?]|$)/g, "$1$2");
  result = result.replace(/`([^`]+)`/g, "$1");
  result = result.replace(/^#+\s*/gm, "");

  return result.replace(/\s+/g, " ").trim();
}

/** Rejects uploaded-document fragments that must not become review identity in operator chrome. */
export function isUnusableReviewTitleCandidate(text: string | null | undefined): boolean {
  const stripped = stripInlineMarkdownFromReviewText((text ?? "").trim());

  if (stripped.length === 0) {
    return true;
  }

  // A candidate with no letters is a date, a numbering artifact, or table residue — never a name.
  // Length alone is not a signal: "API" and "IAM" are legitimate short system names.
  if (!/[A-Za-z]/.test(stripped)) {
    return true;
  }

  if (ISO_DATE_PATTERN.test(stripped)) {
    return true;
  }

  if (METADATA_DATE_FRAGMENT_PATTERN.test(stripped)) {
    const valuePart = stripped.replace(/^[^:]+:\s*/, "").trim();

    if (valuePart.length === 0 || ISO_DATE_PATTERN.test(valuePart) || /^\d{4}-\d{2}-\d{2}$/.test(valuePart)) {
      return true;
    }
  }

  return false;
}

function clampTitle(text: string, maxChars: number = MAX_REVIEW_TITLE_CHARS): string {
  const stripped = stripInlineMarkdownFromReviewText(text);

  if (stripped.length <= maxChars) {
    return stripped;
  }

  return `${stripped.slice(0, maxChars - 1).trimEnd()}…`;
}

/** Single-line workspace header clamp applied at render time. */
export function clampReviewWorkspaceH1Title(title: string): string {
  const stripped = stripInlineMarkdownFromReviewText(title.trim());

  if (stripped.length <= MAX_REVIEW_WORKSPACE_H1_CHARS) {
    return stripped;
  }

  return `${stripped.slice(0, MAX_REVIEW_WORKSPACE_H1_CHARS - 3).trimEnd()}…`;
}

const SYNTHETIC_SAMPLE_TITLE_SUFFIX_PATTERN =
  /\s*[—–-]\s*born[\s-]*governed(?:\s+created)?\s+architecture\s+package(?:\s*\([^)]*)?[\s.…]*$/i;

export function stripSyntheticSampleTitleSuffix(text: string): string {
  return text.replace(SYNTHETIC_SAMPLE_TITLE_SUFFIX_PATTERN, "").trim();
}

/** Turns any run label candidate (display name or description) into a single-line review title. */
export function toReviewDisplayTitle(candidate: string | null | undefined): string {
  const trimmed: string = (candidate ?? "").trim();

  if (trimmed.length === 0) {
    return "";
  }

  const generatedTitle: string | null = extractGeneratedIntakeBriefTitle(trimmed);

  if (generatedTitle !== null && generatedTitle.length > 0) {
    const normalizedGeneratedTitle = clampTitle(generatedTitle);

    const withoutSuffix = stripSyntheticSampleTitleSuffix(normalizedGeneratedTitle);

    return isUnusableReviewTitleCandidate(withoutSuffix) ? "" : withoutSuffix;
  }

  const architectureReviewPacketTitle = extractArchitectureReviewPacketTitle(trimmed);

  if (architectureReviewPacketTitle !== null) {
    return stripSyntheticSampleTitleSuffix(architectureReviewPacketTitle);
  }

  const markdownHeadingTitle = extractMarkdownHeadingTitle(trimmed);

  if (markdownHeadingTitle !== null) {
    return stripSyntheticSampleTitleSuffix(markdownHeadingTitle);
  }

  const titleCandidate = firstUsableLineTitle(trimmed);
  const normalized: string = titleCandidate;

  const withoutSuffix = stripSyntheticSampleTitleSuffix(normalized);

  return isUnusableReviewTitleCandidate(withoutSuffix) ? "" : withoutSuffix;
}

/** List-surface title clamp with a wider budget than workspace headers. */
export function toReviewListDisplayTitle(candidate: string | null | undefined): string {
  const title = toReviewDisplayTitle(candidate);

  if (title.length <= MAX_REVIEW_LIST_TITLE_CHARS) {
    return title;
  }

  return clampTitle(title, MAX_REVIEW_LIST_TITLE_CHARS);
}
