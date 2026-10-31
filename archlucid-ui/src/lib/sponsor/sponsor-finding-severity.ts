/**
 * Normalized severity label for findings tables (governance queue, sponsor shell).
 * Stays aligned with legacy GovernanceFindingsQueueClient behavior.
 */
/** Sponsor top-risk line: quote the trace label; do not map it onto severity bands. */
export function formatSponsorTraceConfidenceDisplay(label: string | null | undefined): string {
  const t = (label ?? "").trim();

  if (t.length === 0) {
    return "Trace label was not stored.";
  }

  return `Trace label: ${t}.`;
}

export function severityFromTrace(label: string | null | undefined): string {
  const t = (label ?? "").trim();

  if (t.length === 0) {
    return "Severity was not stored.";
  }

  if (/\bcritical\b/i.test(t)) {
    return "Critical";
  }

  if (/\bsevere\b/i.test(t)) {
    return "Severe";
  }

  if (/\bhigh\b/i.test(t)) {
    return "High";
  }

  if (/\b(medium|moderate)\b/i.test(t)) {
    return "Medium";
  }

  if (/\b(low|minimal)\b/i.test(t)) {
    return "Low";
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

  if (/\bcritical\b/.test(t)) {
    return 0;
  }

  if (/\b(severe|high)\b/.test(t)) {
    return 1;
  }

  if (/\b(medium|moderate)\b/.test(t)) {
    return 2;
  }

  if (/\b(low|minimal)\b/.test(t)) {
    return 3;
  }

  if (/\binfo\b/.test(t)) {
    return 4;
  }

  return 50;
}
