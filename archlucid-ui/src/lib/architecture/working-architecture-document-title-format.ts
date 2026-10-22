/** SY-61 / SY-85 — shared browser tab title formatting (client + server safe). */
export const WORKING_NESTED_REVIEW_DOCUMENT_TITLE_SUFFIX = " · Review" as const;

/** SY-61 / SY-85 — browser tab titles on Working nested routes use the architecture display name. */
export function formatWorkingArchitectureDocumentTitle(
  displayName: string,
  suffix?: string,
): string {
  if (suffix === undefined || suffix.length === 0) {
    return displayName;
  }

  return `${displayName}${suffix}`;
}
