/**
 * AS-003 — canonical context document content types for ArchitectureRequest.documents[].
 * Keep aligned with ArchLucid.ContextIngestion.SupportedContextDocumentContentTypes.All.
 *
 * @see docs/library/ARCHITECTURE_REVIEW_DIAGRAM_INPUT_CONTRACT.md
 */

export const STRUCTURED_DIAGRAM_CONTEXT_CONTENT_TYPE =
  "application/vnd.archlucid.diagram+json";

export const MERMAID_CONTEXT_DOCUMENT_CONTENT_TYPE = "text/vnd.mermaid";

export const SUPPORTED_CONTEXT_DOCUMENT_CONTENT_TYPES = [
  "text/plain",
  "text/markdown",
  STRUCTURED_DIAGRAM_CONTEXT_CONTENT_TYPE,
  MERMAID_CONTEXT_DOCUMENT_CONTENT_TYPE,
] as const;

export type SupportedContextDocumentContentType =
  (typeof SUPPORTED_CONTEXT_DOCUMENT_CONTENT_TYPES)[number];

/** Raster MIME types must never be posted as context document contentType values. */
export const FORBIDDEN_CONTEXT_DOCUMENT_IMAGE_CONTENT_TYPE_PREFIX = "image/";

export function isForbiddenContextDocumentImageContentType(contentType: string): boolean {
  return contentType.trim().toLowerCase().startsWith(FORBIDDEN_CONTEXT_DOCUMENT_IMAGE_CONTENT_TYPE_PREFIX);
}

export function isSupportedContextDocumentContentType(
  contentType: string,
): contentType is SupportedContextDocumentContentType {
  const normalized = contentType.trim().toLowerCase();

  return SUPPORTED_CONTEXT_DOCUMENT_CONTENT_TYPES.some(
    (supported) => supported.toLowerCase() === normalized,
  );
}
