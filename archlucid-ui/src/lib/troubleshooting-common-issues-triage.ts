import type {
  TroubleshootingIssue,
  TroubleshootingIssueKind,
} from "@/lib/troubleshooting-help-guide-content";

export const TROUBLESHOOTING_ISSUE_KIND_ORDER: readonly TroubleshootingIssueKind[] = [
  "user-fixable",
  "workspace-admin",
  "archlucid-support",
  "internal-operator",
] as const;

export type TroubleshootingIssueKindGroup = {
  readonly kind: TroubleshootingIssueKind;
  readonly issues: readonly TroubleshootingIssue[];
};

function normalizeTroubleshootingSearchText(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[-_/]+/g, " ")
    .replace(/\s+/g, " ");
}

/** Case-insensitive filter across title and triage fields (hyphens treated as spaces). */
export function filterTroubleshootingIssues(
  issues: readonly TroubleshootingIssue[],
  query: string,
): readonly TroubleshootingIssue[] {
  const normalized = normalizeTroubleshootingSearchText(query);

  if (normalized.length === 0) {
    return issues;
  }

  return issues.filter((issue) => {
    const haystack = normalizeTroubleshootingSearchText(
      [
        issue.title,
        issue.whatYouSee,
        issue.likelyCause,
        issue.tryFirst,
        issue.ifStillBlocked,
      ].join(" "),
    );

    return haystack.includes(normalized);
  });
}

/** Groups filtered issues in stable kind order; omits empty groups. */
export function groupTroubleshootingIssuesByKind(
  issues: readonly TroubleshootingIssue[],
): readonly TroubleshootingIssueKindGroup[] {
  const groups: TroubleshootingIssueKindGroup[] = [];

  for (const kind of TROUBLESHOOTING_ISSUE_KIND_ORDER) {
    const kindIssues = issues.filter((issue) => issue.kind === kind);

    if (kindIssues.length === 0) {
      continue;
    }

    groups.push({ kind, issues: kindIssues });
  }

  return groups;
}
