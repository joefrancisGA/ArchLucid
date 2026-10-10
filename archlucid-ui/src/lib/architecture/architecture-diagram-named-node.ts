const UNTITLED_ARCHITECTURE_NAME = "untitled architecture";

/**
 * The diagram model adds the architecture name as a system node only when that label is not already
 * present. Readiness must use the same rule or a repeated name is counted as a second node.
 */
export function architectureNameAddsDiagramNode(
  architectureName: string,
  existingLabels: readonly string[],
): boolean {
  const trimmed = architectureName.trim();

  if (trimmed.length === 0 || trimmed.toLowerCase() === UNTITLED_ARCHITECTURE_NAME) {
    return false;
  }

  const normalized = trimmed.toLowerCase();

  return !existingLabels.some((label) => label.trim().toLowerCase() === normalized);
}
