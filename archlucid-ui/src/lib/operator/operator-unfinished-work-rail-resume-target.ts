import { resolveRunIdFromUnfinishedWorkRailItem } from "@/lib/operator/home-attention-dedup";
import { collectResumeRunIdsForMatch } from "@/lib/operator/operator-home-hero-resume-target";
import { resolveRunIdFromWorkingReviewHref } from "@/lib/system-not-job-portfolio-resume-href";
import type { UnfinishedWorkRailItem } from "@/lib/unfinished-work-rail";

function resolvePrimaryResumeRunIdForRailItem(item: UnfinishedWorkRailItem): string | undefined {
  const railRunId = resolveRunIdFromUnfinishedWorkRailItem(item)?.trim() ?? "";
  const hrefRunId = resolveRunIdFromWorkingReviewHref(item.href)?.trim() ?? "";

  if (railRunId.length > 0 && hrefRunId.length > 0 && railRunId !== hrefRunId) {
    return hrefRunId;
  }

  const runIds = collectResumeRunIdsForMatch(item.href, railRunId.length > 0 ? railRunId : null);

  return runIds[0] ?? undefined;
}

export type OperatorUnfinishedWorkRailResumeTarget = {
  readonly href: string;
  readonly draftId?: string;
  readonly runId?: string;
};

/** Resume identity for unfinished-work rail rows (P1-11 / TB-2369). */
export function resolveOperatorUnfinishedWorkRailItemResumeTarget(
  item: UnfinishedWorkRailItem,
): OperatorUnfinishedWorkRailResumeTarget {
  if (item.kind === "architecture-draft") {
    const draftId = item.id.replace(/^architecture-draft:/, "").trim();

    return {
      href: item.href,
      draftId: draftId.length > 0 ? draftId : undefined,
    };
  }

  return {
    href: item.href,
    runId: resolvePrimaryResumeRunIdForRailItem(item),
  };
}
