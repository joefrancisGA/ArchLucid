"use client";

import Link from "next/link";
import { useMemo, useSyncExternalStore } from "react";

import { useOperatorHomeWorkspaceActivity } from "@/components/operator-home/operator-home-workspace-activity-context";
import { StatusTag } from "@/components/ui/status-tag";
import { useArchitectureDraftRegistryEntries } from "@/hooks/use-architecture-draft-registry-entries";
import {
  OPERATOR_NAV_GROUP_LABEL,
  OPERATOR_TYPOGRAPHY,
  type EnterpriseStatusKind,
} from "@/lib/design-tokens";
import {
  buildUnfinishedWorkRailItems,
  listIncompleteWizardSignals,
  UNFINISHED_WORK_RAIL_TITLE,
  type UnfinishedWorkRailItem,
  type UnfinishedWorkRailItemKind,
} from "@/lib/unfinished-work-rail";
import { resolveOperatorHomeWorkspacePhase } from "@/lib/resolve-operator-home-workspace-phase";
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

function UnfinishedWorkRailList(props: { readonly items: readonly UnfinishedWorkRailItem[] }): React.JSX.Element {
  return (
    <ul className="m-0 mt-2 list-none space-y-2 p-0" data-testid="unfinished-work-rail-list">
      {props.items.map((item) => (
        <li key={item.id} className="min-w-0" data-testid={`unfinished-work-rail-item-${item.kind}`}>
          <Link
            href={item.href}
            className={cn(
              "flex flex-wrap items-center gap-x-2 gap-y-1 rounded-sm border border-neutral-200 bg-al-surface-raised px-3 py-2 no-underline transition-colors hover:border-neutral-300 dark:border-neutral-800 dark:hover:border-neutral-700",
              OPERATOR_TYPOGRAPHY.body,
            )}
            data-testid={`unfinished-work-rail-link-${item.id}`}
          >
            <span className="min-w-0 flex-1 break-words font-medium text-al-text-primary">{item.title}</span>
            <StatusTag kind={statusTagKindForRailItem(item.kind)} label={item.statusLabel} />
          </Link>
        </li>
      ))}
    </ul>
  );
}

/**
 * Compact cross-session continue rail for operator home — hidden when empty (TB-2209).
 */
export function UnfinishedWorkRail(props: UnfinishedWorkRailProps): React.JSX.Element | null {
  const drafts = useArchitectureDraftRegistryEntries();
  const { hasWorkspaceReviews, hasOverviewReviewRows, liveRunsSnapshot } = useOperatorHomeWorkspaceActivity();
  const incompleteWizards = useSyncExternalStore(
    subscribeWizardSessions,
    getIncompleteWizardSnapshot,
    getIncompleteWizardServerSnapshot,
  );
  const runs = liveRunsSnapshot?.items ?? props.runs;
  const activeDraftCount = drafts.filter((entry) => entry.customerStatus !== "archived").length;
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

  if (items.length === 0) {
    return null;
  }

  return (
    <section
      className="rounded-md border border-neutral-200 bg-neutral-50/40 p-4 dark:border-neutral-800 dark:bg-neutral-900/20"
      data-testid="unfinished-work-rail"
      aria-label={UNFINISHED_WORK_RAIL_TITLE}
    >
      <h2 className={cn("m-0 text-al-text-secondary", OPERATOR_NAV_GROUP_LABEL)}>{UNFINISHED_WORK_RAIL_TITLE}</h2>
      <UnfinishedWorkRailList items={items} />
    </section>
  );
}
