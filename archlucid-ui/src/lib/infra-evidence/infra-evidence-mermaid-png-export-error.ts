export const INFRA_EVIDENCE_MERMAID_PNG_TAINTED_CANVAS_MESSAGE =
  "Browser security blocked PNG rasterization because the diagram SVG references external images or fonts." as const;

/** Maps low-level canvas export failures to operator-friendly copy. */
export function formatInfraEvidenceMermaidPngExportError(error: unknown): string | null {
  if (!(error instanceof Error)) {
    return null;
  }

  const message = error.message.toLowerCase();

  if (message.includes("tainted") || message.includes("toblob")) {
    return INFRA_EVIDENCE_MERMAID_PNG_TAINTED_CANVAS_MESSAGE;
  }

  return null;
}
