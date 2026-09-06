"use client";

import Link from "next/link";
import { useEffect, useMemo, useSyncExternalStore } from "react";

import { useOperatorHomeWorkspaceActivity } from "@/components/operator-home/operator-home-workspace-activity-context";
import { Button } from "@/components/ui/button";
import {
  EnterpriseTable,
  EnterpriseTableBody,
  EnterpriseTableCell,
  EnterpriseTableHead,
  EnterpriseTableHeadRow,
  EnterpriseTableHeaderCell,
  EnterpriseTableRow,
} from "@/components/ui/enterprise-table";
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

function resolveRailItemStatusTag(item: UnfinishedWorkRailItem): {
  readonly kind: EnterpriseStatusKind;
  readonly label?: string;
} {
  switch (item.kind) {
    case "architecture-draft":
      return { kind: "draft", label: "Draft" };
    case "review-in-progress":
      return { kind: "in-progress" };
    case "awaiting-disposition":
      return { kind: "needs-attention" };
    case "incomplete-wizard":
      return { kind: "in-progress" };
    default: {
      const _exhaustive: never = item.kind;

      return _exhaustive;
    }
  }
}

function resolveRailItemStatusTagDisplay(item: UnfinishedWorkRailItem): {
  readonly kind: EnterpriseStatusKind;
  readonly label?: string;
} {
  const resolved = resolveRailItemStatusTag(item);
  const statusLabel = item.statusLabel?.trim() ?? "";

  if (item.kind === "architecture-draft") {
    return { kind: resolved.kind, label: "Draft" };
  }

  if (statusLabel.length > 0) {
    return { kind: resolved.kind, label: statusLabel };
  }

  return resolved;
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

function UnfinishedWorkRailTableRow(props: {
  readonly item: UnfinishedWorkRailItem;
}): React.JSX.Element {
  const { item } = props;
  const continueLabel = resolveContinueCtaLabel(item);
  const statusTag = resolveRailItemStatusTagDisplay(item);

  return (
    <EnterpriseTableRow data-testid={`unfinished-work-rail-item-${item.kind}`}>
      <EnterpriseTableCell className="min-w-[12rem] max-w-md">
        <Link
          href={item.href}
          className={cn("min-w-0 break-words font-medium", OPERATOR_LINK.nav, OPERATOR_TYPOGRAPHY.body)}
          data-testid={`unfinished-work-rail-link-${item.id}`}
        >
          {item.title}
        </Link>
      </EnterpriseTableCell>
      <EnterpriseTableCell className={cn("text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
        {item.workTypeLabel}
      </EnterpriseTableCell>
      <EnterpriseTableCell className={cn("text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
        {item.activityLabel ?? "—"}
      </EnterpriseTableCell>
      <EnterpriseTableCell>
        <StatusTag kind={statusTag.kind} label={statusTag.label} />
      </EnterpriseTableCell>
      <EnterpriseTableCell className="text-right">
        <Button asChild variant="outline" size="sm" className="h-7">
          <Link href={item.href} data-testid={`unfinished-work-rail-continue-${item.id}`}>
            {continueLabel}
          </Link>
        </Button>
      </EnterpriseTableCell>
    </EnterpriseTableRow>
  );
}

function UnfinishedWorkRailList(props: {
  readonly items: readonly UnfinishedWorkRailItem[];
}): React.JSX.Element {
  if (props.items.length === 0) {
    return <div data-testid="unfinished-work-rail-list" />;
  }

  return (
    <div className="mt-2" data-testid="unfinished-work-rail-list">
      <EnterpriseTable ariaLabel="Unfinished work" data-testid="unfinished-work-rail-table">
        <colgroup>
          <col className="w-[38%]" />
          <col className="w-[14%]" />
          <col className="w-[18%]" />
          <col className="w-[14%]" />
          <col className="w-[16%]" />
        </colgroup>
        <EnterpriseTableHead>
          <EnterpriseTableHeadRow data-testid="unfinished-work-rail-column-headers">
            <EnterpriseTableHeaderCell>{OPERATOR_HOME_YOUR_WORK_COLUMN_NAME}</EnterpriseTableHeaderCell>
            <EnterpriseTableHeaderCell>{OPERATOR_HOME_YOUR_WORK_COLUMN_TYPE}</EnterpriseTableHeaderCell>
            <EnterpriseTableHeaderCell>{OPERATOR_HOME_YOUR_WORK_COLUMN_UPDATED}</EnterpriseTableHeaderCell>
            <EnterpriseTableHeaderCell>{OPERATOR_HOME_YOUR_WORK_COLUMN_STATUS}</EnterpriseTableHeaderCell>
            <EnterpriseTableHeaderCell className="text-right">Action</EnterpriseTableHeaderCell>
          </EnterpriseTableHeadRow>
        </EnterpriseTableHead>
        <EnterpriseTableBody>
          {props.items.map((item) => (
            <UnfinishedWorkRailTableRow key={item.id} item={item} />
          ))}
        </EnterpriseTableBody>
      </EnterpriseTable>
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
      aria-labelledby="operator-home-your-work-heading"
    >
      <h2 id="operator-home-your-work-heading" className={OPERATOR_HOME_SECTION_HEADING}>
        {OPERATOR_HOME_YOUR_WORK_HEADING}
      </h2>
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
