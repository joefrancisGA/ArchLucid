import type { TrustEvidenceFieldSnapshot } from "@/types/authority";

export type ResolvedTrustEvidenceFieldSnapshot = {
  readonly title: string;
  readonly status: string;
  readonly detail?: string | null;
};

/** OpenAPI optional fields may be absent on partial cards — keep UI/export paths fail-closed. */
export function trustEvidenceFieldOrUnavailable(
  snapshot: TrustEvidenceFieldSnapshot | undefined,
  fallbackTitle: string,
): ResolvedTrustEvidenceFieldSnapshot {
  if (snapshot === undefined) {
    return {
      title: fallbackTitle,
      status: "Unavailable",
      detail: "Evidence field was not returned for this review.",
    };
  }

  return {
    title: snapshot.title ?? fallbackTitle,
    status: snapshot.status ?? "Unavailable",
    detail: snapshot.detail ?? null,
  };
}
