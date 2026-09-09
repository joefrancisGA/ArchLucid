/** Client-side mirror of server preview safety rules (ESI-04). */

export type StoredEvidencePreviewKind = "image" | "text" | "pdf" | "download-only";

const UNSAFE_INLINE_CONTENT_TYPES = new Set(["text/html", "application/xhtml+xml", "image/svg+xml"]);

const UNSAFE_EXTENSIONS = new Set([".html", ".htm", ".svg", ".xhtml"]);

const IMAGE_CONTENT_TYPES = new Set(["image/png", "image/jpeg", "image/jpg", "image/gif", "image/webp"]);

const TEXT_CONTENT_TYPES = new Set([
  "text/plain",
  "text/markdown",
  "text/vnd.mermaid",
  "application/json",
  "application/yaml",
  "text/yaml",
]);

const TEXT_EXTENSIONS = new Set([".txt", ".md", ".mmd", ".mermaid", ".json", ".yaml", ".yml"]);

const IMAGE_EXTENSIONS = new Set([".png", ".jpg", ".jpeg", ".gif", ".webp"]);

export const StoredEvidenceFileContentSafety = {
  mustForceAttachmentDisposition(contentType: string, fileName: string): boolean {
    const normalizedType = contentType.trim().toLowerCase();
    const extension = extractExtension(fileName);

    if (UNSAFE_INLINE_CONTENT_TYPES.has(normalizedType)) {
      return true;
    }

    return UNSAFE_EXTENSIONS.has(extension);
  },

  resolvePreviewKind(contentType: string, fileName: string): StoredEvidencePreviewKind {
    if (StoredEvidenceFileContentSafety.mustForceAttachmentDisposition(contentType, fileName)) {
      return "download-only";
    }

    const normalizedType = contentType.trim().toLowerCase();
    const extension = extractExtension(fileName);

    if (IMAGE_CONTENT_TYPES.has(normalizedType) || IMAGE_EXTENSIONS.has(extension)) {
      return "image";
    }

    if (normalizedType === "application/pdf" || extension === ".pdf") {
      return "pdf";
    }

    if (TEXT_CONTENT_TYPES.has(normalizedType) || TEXT_EXTENSIONS.has(extension)) {
      return "text";
    }

    return "download-only";
  },
};

function extractExtension(fileName: string): string {
  const trimmed = fileName.trim().toLowerCase();
  const dotIndex = trimmed.lastIndexOf(".");

  if (dotIndex < 0) {
    return "";
  }

  return trimmed.slice(dotIndex);
}
