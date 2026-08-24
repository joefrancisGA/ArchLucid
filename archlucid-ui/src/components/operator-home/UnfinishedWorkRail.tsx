"use client";

import Link from "next/link";
import { useEffect, useMemo, useSyncExternalStore } from "react";

import { useOperatorHomeWorkspaceActivity } from "@/components/operator-home/operator-home-workspace-activity-context";
import { StatusTag } from "@/components/ui/status-tag";
import { useArchitectureDraftRegistryEntries } from "@/hooks/use-architecture-draft-registry-entries";
import { countUnlinkedArchitectureDraftRegistryEntries } from "@/lib/architecture/architecture-draft-registry";
import {
  OPERATOR_TYPOGRAPHY,
  type EnterpriseStatusKind,
} from "@/lib/design-tokens";
import { OPERATOR_HOME_YOUR_WORK_HEADING } from "@/lib/buyer/buyer-polish-copy";
import {
  buildUnfinishedWorkRailItems,
  listIncompleteWizardSignals,
  UNFINISHED_WORK_RAIL_TITLE,
  type UnfinishedWorkRailItem,
  type UnfinishedWorkRailItemKind,
} from "@/lib/unfinished-work-rail";
import { resolveOperatorHomeWorkspacePhase } from "@/lib/resolve-operator-home-workspace-phase";
import { listHomeAttentionPreviewExcludedRunIds } from "@/lib/operator/home-attention-dedup";
import { cn } from "@/lib/utils";
import type { RunSummary } from "@/types/authority";

export type UnfinishedWorkRailProps = {
  /** Server-rendered reviews for first paint; a refreshed client snapshot supersedes it when present. */
  readonly runs: readonly RunSummary[];
};

function subscribeWizardSessions(onStoreChange: () => void): () => void {
  if (typeof window === "undefined") {
    return () => {};
  }

  const onStorage = (event: StorageEvent): void => {
    if (event.storageArea === window.sessionStorage) {
      onStoreChange();
    }
  };

  window.addEventListener("storage", onStorage);

  return () => {
    window.removeEventListener("storage", onStorage);
  };
}

function getIncompleteWizardSnapshot(): ReturnType<typeof listIncompleteWizardSignals> {
  return listIncompleteWizardSignals();
}

function getIncompleteWizardServerSnapshot(): ReturnType<typeof listIncompleteWizardSignals> {
  return listIncompleteWizardSignals();
}

function statusTagKindForRailItem(kind: UnfinishedWorkRailItemKind): EnterpriseStatusKind {
  switch (kind) {
    case "architecture-draft":
      return "draft";
    case "review-in-progress":
      return "in-progress";
    case "awaiting-disposition":
      return "needs-attention";
    case "incomplete-wizard":
      return "in-progress";
    default: {
      const _exhaustive: never = kind;

      return _exhaustive;
    }
  }
}

function UnfinishedWorkRailRow(props: { readonly item: UnfinishedWorkRailItem }): React.JSX.Element {
  const { item } = props;

  return (
    <li
      className="border-b border-neutral-200 py-2 last:border-b-0 dark:border-neutral-800"
      data-testid={`unfinished-work-rail-item-${item.kind}`}
    >
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="grid min-w-0 flex-1 gap-x-4 gap-y-1 sm:grid-cols-[minmax(0,1.6fr)_minmax(0,0.9fr)_minmax(0,0.8fr)] sm:items-center">
          <Link
            href={item.href}
            className={cn("min-w-0 break-words font-medium text-al-text-primary no-underline hover:underline", OPERATOR_TYPOGRAPHY.body)}
            data-testid={`unfinished-work-rail-link-${item.id}`}
          >
            {item.title}
          </Link>
          <span className={cn("min-w-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
            {item.workTypeLabel}
          </span>
          <span className={cn("min-w-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
            {item.activityLabel ?? "—"}
          </span>
        </div>
        <div className="flex shrink-0 items-center gap-2 sm:justify-end">
          <StatusTag kind={statusTagKindForRailItem(item.kind)} label={item.statusLabel} />
          <Link
            href={item.href}
            className={cn("font-medium", OPERATOR_TYPOGRAPHY.helper, "text-al-link no-underline hover:underline")}
            data-testid={`unfinished-work-rail-action-${item.id}`}
          >
            {item.actionLabel} →
          </Link>
        </div>
      </div>
    </li>
  );
}

function UnfinishedWorkRailList(props: { readonly items: readonly UnfinishedWorkRailItem[] }): React.JSX.Element {
  return (
    <ul className="m-0 mt-2 list-none space-y-0 p-0" data-testid="unfinished-work-rail-list">
      {props.items.map((item) => (
        <UnfinishedWorkRailRow key={item.id} item={item} />
      ))}
    </ul>
  );
}

/**
 * Cross-session continue rail for operator home — hidden when empty (TB-2209).
 */
export function UnfinishedWorkRail(props: UnfinishedWorkRailProps): React.JSX.Element | null {
  const drafts = useArchitectureDraftRegistryEntries();
  const { hasWorkspaceReviews, hasOverviewReviewRows, liveRunsSnapshot, reportHomeAttentionPreviewExcludedRunIds } =
    useOperatorHomeWorkspaceActivity();
  const incompleteWizards = useSyncExternalStore(
    subscribeWizardSessions,
    getIncompleteWizardSnapshot,
    getIncompleteWizardServerSnapshot,
  );
  const runs = liveRunsSnapshot?.items ?? props.runs;
  const activeDraftCount = countUnlinkedArchitectureDraftRegistryEntries(drafts);
  const workspacePhase = resolveOperatorHomeWorkspacePhase({
    hasWorkspaceReviews,
    hasOverviewReviewRows,
    draftCount: activeDraftCount,
    hasCommittedManifest: false,
    openFindingsCount: 0,
    governanceWarningsCount: 0,
  });
  const excludeKinds: readonly UnfinishedWorkRailItemKind[] =
    workspacePhase === "eval-with-drafts" ? ["architecture-draft"] : [];

  const items = useMemo(
    () =>
      buildUnfinishedWorkRailItems({
        drafts,
        runs,
        incompleteWizards,
      }).filter((item) => !excludeKinds.includes(item.kind)),
    [drafts, excludeKinds, incompleteWizards, runs],
  );

  const homeAttentionPreviewExcludedRunIds = useMemo(
    () => listHomeAttentionPreviewExcludedRunIds(items),
    [items],
  );

  useEffect(() => {
    reportHomeAttentionPreviewExcludedRunIds(homeAttentionPreviewExcludedRunIds);
  }, [homeAttentionPreviewExcludedRunIds, reportHomeAttentionPreviewExcludedRunIds]);

  if (items.length === 0) {
    return null;
  }

  return (
    <section
      className="space-y-2"
      data-testid="unfinished-work-rail"
      data-attention-partition="unfinished-work"
      aria-label={UNFINISHED_WORK_RAIL_TITLE}
    >
      <h2 className={cn("m-0 text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}>
        {OPERATOR_HOME_YOUR_WORK_HEADING}
      </h2>
      <UnfinishedWorkRailList items={items} />
    </section>
  );
}
