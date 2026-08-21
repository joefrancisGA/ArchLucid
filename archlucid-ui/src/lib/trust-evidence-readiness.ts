import type { TrustEvidenceFieldSnapshot } from "@/types/authority";

/**
 * Evidence-basis readiness verdict.
 *
 * The Evidence tab previously rendered every field as a coequal tile, so six `Available` tags trained
 * the reader to skip the region and buried the fields that actually block sponsor handoff. This module
 * derives one verdict plus the exception list so the card can lead with a conclusion.
 */

const READY_STATUS = "available";
const NOT_APPLICABLE_STATUS = "not applicable";

export type TrustEvidenceReadinessVerdict = "complete" | "gaps";

export type TrustEvidenceReadinessField = {
  readonly key: string;
  readonly title: string;
  readonly status: string;
  readonly detail: string | null;
};

export type TrustEvidenceReadiness = {
  readonly verdict: TrustEvidenceReadinessVerdict;
  readonly headline: string;
  readonly readyCount: number;
  readonly totalCount: number;
  /** Fields that are neither available nor explicitly out of scope — shown above the fold. */
  readonly exceptions: readonly TrustEvidenceReadinessField[];
  /** Fields that need no attention — safe to collapse behind a disclosure. */
  readonly satisfied: readonly TrustEvidenceReadinessField[];
};

function normalizeStatus(status: string): string {
  return status.trim().toLowerCase();
}

/** True when the field's evidence is present. */
export function isTrustEvidenceFieldReady(status: string): boolean {
  return normalizeStatus(status) === READY_STATUS;
}

/** True when the field is explicitly out of scope, so its absence is not a gap. */
export function isTrustEvidenceFieldOutOfScope(status: string): boolean {
  return normalizeStatus(status) === NOT_APPLICABLE_STATUS;
}

/** True when the field needs operator attention before sponsor handoff. */
export function isTrustEvidenceFieldException(status: string): boolean {
  return !isTrustEvidenceFieldReady(status) && !isTrustEvidenceFieldOutOfScope(status);
}

function readinessHeadline(exceptionCount: number): string {
  if (exceptionCount === 0) {
    return "Evidence is ready to share with leadership.";
  }

  const noun = exceptionCount === 1 ? "field needs" : "fields need";

  return `${exceptionCount} evidence ${noun} attention before sharing with leadership.`;
}

/** Partitions Evidence-basis fields into a verdict, the exceptions, and the satisfied remainder. */
export function deriveTrustEvidenceReadiness(
  fields: readonly TrustEvidenceReadinessField[],
): TrustEvidenceReadiness {
  const exceptions = fields.filter((field) => isTrustEvidenceFieldException(field.status));
  const satisfied = fields.filter((field) => !isTrustEvidenceFieldException(field.status));

  return {
    verdict: exceptions.length === 0 ? "complete" : "gaps",
    headline: readinessHeadline(exceptions.length),
    readyCount: fields.filter((field) => isTrustEvidenceFieldReady(field.status)).length,
    totalCount: fields.length,
    exceptions,
    satisfied,
  };
}

/** Convenience adapter for the authority card's field snapshots. */
export function trustEvidenceReadinessField(
  key: string,
  title: string,
  snapshot: TrustEvidenceFieldSnapshot,
): TrustEvidenceReadinessField {
  return { key, title, status: snapshot.status, detail: snapshot.detail ?? null };
}
