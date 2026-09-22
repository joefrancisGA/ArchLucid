/** True when Mermaid has no drawable nodes (header-only flowchart or zero node metrics). */
export function isInfraEvidenceMermaidDiagramEmpty(
  mermaid: string,
  nodeCount?: number | null,
): boolean {
  if (nodeCount === 0) {
    return true;
  }

  const trimmed = mermaid.trim();

  if (trimmed.length === 0) {
    return true;
  }

  const lines = trimmed
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  if (lines.length === 1 && /^flowchart\s+(TD|LR|TB|BT|RL)\b/i.test(lines[0])) {
    return true;
  }

  return false;
}
