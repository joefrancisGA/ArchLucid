export type SubmittedArchitectureTextPresentation = {
  readonly previewSource: string;
  readonly emptyPanelCopy: string;
  readonly wasNotStored: boolean;
  readonly wasStoredEmpty: boolean;
};

export function resolveSubmittedArchitectureTextPresentation(
  architectureText: string | null | undefined,
): SubmittedArchitectureTextPresentation {
  const wasNotStored = architectureText === null || architectureText === undefined;
  const trimmed = architectureText?.trim() ?? "";
  const wasStoredEmpty = !wasNotStored && trimmed.length === 0;

  const emptyPanelCopy = wasNotStored
    ? "Submitted architecture text was not stored."
    : wasStoredEmpty
      ? "Submitted architecture text was stored empty."
      : "Submitted architecture text was not stored.";

  return {
    previewSource: trimmed,
    emptyPanelCopy,
    wasNotStored,
    wasStoredEmpty,
  };
}
