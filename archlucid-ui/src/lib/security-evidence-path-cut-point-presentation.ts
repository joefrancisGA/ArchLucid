import type { SecurityEvidencePathCutPoint } from "@/lib/security-evidence-path-types";

export const SECURITY_EVIDENCE_PATH_CUT_KIND_NOT_STORED = "Cut kind was not stored." as const;

export const SECURITY_EVIDENCE_PATH_CUT_ENDPOINT_PAIR_NOT_STORED =
  "Cut endpoints were not stored." as const;

export const SECURITY_EVIDENCE_PATH_CUT_SOURCE_ENDPOINT_NOT_STORED =
  "Source endpoint was not stored." as const;

export const SECURITY_EVIDENCE_PATH_CUT_DESTINATION_ENDPOINT_NOT_STORED =
  "Destination endpoint was not stored." as const;

/** Reader-facing `from → to` suffix for cut points and inspect lists. */
export function formatSecurityEvidencePathCutEndpointSuffix(
  fromNodeLabel: string | null | undefined,
  toNodeLabel: string | null | undefined,
): string {
  const fromLabel = fromNodeLabel?.trim() ?? "";
  const toLabel = toNodeLabel?.trim() ?? "";

  if (fromLabel.length === 0 && toLabel.length === 0) {
    return ` · ${SECURITY_EVIDENCE_PATH_CUT_ENDPOINT_PAIR_NOT_STORED}`;
  }

  if (fromLabel.length === 0) {
    return ` · ${SECURITY_EVIDENCE_PATH_CUT_SOURCE_ENDPOINT_NOT_STORED} → ${toLabel}`;
  }

  if (toLabel.length === 0) {
    return ` · ${fromLabel} → ${SECURITY_EVIDENCE_PATH_CUT_DESTINATION_ENDPOINT_NOT_STORED}`;
  }

  return ` · ${fromLabel} → ${toLabel}`;
}

export function formatCutPointHeadline(cutPoint: SecurityEvidencePathCutPoint): string {
  const cutKindLabel =
    cutPoint.cutKind.trim().length > 0 ? cutPoint.cutKind.trim() : SECURITY_EVIDENCE_PATH_CUT_KIND_NOT_STORED;
  const fromLabel = cutPoint.fromNodeLabel?.trim() ?? "";
  const toLabel = cutPoint.toNodeLabel?.trim() ?? "";

  if (fromLabel.length === 0 && toLabel.length === 0) {
    return `${cutKindLabel} · ${SECURITY_EVIDENCE_PATH_CUT_ENDPOINT_PAIR_NOT_STORED}`;
  }

  if (fromLabel.length === 0) {
    return `${cutKindLabel} · ${SECURITY_EVIDENCE_PATH_CUT_SOURCE_ENDPOINT_NOT_STORED} → ${toLabel}`;
  }

  if (toLabel.length === 0) {
    return `${cutKindLabel} · ${fromLabel} → ${SECURITY_EVIDENCE_PATH_CUT_DESTINATION_ENDPOINT_NOT_STORED}`;
  }

  return `${cutKindLabel} · ${fromLabel} → ${toLabel}`;
}