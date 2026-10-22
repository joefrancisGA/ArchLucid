import type { DecisionDelta } from "@/types/comparison";

/**
 * Heuristic: timestamps, identifiers, and hashes are bookkeeping — not architecturally material —
 * when browsing manifest comparison. Security/requirement/finding deltas are modeled in other tables.
 */
export function isMetadataOnlyDecisionDelta(d: DecisionDelta): boolean {
  const key = d.decisionKey.trim().toLowerCase();

  if (key.length === 0) {
    return false;
  }

  if (/(^|[._-])id$/.test(key) || /(^|[._-])ids$/.test(key)) {
    return true;
  }

  if (/(timestamp|timeutc|datetime|createdutc|updatedutc|hash|manifesthash|correlation|trace)/.test(key)) {
    return true;
  }

  const ct = d.changeType.trim().toLowerCase();

  if (ct.includes("timestamp") || ct.includes("metadata only") || ct.includes("bookkeeping")) {
    return true;
  }

  return false;
}

export function partitionDecisionDeltas(deltas: DecisionDelta[]): {
  readonly material: DecisionDelta[];
  readonly metadata: DecisionDelta[];
} {
  const material: DecisionDelta[] = [];
  const metadata: DecisionDelta[] = [];

  for (const d of deltas) {
    if (isMetadataOnlyDecisionDelta(d)) {
      metadata.push(d);
    } else {
      material.push(d);
    }
  }

  return { material, metadata };
}
