"use client";

import Link from "next/link";
import { useEffect, useMemo, useSyncExternalStore } from "react";

import { useOperatorHomeWorkspaceActivity } from "@/components/operator-home/operator-home-workspace-activity-context";
import { Button } from "@/components/ui/button";
import { StatusTag } from "@/components/ui/status-tag";
import { useArchitectureDraftRegistryEntries } from "@/hooks/use-architecture-draft-registry-entries";
import { countUnlinkedArchitectureDraftRegistryEntries } from "@/lib/architecture/architecture-draft-registry";
import { REVIEWS_HUB_UNFINISHED_WORK_HREF } from "@/lib/reviews-hub-unfinished-work-href";
import {
  OPERATOR_HOME_SECTION_HEADING,
  OPERATOR_LINK,
  OPERATOR_TYPOGRAPHY,
  type EnterpriseStatusKind,
} from "@/lib/design-tokens";
import {
  OPERATOR_HOME_YOUR_WORK_COLUMN_NAME,
  OPERATOR_HOME_YOUR_WORK_COLUMN_STATUS,
  OPERATOR_HOME_YOUR_WORK_COLUMN_TYPE,
  OPERATOR_HOME_YOUR_WORK_COLUMN_UPDATED,
  OPERATOR_HOME_YOUR_WORK_CONTINUE_REVIEW_CTA,
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

function resolveContinueCtaLabel(item: UnfinishedWorkRailItem): string {
  switch (item.kind) {
    case "review-in-progress":
    case "awaiting-disposition":
      return OPERATOR_HOME_YOUR_WORK_CONTINUE_REVIEW_CTA;
    default:
      return item.actionLabel;
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

function UnfinishedWorkRailPrimaryCard(props: { readonly item: UnfinishedWorkRailItem }): React.JSX.Element {
  const { item } = props;
  const continueLabel = resolveContinueCtaLabel(item);

  return (
    <article
      className={cn(
        "rounded-lg border border-neutral-200 bg-al-surface-raised p-4 dark:border-neutral-800",
        "space-y-3",
      )}
      data-testid={`unfinished-work-rail-item-${item.kind}`}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href={item.href}
              className={cn("min-w-0 break-words font-semibold text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}
              data-testid={`unfinished-work-rail-link-${item.id}`}
            >
              {item.title}
            </Link>
            <StatusTag kind={statusTagKindForRailItem(item.kind)} label={item.statusLabel} />
          </div>
          <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
            {item.workTypeLabel}
            {item.activityLabel !== null ? ` · ${item.activityLabel}` : ""}
          </p>
        </div>
        <Button asChild variant="primary" size="sm" className="h-8 shrink-0 self-start sm:self-center">
          <Link href={item.href} data-testid={`unfinished-work-rail-continue-${item.id}`}>
            {continueLabel}
          </Link>
        </Button>
      </div>
    </article>
  );
}

function UnfinishedWorkRailRow(props: { readonly item: UnfinishedWorkRailItem }): React.JSX.Element {
  const { item } = props;
  const continueLabel = resolveContinueCtaLabel(item);

  return (
    <li
      className={cn(
        "border-b border-neutral-200 py-2 last:border-b-0 dark:border-neutral-800",
        "sm:col-span-full sm:grid sm:grid-cols-subgrid sm:items-center",
      )}
      data-testid={`unfinished-work-rail-item-${item.kind}`}
    >
      <Link
        href={item.href}
        className={cn("min-w-0 break-words font-medium text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}
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
      <div className="flex shrink-0 items-center gap-2 sm:justify-end">
        <StatusTag kind={statusTagKindForRailItem(item.kind)} label={item.statusLabel} />
        <Button asChild variant="outline" size="sm" className="h-7">
          <Link href={item.href} data-testid={`unfinished-work-rail-continue-${item.id}`}>
            {continueLabel}
          </Link>
        </Button>
      </div>
    </li>
  );
}

function UnfinishedWorkRailList(props: {
  readonly items: readonly UnfinishedWorkRailItem[];
}): React.JSX.Element {
  const [primaryItem, ...secondaryItems] = props.items;

  if (primaryItem === undefined) {
    return <ul className="m-0 list-none p-0" data-testid="unfinished-work-rail-list" />;
  }

  return (
    <div className="mt-2 space-y-3" data-testid="unfinished-work-rail-list">
      <UnfinishedWorkRailPrimaryCard item={primaryItem} />
      {secondaryItems.length > 0 ? (
        <ul
          className={cn(
            "m-0 list-none space-y-2 p-0 sm:grid sm:gap-x-4",
            UNFINISHED_WORK_RAIL_GRID_COLS,
          )}
        >
          <UnfinishedWorkRailColumnHeaders />
          {secondaryItems.map((item) => (
            <UnfinishedWorkRailRow key={item.id} item={item} />
          ))}
        </ul>
      ) : null}
    </div>
  );
}

/**
 * Cross-session continue rail for operator home — hidden when empty (TB-2209).
 */
export function UnfinishedWorkRail(props: UnfinishedWorkRailProps): React.JSX.Element | null {
  const drafts = useArchitectureDraftRegistryEntries();
  const { hasWorkspaceReviews, hasOverviewReviewRows, liveRunsSnapshot, reportHomeAttentionPreviewExcludedRunIds, reportUnfinishedWorkRailCount } =
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

  useEffect(() => {
    reportUnfinishedWorkRailCount(items.length === 0 ? 0 : railSummary.totalCount);
  }, [items.length, railSummary.totalCount, reportUnfinishedWorkRailCount]);

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
      <h2 className={OPERATOR_HOME_SECTION_HEADING}>{OPERATOR_HOME_YOUR_WORK_HEADING}</h2>
      <UnfinishedWorkRailList items={items} />
      {railSummary.truncated ? (
        <p className="m-0">
          <Link
            href={REVIEWS_HUB_UNFINISHED_WORK_HREF}
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
