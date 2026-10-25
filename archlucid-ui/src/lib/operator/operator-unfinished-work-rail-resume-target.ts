import { resolveRunIdFromUnfinishedWorkRailItem } from "@/lib/operator/home-attention-dedup";
import { collectResumeRunIdsForMatch } from "@/lib/operator/operator-home-hero-resume-target";
import type { UnfinishedWorkRailItem } from "@/lib/unfinished-work-rail";

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

  const runIds = collectResumeRunIdsForMatch(
    item.href,
    resolveRunIdFromUnfinishedWorkRailItem(item),
  );

  return {
    href: item.href,
    runId: runIds[0] ?? undefined,
  };
}
