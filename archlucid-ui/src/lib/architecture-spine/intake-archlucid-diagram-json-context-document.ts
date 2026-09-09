/**
 * AS-012 — native ArchLucid diagram JSON intake for buildIntakeContextDocumentsFromEvidenceFiles.
 * Posts product ArchitectureDiagramModelRecord JSON as application/vnd.archlucid.diagram+json.
 *
 * @see docs/library/ARCHITECTURE_REVIEW_DIAGRAM_INPUT_CONTRACT.md
 */

import { STRUCTURED_DIAGRAM_CONTEXT_CONTENT_TYPE } from "@/lib/architecture-spine/supported-context-document-content-types";

const ARCHLUCID_DIAGRAM_JSON_INTAKE_FILE_EXTENSIONS = [".diagram.json"] as const;

export { STRUCTURED_DIAGRAM_CONTEXT_CONTENT_TYPE };

type ArchLucidDiagramJsonShape = {
  readonly nodes?: readonly unknown[];
  readonly edges?: readonly unknown[];
  readonly intakeStub?: { readonly kind?: string };
};

/** True when the attachment name is native ArchLucid diagram JSON the intake wizard should keep. */
export function isArchLucidDiagramJsonIntakeFileName(fileName: string): boolean {
  const lower = fileName.trim().toLowerCase();

  return ARCHLUCID_DIAGRAM_JSON_INTAKE_FILE_EXTENSIONS.some((extension) => lower.endsWith(extension));
}

/** True when UTF-8 bytes look like native ArchitectureDiagramModelRecord JSON (not pixel stubs). */
export function looksLikeArchLucidDiagramJson(text: string): boolean {
  const trimmed = text.trim();

  if (trimmed.length === 0) {
    return false;
  }

  try {
    const parsed = JSON.parse(trimmed) as ArchLucidDiagramJsonShape;

    if (!Array.isArray(parsed.nodes) || !Array.isArray(parsed.edges)) {
      return false;
    }

    if (parsed.intakeStub?.kind === "pixel-diagram-not-verifiable") {
      return false;
    }

    return parsed.nodes.some(
      (node) =>
        typeof node === "object"
        && node !== null
        && typeof (node as { readonly id?: unknown }).id === "string"
        && typeof (node as { readonly label?: unknown }).label === "string",
    );
  }
  catch {
    return false;
  }
}
