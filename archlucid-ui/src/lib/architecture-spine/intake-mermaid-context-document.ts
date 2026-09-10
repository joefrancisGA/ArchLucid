import { isMermaidDiagramSource } from "@/lib/help/help-mermaid";
import { MERMAID_CONTEXT_DOCUMENT_CONTENT_TYPE } from "@/lib/architecture-spine/supported-context-document-content-types";

const MERMAID_INTAKE_FILE_EXTENSIONS = [".mmd", ".mermaid"] as const;

export { MERMAID_CONTEXT_DOCUMENT_CONTENT_TYPE };

/** True when the attachment name is a Mermaid source file the intake wizard should keep. */
export function isMermaidIntakeFileName(fileName: string): boolean {
  const lower = fileName.trim().toLowerCase();

  return MERMAID_INTAKE_FILE_EXTENSIONS.some((extension) => lower.endsWith(extension));
}

/** True when plain-text bytes look like Mermaid diagram source (no client-side parse). */
export function looksLikeMermaidSource(text: string): boolean {
  return isMermaidDiagramSource(text);
}
