/**
 * AS-004 — pixel diagram intake stubs for buildIntakeContextDocumentsFromEvidenceFiles.
 * Sends structured diagram JSON with ExtractionMethod=None — never raster bytes as text/plain.
 *
 * @see docs/library/ARCHITECTURE_REVIEW_DIAGRAM_INPUT_CONTRACT.md
 */

import type { CreateArchitectureRunDocumentPayload } from "@/lib/api/architecture-runs-mutate";
import { STRUCTURED_DIAGRAM_CONTEXT_CONTENT_TYPE } from "@/lib/architecture-spine/supported-context-document-content-types";

export const INTAKE_PIXEL_DIAGRAM_EXTRACTION_METHOD_NONE = "None";

export const INTAKE_PIXEL_DIAGRAM_VERIFICATION_STATUS_NOT_VERIFIABLE = "NotVerifiable";

export const INTAKE_PENDING_STORED_FILE_MARKER_PREFIX = "pending-stored-file:";

export type IntakePixelDiagramContextStub = {
  readonly nodes: readonly [];
  readonly edges: readonly [];
  readonly trustBoundaryLabels: readonly [];
  readonly intakeStub: {
    readonly kind: "pixel-diagram-not-verifiable";
    readonly sourceMimeType: string;
    readonly extractionMethod: typeof INTAKE_PIXEL_DIAGRAM_EXTRACTION_METHOD_NONE;
    readonly verificationStatus: typeof INTAKE_PIXEL_DIAGRAM_VERIFICATION_STATUS_NOT_VERIFIABLE;
    readonly evidenceItemId: string | null;
    readonly pendingStoredFileMarker: string | null;
  };
};

const PIXEL_DIAGRAM_EXTENSIONS = [".png", ".jpg", ".jpeg"] as const;

export function isPixelDiagramIntakeFileName(fileName: string): boolean {
  const lower = fileName.trim().toLowerCase();

  return PIXEL_DIAGRAM_EXTENSIONS.some((extension) => lower.endsWith(extension));
}

export function buildIntakePendingStoredFileMarker(fileName: string): string {
  return `${INTAKE_PENDING_STORED_FILE_MARKER_PREFIX}${fileName.trim()}`;
}

export function resolvePixelDiagramSourceMimeType(file: File): string {
  const trimmedType = file.type.trim().toLowerCase();

  if (trimmedType.startsWith("image/")) {
    return trimmedType;
  }

  const lowerName = file.name.trim().toLowerCase();

  if (lowerName.endsWith(".png")) {
    return "image/png";
  }

  if (lowerName.endsWith(".jpg") || lowerName.endsWith(".jpeg")) {
    return "image/jpeg";
  }

  return "image/unknown";
}

export function buildIntakePixelDiagramContextStub(input: {
  readonly sourceMimeType: string;
  readonly evidenceItemId?: string | null;
  readonly pendingStoredFileMarker?: string | null;
}): IntakePixelDiagramContextStub {
  const evidenceItemId = input.evidenceItemId?.trim() ?? "";
  const pendingStoredFileMarker = input.pendingStoredFileMarker?.trim() ?? "";

  return {
    nodes: [],
    edges: [],
    trustBoundaryLabels: [],
    intakeStub: {
      kind: "pixel-diagram-not-verifiable",
      sourceMimeType: input.sourceMimeType,
      extractionMethod: INTAKE_PIXEL_DIAGRAM_EXTRACTION_METHOD_NONE,
      verificationStatus: INTAKE_PIXEL_DIAGRAM_VERIFICATION_STATUS_NOT_VERIFIABLE,
      evidenceItemId: evidenceItemId.length > 0 ? evidenceItemId : null,
      pendingStoredFileMarker: pendingStoredFileMarker.length > 0 ? pendingStoredFileMarker : null,
    },
  };
}

export function buildIntakePixelDiagramContextDocument(
  name: string,
  file: File,
  options?: {
    readonly evidenceItemId?: string | null;
  },
): CreateArchitectureRunDocumentPayload {
  const evidenceItemId = options?.evidenceItemId ?? null;
  const stub = buildIntakePixelDiagramContextStub({
    sourceMimeType: resolvePixelDiagramSourceMimeType(file),
    evidenceItemId,
    pendingStoredFileMarker:
      evidenceItemId === null || (evidenceItemId?.trim().length ?? 0) === 0
        ? buildIntakePendingStoredFileMarker(name)
        : null,
  });

  return {
    name,
    contentType: STRUCTURED_DIAGRAM_CONTEXT_CONTENT_TYPE,
    content: JSON.stringify(stub),
  };
}

export function parseIntakePixelDiagramContextStub(content: string): IntakePixelDiagramContextStub | null {
  try {
    const parsed = JSON.parse(content) as IntakePixelDiagramContextStub;

    if (parsed?.intakeStub?.kind !== "pixel-diagram-not-verifiable") {
      return null;
    }

    return parsed;
  }
  catch {
    return null;
  }
}
