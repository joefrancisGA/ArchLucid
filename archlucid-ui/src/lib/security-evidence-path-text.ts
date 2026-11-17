/** Keeps explanation and action blocks free of blank paragraph gaps. */
export function securityEvidencePathNonBlankLines(lines: ReadonlyArray<string>): string[] {
  return lines.filter((line) => line.trim().length > 0);
}

export function parseSecurityEvidencePathStoredUtc(value: string | null | undefined): Date | null {
  const trimmed = value?.trim() ?? "";

  if (trimmed.length === 0) {
    return null;
  }

  const parsed = Date.parse(trimmed);

  if (Number.isNaN(parsed)) {
    return null;
  }

  return new Date(parsed);
}
