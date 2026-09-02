"use client";

import Link from "next/link";
import { useEffect, useMemo, useSyncExternalStore } from "react";

import { useOperatorHomeWorkspaceActivity } from "@/components/operator-home/operator-home-workspace-activity-context";
import { StatusTag } from "@/components/ui/status-tag";
import { useArchitectureDraftRegistryEntries } from "@/hooks/use-architecture-draft-registry-entries";
import { countUnlinkedArchitectureDraftRegistryEntries } from "@/lib/architecture/architecture-draft-registry";
import { REVIEWS_LIST_PATH } from "@/lib/architecture/architecture-routes";
import {
  OPERATOR_TYPOGRAPHY,
  OPERATOR_LINK,
  type EnterpriseStatusKind,
} from "@/lib/design-tokens";
import {
  OPERATOR_HOME_YOUR_WORK_COLUMN_NAME,
  OPERATOR_HOME_YOUR_WORK_COLUMN_STATUS,
  OPERATOR_HOME_YOUR_WORK_COLUMN_TYPE,
  OPERATOR_HOME_YOUR_WORK_COLUMN_UPDATED,
  OPERATOR_HOME_YOUR_WORK_HEADING,
} from "@/lib/buyer/buyer-polish-copy";
import {
  listIncompleteWizardSignals,
  summarizeUnfinishedWorkRailItems,
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

const UNFINISHED_WORK_RAIL_GRID_COLS =
  "sm:grid-cols-[minmax(0,1.6fr)_minmax(0,0.9fr)_minmax(0,0.8fr)_auto]" as const;

const UNFINISHED_WORK_RAIL_VIEW_ALL_LABEL = "View all unfinished work";

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

function UnfinishedWorkRailColumnHeaders(): React.JSX.Element {
  return (
    <li
      className={cn(
        "hidden gap-x-4 border-b border-neutral-200 pb-1.5 dark:border-neutral-800",
        "sm:col-span-full sm:grid sm:grid-cols-subgrid sm:items-end",
      )}
      data-testid="unfinished-work-rail-column-headers"
    >
      <span className={cn("min-w-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
        {OPERATOR_HOME_YOUR_WORK_COLUMN_NAME}
      </span>
      <span className={cn("min-w-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
        {OPERATOR_HOME_YOUR_WORK_COLUMN_TYPE}
      </span>
      <span className={cn("min-w-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
        {OPERATOR_HOME_YOUR_WORK_COLUMN_UPDATED}
      </span>
      <span className={cn("min-w-0 text-right text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
        {OPERATOR_HOME_YOUR_WORK_COLUMN_STATUS}
      </span>
    </li>
  );
}

function UnfinishedWorkRailRow(props: {
  readonly item: UnfinishedWorkRailItem;
  readonly emphasized?: boolean;
}): React.JSX.Element {
  const { item } = props;

  return (
    <li
      className={cn(
        "border-b border-neutral-200 py-2 last:border-b-0 dark:border-neutral-800",
        "sm:col-span-full sm:grid sm:grid-cols-subgrid sm:items-center",
        props.emphasized === true
          ? "rounded-lg border border-neutral-200 bg-al-surface-raised px-3 dark:border-neutral-800"
          : undefined,
      )}
      data-testid={`unfinished-work-rail-item-${item.kind}`}
    >
      <Link
        href={item.href}
        className="contents no-underline"
        data-testid={`unfinished-work-rail-link-${item.id}`}
      >
        <span className={cn("min-w-0 break-words font-medium text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}>
          {item.title}
        </span>
        <span className={cn("min-w-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
          {item.workTypeLabel}
        </span>
        <span className={cn("min-w-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
          {item.activityLabel ?? "—"}
        </span>
        <div className="flex shrink-0 items-center gap-2 sm:justify-end">
          <StatusTag kind={statusTagKindForRailItem(item.kind)} label={item.statusLabel} />
          <span className={cn("font-medium text-al-link", OPERATOR_TYPOGRAPHY.helper)}>
            {item.actionLabel} →
          </span>
        </div>
      </Link>
    </li>
  );
}

function UnfinishedWorkRailList(props: {
  readonly items: readonly UnfinishedWorkRailItem[];
}): React.JSX.Element {
  return (
    <ul
      className={cn(
        "m-0 mt-2 list-none space-y-2 p-0 sm:grid sm:gap-x-4",
        UNFINISHED_WORK_RAIL_GRID_COLS,
      )}
      data-testid="unfinished-work-rail-list"
    >
      <UnfinishedWorkRailColumnHeaders />
      {props.items.map((item, index) => (
        <UnfinishedWorkRailRow key={item.id} item={item} emphasized={index === 0} />
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

  const railSummary = useMemo(
    () =>
      summarizeUnfinishedWorkRailItems({
        drafts,
        runs,
        incompleteWizards,
      }),
    [drafts, incompleteWizards, runs],
  );

  const items = useMemo(
    () => railSummary.items.filter((item) => !excludeKinds.includes(item.kind)),
    [excludeKinds, railSummary.items],
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
      {railSummary.truncated ? (
        <p className="m-0">
          <Link
            href={REVIEWS_LIST_PATH}
            className={cn("font-medium", OPERATOR_LINK.nav)}
            data-testid="unfinished-work-rail-view-all"
          >
            {UNFINISHED_WORK_RAIL_VIEW_ALL_LABEL} ({railSummary.totalCount})
          </Link>
        </p>
      ) : null}
    </section>
  );
}
