import type { GovernanceFindingQueueRow } from "@/app/(operator)/governance/findings/governance-finding-queue-row";
import { asReadonlyArray } from "@/lib/continue-last-list-guard";
import { getFindingDetailHref } from "@/lib/findings/finding-evidence-navigation";
import { OPERATOR_RECENT_VIEWS_STORAGE_KEY, parseStoredRecentViews } from "@/lib/operator/operator-recent-views";

const REVIEW_FINDING_HREF_PATTERN = /^\/architecture\/reviews\/([^/]+)\/findings\/([^/]+)/i;

export type GovernanceFindingsContinueLastTarget = {
  readonly findingId: string;
  readonly title: string;
  readonly href: string;
};

function findingKeyFromRecentHref(href: string): { readonly runId: string; readonly findingId: string } | null {
  const path = href.split("?")[0] ?? "";
  const match = REVIEW_FINDING_HREF_PATTERN.exec(path);

  if (match === null) {
    return null;
  }

  const runId = decodeURIComponent(match[1] ?? "").trim();
  const findingId = decodeURIComponent(match[2] ?? "").trim();

  if (runId.length === 0 || findingId.length === 0) {
    return null;
  }

  return { runId, findingId };
}

function readRecentFindingKey(): { readonly runId: string; readonly findingId: string } | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(OPERATOR_RECENT_VIEWS_STORAGE_KEY);
    const state = parseStoredRecentViews(raw);

    for (const entry of state.entries) {
      const key = findingKeyFromRecentHref(entry.href);

      if (key !== null) {
        return key;
      }
    }
  } catch {
    return null;
  }

  return null;
}

function toTarget(
  row: GovernanceFindingQueueRow,
  findingsQueueRunId?: string | null,
): GovernanceFindingsContinueLastTarget {
  return {
    findingId: row.findingId,
    title: row.title,
    href: getFindingDetailHref(row.runId, row.findingId, findingsQueueRunId),
  };
}

/** Resolves the finding to pin as Continue last viewed on the findings queue. */
export function resolveContinueLastGovernanceFinding(
  rows: unknown,
  findingsQueueRunId?: string | null,
): GovernanceFindingsContinueLastTarget | null {
  const normalizedRows = asReadonlyArray<GovernanceFindingQueueRow>(rows);

  if (normalizedRows === null) {
    return null;
  }

  const findingRows = normalizedRows.filter((row) => row.recordKind === "finding");

  if (findingRows.length === 0) {
    return null;
  }

  const recentKey = readRecentFindingKey();

  if (recentKey !== null) {
    const recentMatch = findingRows.find(
      (row) => row.findingId === recentKey.findingId && row.runId === recentKey.runId,
    );

    if (recentMatch !== undefined) {
      return toTarget(recentMatch, findingsQueueRunId);
    }

    const findingIdMatch = findingRows.find((row) => row.findingId === recentKey.findingId);

    if (findingIdMatch !== undefined) {
      return toTarget(findingIdMatch, findingsQueueRunId);
    }
  }

  const oldestOpen = findingRows
    .slice()
    .sort((left, right) => (right.agingDays ?? -1) - (left.agingDays ?? -1))[0];

  return oldestOpen === undefined ? null : toTarget(oldestOpen, findingsQueueRunId);
}
