import { DRAW_IO_CONTEXT_DOCUMENT_CONTENT_TYPE } from "@/lib/architecture-spine/supported-context-document-content-types";

const DRAW_IO_INTAKE_FILE_EXTENSIONS = [".drawio", ".drawio.xml"] as const;

export { DRAW_IO_CONTEXT_DOCUMENT_CONTENT_TYPE };

/** True when the attachment is a draw.io XML source the intake wizard should keep. */
export function isDrawIoIntakeFileName(fileName: string): boolean {
  const lower = fileName.trim().toLowerCase();

  return DRAW_IO_INTAKE_FILE_EXTENSIONS.some((extension) => lower.endsWith(extension));
}

/** Minimal client-side guard before posting draw.io XML for server parse. */
export function looksLikeDrawIoXmlSource(text: string): boolean {
  const trimmed = text.trimStart();

  return trimmed.includes("<mxfile") || trimmed.includes("<mxGraphModel");
}
