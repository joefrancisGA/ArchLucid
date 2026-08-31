import type { ScopeUnderstandingBullet } from "./architecture-scope-understanding-shared";
import { SCOPE_UNDERSTANDING_SECTION_HEADER } from "./architecture-scope-understanding-shared";
import { scopeBriefLines } from "./architecture-scope-understanding-validate";

/** Reads operator-confirmed scope lines already stored on a brief field. */
export function extractScopeUnderstandingLinesFromBrief(
  text: string | null | undefined,
): string[] {
  if (text === null || text === undefined) {
    return [];
  }

  const sectionIndex = text.indexOf(SCOPE_UNDERSTANDING_SECTION_HEADER);

  if (sectionIndex < 0) {
    return [];
  }

  const lines: string[] = [];

  for (const line of text.slice(sectionIndex).split("\n")) {
    const trimmed = line.trim();

    if (!trimmed.startsWith("- ")) {
      continue;
    }

    const scopeLine = trimmed.slice(2).trim();

    if (scopeLine.length > 0) {
      lines.push(scopeLine);
    }
  }

  return lines;
}

/** Stable comparison key so reloads and re-derivation can detect real scope changes only. */
export function scopeUnderstandingFingerprint(lines: readonly string[]): string {
  return lines
    .map((line) => line.trim().toLowerCase())
    .filter((line) => line.length > 0)
    .sort((left, right) => (left < right ? -1 : left > right ? 1 : 0))
    .join("\n");
}

export function scopeBulletsFingerprint(bullets: readonly ScopeUnderstandingBullet[]): string {
  return scopeUnderstandingFingerprint(scopeBriefLines(bullets));
}

export function persistedScopeMatchesBullets(
  persistedText: string | null | undefined,
  bullets: readonly ScopeUnderstandingBullet[],
): boolean {
  const persistedLines = extractScopeUnderstandingLinesFromBrief(persistedText);

  if (persistedLines.length === 0) {
    return false;
  }

  return scopeUnderstandingFingerprint(persistedLines) === scopeBulletsFingerprint(bullets);
}

export function mergeScopeBulletsIntoBrief(
  bullets: readonly ScopeUnderstandingBullet[],
  baseBrief: string,
): string {
  const trimmedBrief = baseBrief.trim();
  const bulletLines = scopeBriefLines(bullets).map((line) => `- ${line}`);

  if (bulletLines.length === 0) {
    return trimmedBrief;
  }

  const section = `${SCOPE_UNDERSTANDING_SECTION_HEADER}:\n${bulletLines.join("\n")}`;

  if (trimmedBrief.length === 0) {
    return section;
  }

  if (trimmedBrief.includes(SCOPE_UNDERSTANDING_SECTION_HEADER)) {
    return trimmedBrief;
  }

  return `${trimmedBrief}\n\n${section}`;
}

/**
 * Trims and drops empty rows. Applied at confirm time only — trimming on every keystroke would stop
 * the operator typing a space between words.
 */
export function normalizeScopeUnderstandingBullets(
  bullets: readonly ScopeUnderstandingBullet[],
): ScopeUnderstandingBullet[] {
  return bullets
    .map((bullet) => ({
      ...bullet,
      value: bullet.value.trim(),
    }))
    .filter((bullet) => bullet.value.length > 0);
}
