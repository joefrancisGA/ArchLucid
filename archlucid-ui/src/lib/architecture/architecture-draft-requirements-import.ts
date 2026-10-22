/** Client-side helpers for importing requirements documents into the architecture overview field. */

export const ARCHITECTURE_DRAFT_REQUIREMENTS_UPLOAD_ACCEPT =
  ".pdf,.docx,.md,.txt,.json,.yaml,.yml" as const;

export function architectureDraftRequirementsFileKey(file: File): string {
  return `${file.name}:${file.size}:${file.lastModified}`;
}

export function appendArchitectureDraftRequirementsImport(
  currentOverview: string,
  fileName: string,
  extractedText: string,
): string {
  const trimmedExtract = extractedText.trim();

  if (trimmedExtract.length === 0) {
    return currentOverview;
  }

  const base = currentOverview.trimEnd();
  const section = `---\nFrom ${fileName}:\n\n${trimmedExtract}`;

  if (base.length === 0) {
    return trimmedExtract;
  }

  return `${base}\n\n${section}`;
}

export function newlyAddedArchitectureDraftRequirementFiles(
  previousKeys: ReadonlySet<string>,
  files: readonly File[],
): File[] {
  return files.filter((file) => !previousKeys.has(architectureDraftRequirementsFileKey(file)));
}
