import { SECURITY_EVIDENCE_PATH_HOP_EVIDENCE_NOT_STORED } from "@/lib/security-evidence-path-types";

export const SECURENOW_PATH_INSPECT_HOP_EVIDENCE_REF_COPY_LABEL = "Copy hop evidence reference" as const;

export function secureNowPathInspectHopEvidenceReferenceLabel(reference: string): string {
  const trimmed = reference.trim();

  if (trimmed.length === 0) {
    return SECURITY_EVIDENCE_PATH_HOP_EVIDENCE_NOT_STORED;
  }

  return trimmed;
}

export function secureNowPathInspectHopEvidenceReferenceCopyValue(reference: string): string | null {
  const trimmed = reference.trim();

  if (trimmed.length === 0) {
    return null;
  }

  return trimmed;
}