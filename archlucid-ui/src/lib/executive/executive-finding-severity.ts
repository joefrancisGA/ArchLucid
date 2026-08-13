/**
 * Normalized severity label for findings tables (governance queue, executive shell).
 * Stays aligned with legacy GovernanceFindingsQueueClient behavior.
 */
export function severityFromTrace(label: string | null | undefined): string {
  const t = (label ?? "").trim();

  if (t.length === 0) {
    return "—";
  }

  if (/high|critical|severe/i.test(t)) {
    return "High";
  }

  if (/low|minimal/i.test(t)) {
    return "Low";
  }

  if (/medium|moderate/i.test(t)) {
    return "Medium";
  }

  return t.length > 32 ? `${t.slice(0, 29)}…` : t;
}

/**
 * Sort order: Critical → High → Medium → Low → Info → unknown → empty.
 * Uses raw trace label so "critical" sorts before generic "high" even when display collapses both to "High".
 */
export function severitySortRank(label: string | null | undefined): number {
  const t = (label ?? "").trim().toLowerCase();

  if (t.length === 0) {
    return 100;
  }

  if (/critical/.test(t)) {
    return 0;
  }

  if (/severe|high/.test(t)) {
    return 1;
  }

  if (/medium|moderate/.test(t)) {
    return 2;
  }

  if (/low|minimal/.test(t)) {
    return 3;
  }

  if (/info/.test(t)) {
    return 4;
  }

  return 50;
}
