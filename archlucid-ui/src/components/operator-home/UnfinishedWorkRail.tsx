"use client";

import Link from "next/link";
import { useEffect, useMemo, useSyncExternalStore } from "react";

import { ReviewListDisplayTitle } from "@/components/operator-home/ReviewListDisplayTitle";

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
import {
  matchesOperatorHomeHeroResumeTarget,
  resolveOperatorHomeHeroResumeTarget,
  resolveRunIdFromHomeReviewHref,
} from "@/lib/operator/operator-home-hero-resume-target";
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
  if (item.statusKind !== undefined) {
    return { kind: item.statusKind, label: item.statusLabel };
  }

  switch (item.kind) {
    case "architecture-draft":
      return { kind: "draft", label: "Draft" };
    case "review-in-progress":
      return { kind: "in-progress", label: item.statusLabel };
    case "awaiting-disposition":
      return { kind: "needs-attention", label: item.statusLabel };
    case "incomplete-wizard":
      return { kind: "in-progress", label: item.statusLabel };
    default: {
      const _exhaustive: never = item.kind;

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

function resolveRailItemResumeTarget(item: UnfinishedWorkRailItem): {
  readonly href: string;
  readonly draftId?: string;
  readonly runId?: string;
} {
  if (item.kind === "architecture-draft") {
    const draftId = item.id.replace(/^architecture-draft:/, "").trim();

    return {
      href: item.href,
      draftId: draftId.length > 0 ? draftId : undefined,
    };
  }

  const runId = resolveRunIdFromHomeReviewHref(item.href);

  return {
    href: item.href,
    runId: runId ?? undefined,
  };
}

function UnfinishedWorkRailTableRow(props: {
  readonly item: UnfinishedWorkRailItem;
  readonly suppressContinueAction: boolean;
}): React.JSX.Element {
  const { item } = props;
  const continueLabel = resolveContinueCtaLabel(item);
  const statusTag = resolveRailItemStatusTag(item);

  return (
    <EnterpriseTableRow data-testid={`unfinished-work-rail-item-${item.kind}`}>
      <EnterpriseTableCell className="min-w-[12rem] max-w-md">
        <ReviewListDisplayTitle
          href={item.href}
          title={item.title}
          testId={`unfinished-work-rail-link-${item.id}`}
        />
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
        {props.suppressContinueAction ? (
          <span className={cn("text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)} aria-hidden="true">
            —
          </span>
        ) : (
          <Button asChild variant="outline" size="sm">
            <Link href={item.href} data-testid={`unfinished-work-rail-continue-${item.id}`}>
              {continueLabel}
            </Link>
          </Button>
        )}
      </EnterpriseTableCell>
    </EnterpriseTableRow>
  );
}

function UnfinishedWorkRailList(props: {
  readonly items: readonly UnfinishedWorkRailItem[];
  readonly heroResumeTarget: ReturnType<typeof resolveOperatorHomeHeroResumeTarget>;
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
            <UnfinishedWorkRailTableRow
              key={item.id}
              item={item}
              suppressContinueAction={matchesOperatorHomeHeroResumeTarget(
                props.heroResumeTarget,
                resolveRailItemResumeTarget(item),
              )}
            />
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

  const heroResumeTarget = useMemo(
    () => resolveOperatorHomeHeroResumeTarget({ drafts, preferArchitectureIdentity: true }),
    [drafts],
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
      <UnfinishedWorkRailList items={items} heroResumeTarget={heroResumeTarget} />
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
