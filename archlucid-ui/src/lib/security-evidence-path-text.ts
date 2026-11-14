/** Keeps explanation and action blocks free of blank paragraph gaps. */
export function securityEvidencePathNonBlankLines(lines: ReadonlyArray<string>): string[] {
  return lines.filter((line) => line.trim().length > 0);
}
