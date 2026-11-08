import type { TrustEvidenceFieldSnapshot } from "@/types/authority";

export type ResolvedTrustEvidenceFieldSnapshot = {
  readonly title: string;
  readonly status: string | null;
  readonly detail?: string | null;
};

export const TRUST_EVIDENCE_FIELD_STATUS_NOT_STORED = "Status was not stored." as const;

export function coerceTrustEvidenceFieldStatus(status: string | null | undefined): string {
  if (status === null || status === undefined) {
    return TRUST_EVIDENCE_FIELD_STATUS_NOT_STORED;
  }

  const trimmed = status.trim();

  return trimmed.length > 0 ? trimmed : "Status was stored empty.";
}

/** OpenAPI optional fields may be absent on partial cards — keep UI/export paths fail-closed. */
export function trustEvidenceFieldOrUnavailable(
  snapshot: TrustEvidenceFieldSnapshot | undefined,
  fallbackTitle: string,
): ResolvedTrustEvidenceFieldSnapshot {
  if (snapshot === undefined) {
    return {
      title: fallbackTitle,
      status: "Unavailable",
      detail: "Evidence field was not stored for this review.",
    };
  }

  return {
    title: snapshot.title ?? fallbackTitle,
    status: snapshot.status ?? null,
    detail: snapshot.detail ?? null,
  };
}
