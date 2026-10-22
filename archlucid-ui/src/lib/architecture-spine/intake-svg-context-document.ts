import { STRUCTURED_DIAGRAM_SVG_CONTEXT_CONTENT_TYPE } from "@/lib/architecture-spine/supported-context-document-content-types";

const SVG_INTAKE_FILE_EXTENSIONS = [".svg"] as const;

export { STRUCTURED_DIAGRAM_SVG_CONTEXT_CONTENT_TYPE };

/** True when the attachment is an SVG diagram source the intake wizard should keep (never image/svg+xml on authority). */
export function isSvgIntakeFileName(fileName: string): boolean {
  const lower = fileName.trim().toLowerCase();

  return SVG_INTAKE_FILE_EXTENSIONS.some((extension) => lower.endsWith(extension));
}

/** Minimal client-side guard: SVG must look like markup before posting for server sanitize+parse. */
export function looksLikeSvgDiagramSource(text: string): boolean {
  const trimmed = text.trimStart();

  return trimmed.startsWith("<svg") || trimmed.includes("<svg");
}
