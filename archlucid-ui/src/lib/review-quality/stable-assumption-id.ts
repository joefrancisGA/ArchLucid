/** Stable local id for an assumption label (TB-2314 — ack store keys). */
export function stableAssumptionIdFromText(text: string): string {
  const normalized = text.trim().toLowerCase();
  let hash = 2166136261;

  for (let index = 0; index < normalized.length; index += 1) {
    hash ^= normalized.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return `assumption-${(hash >>> 0).toString(36)}`;
}
