import type { DiffItem, RunComparison } from "@/types/authority";

const ISSUES_SECTION = "Issues";
const WARNINGS_SECTION = "Warnings";

/** Severity-ish labels from manifest issue rows (case-insensitive sort/display). */
const SEVERITY_RANK: Record<string, number> = {
  critical: 0,
  error: 1,
  high: 2,
  warning: 3,
  medium: 4,
  low: 5,
  info: 6,
};

export type ChangesSinceLastReviewCopy = {
  /** Primary delta line (issues + optional warnings). */
  netChangeLine: string;
  /** Severity-oriented detail when issue adds/removes carry severities. */
  severityShiftLine: string | null;
};

function normalizeSeverityLabel(raw: string | null | undefined): string {
  const t = (raw ?? "").trim();

  if (t.length === 0) {
    return "Unknown";
  }

  const lower = t.toLowerCase();

  return lower.charAt(0).toUpperCase() + lower.slice(1);
}

function severitySortKey(label: string): number {
  const key = label.trim().toLowerCase();

  if (key in SEVERITY_RANK) {
    return SEVERITY_RANK[key] ?? 99;
  }

  return 50;
}

function formatCountedLabels(parts: { label: string; count: number }[], qualifier: string): string {
  const sorted = [...parts].sort((a, b) => {
    const ra = severitySortKey(a.label);
    const rb = severitySortKey(b.label);

    if (ra !== rb) {
      return ra - rb;
    }

    return a.label.localeCompare(b.label);
  });

  return sorted.map((p) => `${p.count} ${qualifier} ${p.label}`).join(", ");
}

function countBySeverity(rows: DiffItem[], kind: "Added" | "Removed"): Map<string, number> {
  const map = new Map<string, number>();

  for (const d of rows) {
    if (d.diffKind !== kind) {
      continue;
    }

    const raw = kind === "Added" ? d.afterValue : d.beforeValue;
    const label = normalizeSeverityLabel(raw);

    map.set(label, (map.get(label) ?? 0) + 1);
  }

  return map;
}

function mapToParts(map: Map<string, number>): { label: string; count: number }[] {
  return [...map.entries()].map(([label, count]) => ({ label, count }));
}

/** Builds operator-facing strings from legacy compare manifest diffs (Issues + Warnings). */
export function deriveChangesSinceLastReviewCopy(comparison: RunComparison): ChangesSinceLastReviewCopy | null {
  const diffs = comparison.manifestComparison?.diffs ?? [];

  if (diffs.length === 0) {
    return null;
  }

  const issueRows = diffs.filter((d) => d.section === ISSUES_SECTION);
  const warningRows = diffs.filter((d) => d.section === WARNINGS_SECTION);

  const issueAdded = issueRows.filter((d) => d.diffKind === "Added").length;
  const issueRemoved = issueRows.filter((d) => d.diffKind === "Removed").length;
  const warnAdded = warningRows.filter((d) => d.diffKind === "Added").length;
  const warnRemoved = warningRows.filter((d) => d.diffKind === "Removed").length;

  const netParts: string[] = [];

  if (issueAdded > 0) {
    netParts.push(`+${issueAdded} new finding${issueAdded === 1 ? "" : "s"}`);
  }

  if (issueRemoved > 0) {
    netParts.push(`-${issueRemoved} resolved`);
  }

  if (warnAdded > 0) {
    netParts.push(`+${warnAdded} new warning${warnAdded === 1 ? "" : "s"}`);
  }

  if (warnRemoved > 0) {
    netParts.push(`-${warnRemoved} warning${warnRemoved === 1 ? "" : "s"} cleared`);
  }

  if (netParts.length === 0) {
    return null;
  }

  const netChangeLine = netParts.join(", ");

  const addedMap = countBySeverity(issueRows, "Added");
  const removedMap = countBySeverity(issueRows, "Removed");
  const addedPhrase =
    addedMap.size > 0 ? formatCountedLabels(mapToParts(addedMap), "new") : "";
  const removedPhrase =
    removedMap.size > 0 ? formatCountedLabels(mapToParts(removedMap), "resolved") : "";

  let severityShiftLine: string | null = null;

  if (addedPhrase.length > 0 || removedPhrase.length > 0) {
    const bits = [addedPhrase, removedPhrase].filter((s) => s.length > 0);

    severityShiftLine = bits.join(" · ");
  }

  return { netChangeLine, severityShiftLine };
}
