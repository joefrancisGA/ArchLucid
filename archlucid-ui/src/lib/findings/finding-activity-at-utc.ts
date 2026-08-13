import type { FindingWireSnapshot } from "@/lib/quick-decision-summary-derive";

const ACTIVITY_UTC_FIELD_NAMES = [
  "occurredAtUtc",
  "lastReviewedUtc",
  "updatedAtUtc",
  "recordedAtUtc",
] as const;

function readActivityField(record: Record<string, unknown>, fieldName: string): string | null {
  const raw = record[fieldName];

  if (typeof raw !== "string") {
    return null;
  }

  const trimmed = raw.trim();

  return trimmed.length > 0 ? trimmed : null;
}

/** Best-effort disposition / review timestamp from a persisted finding wire payload. */
export function resolveFindingActivityAtUtc(snapshot: FindingWireSnapshot): string | null {
  try {
    const parsed = JSON.parse(snapshot.wireJson) as Record<string, unknown>;

    for (const fieldName of ACTIVITY_UTC_FIELD_NAMES) {
      const value = readActivityField(parsed, fieldName);

      if (value !== null) {
        return value;
      }
    }
  } catch {
    return null;
  }

  return null;
}

export function resolveGovernanceQueueRowActivityAtUtc(
  lastReviewedUtc: string | null | undefined,
  revisitDueUtc: string | null | undefined,
): string | null {
  return resolveLatestActivityAtUtc([lastReviewedUtc, revisitDueUtc]);
}

export function resolveLatestActivityAtUtc(candidates: readonly (string | null | undefined)[]): string | null {
  let latestMs: number | null = null;
  let latestIso: string | null = null;

  for (const candidate of candidates) {
    if (candidate === null || candidate === undefined) {
      continue;
    }

    const trimmed = candidate.trim();

    if (trimmed.length === 0) {
      continue;
    }

    const parsed = Date.parse(trimmed);

    if (Number.isNaN(parsed)) {
      continue;
    }

    if (latestMs === null || parsed > latestMs) {
      latestMs = parsed;
      latestIso = trimmed;
    }
  }

  return latestIso;
}
