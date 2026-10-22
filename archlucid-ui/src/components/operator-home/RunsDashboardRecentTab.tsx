import { useMemo } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

import { OperatorApiProblem } from "@/components/operator/OperatorApiProblem";
import { OperatorHomeRecentReviewsTable } from "@/components/operator-home/OperatorHomeRecentReviewsTable";
import { OperatorHomeReviewSummaryCard } from "@/components/operator-home/OperatorHomeReviewSummaryCard";
import { OperatorHomeRunsDashboardListSkeleton } from "@/components/operator-home/OperatorHomeRunsDashboardListSkeleton";
import { OperatorHomeWorkspaceArchivedEmptyState } from "@/components/operator-home/OperatorHomeWorkspaceArchivedEmptyState";
import { OperatorHomeWorkspaceEmptyState } from "@/components/operator-home/OperatorHomeWorkspaceEmptyState";
import {
  isRunNeedingAttention,
  runListPrimaryRequestId,
} from "@/components/operator-home/runs-dashboard-helpers";
import type { RunsDashboardLoadPhase } from "@/components/operator-home/runs-dashboard-load-phase";
import { Button } from "@/components/ui/button";
import { RUNS_DASHBOARD_LABELS } from "@/lib/i18n";
import {
  getCanonicalReviewWorkspaceHref,
  getShowcaseManifestHref,
  getShowcaseWalkthroughHref,
} from "@/lib/buyer/buyer-safe-review-navigation";
import { BUYER_VIEW_SIGNED_RECORD_CTA } from "@/lib/buyer/buyer-polish-copy";
import {
  OPERATOR_CARD,
  OPERATOR_LINK,
  OPERATOR_SURFACE_CARD_CLASS,
  OPERATOR_TYPOGRAPHY,
  OPERATOR_TYPE_SCALE,
} from "@/lib/design-tokens";
import { useArchitectureDraftRegistryEntries } from "@/hooks/use-architecture-draft-registry-entries";
import { resolveOperatorHomeHeroResumeTarget } from "@/lib/operator/operator-home-hero-resume-target";
import { OPERATOR_HOME_RECENT_FEATURED_LIMIT } from "@/lib/operator/operator-home-recent-reviews-outcome";
import {
  SHOWCASE_BUYER_REVIEW_TITLE,
  SHOWCASE_STATIC_DEMO_PRIMARY_FINDING_ID,
} from "@/lib/showcase-static-demo";
import type { ApiLoadFailureState } from "@/lib/api-load-failure";
import type { RunSummary } from "@/types/authority";

export type RunsDashboardRecentTabProps = {
  readonly phase: RunsDashboardLoadPhase;
  readonly showInitialLoadingSkeleton: boolean;
  readonly failure: ApiLoadFailureState | null;
  readonly runListError: boolean;
  readonly filteredItems: readonly RunSummary[];
  readonly effectiveItems: readonly RunSummary[];
  readonly buyerPolishedShell: boolean;
  readonly showcaseDemoRun: RunSummary | undefined;
  readonly showcasePrimaryCta: { href: string; label: string } | null;
  readonly buyerSafeHighlight: boolean;
  readonly showArchived: boolean;
  readonly archivedFieldSupported: boolean;
  readonly restoreBusyRequestId: string | null;
  readonly contentTestId?: string;
  readonly statusFilterEmptyMessage?: string | null;
  readonly governanceWarningsOnly?: boolean;
  readonly onClearGovernanceWarningsFilter?: () => void;
  readonly onRestoreArchivedRequest: (requestId: string) => void;
  /** When the Overview command center already renders the filled page primary (TB-2232). */
  readonly pagePrimaryOwnedElsewhere?: boolean;
};

export function RunsDashboardRecentTab(props: RunsDashboardRecentTabProps) {
  const drafts = useArchitectureDraftRegistryEntries();
  const heroResumeTarget = useMemo(
    () => resolveOperatorHomeHeroResumeTarget({ drafts, preferArchitectureIdentity: true }),
    [drafts],
  );
  const showcaseLeadButtonVariant = props.pagePrimaryOwnedElsewhere === true ? "outline" : "primary";
  const showArchivedEmptyState =
    props.showArchived &&
    props.archivedFieldSupported &&
    props.filteredItems.length === 0 &&
    !props.runListError &&
    (props.phase === "ready" || props.phase === "error");

  const showWorkspaceEmptyState =
    !props.showArchived &&
    props.filteredItems.length === 0 &&
    props.effectiveItems.length === 0 &&
    !props.runListError &&
    (props.phase === "ready" || props.phase === "error");

  const showStatusFilterEmptyState =
    !props.showArchived &&
    props.filteredItems.length === 0 &&
    props.effectiveItems.length > 0 &&
    props.statusFilterEmptyMessage !== undefined &&
    props.statusFilterEmptyMessage !== null &&
    props.statusFilterEmptyMessage.length > 0 &&
    !props.runListError &&
    (props.phase === "ready" || props.phase === "error");

  const showGovernanceWarningsEmptyState =
    !props.showArchived &&
    props.governanceWarningsOnly === true &&
    props.filteredItems.length === 0 &&
    props.effectiveItems.length > 0 &&
    !props.runListError &&
    (props.phase === "ready" || props.phase === "error");

  const panelTestId = props.contentTestId ?? "runs-dashboard-tab-all";

  const sortedItems = useMemo(() => {
    return [...props.filteredItems].sort((left, right) => {
      const leftNeedsAttention = isRunNeedingAttention(left) ? 0 : 1;
      const rightNeedsAttention = isRunNeedingAttention(right) ? 0 : 1;

      if (leftNeedsAttention !== rightNeedsAttention) {
        return leftNeedsAttention - rightNeedsAttention;
      }

      return 0;
    });
  }, [props.filteredItems]);

  const showBuyerProofSummary =
    (props.phase === "ready" || props.phase === "error") &&
    props.showcaseDemoRun !== undefined &&
    props.buyerPolishedShell;
  const showcaseRunId = props.showcaseDemoRun?.runId;

  // Overview shows a short featured set; Architecture packages owns the full inventory.
  // When the buyer proof card already names the showcase sample, omit that row from the list.
  const { featuredItems, hiddenFeaturedCount } = useMemo(() => {
    const listItems =
      showBuyerProofSummary && showcaseRunId !== undefined
        ? sortedItems.filter((run) => run.runId !== showcaseRunId)
        : sortedItems;
    const featured = listItems.slice(0, OPERATOR_HOME_RECENT_FEATURED_LIMIT);

    return {
      featuredItems: featured,
      hiddenFeaturedCount: Math.max(0, listItems.length - featured.length),
    };
  }, [showcaseRunId, showBuyerProofSummary, sortedItems]);

  return (
    <div data-testid={panelTestId}>
      {props.showInitialLoadingSkeleton ? <OperatorHomeRunsDashboardListSkeleton /> : null}

      {props.runListError && props.failure !== null ? (
        <div className={cn(OPERATOR_TYPOGRAPHY.helper, "[&_strong]:font-semibold")} data-testid="runs-dashboard-recent-error">
          <OperatorApiProblem
            problem={props.failure.problem}
            fallbackMessage={props.failure.message}
            correlationId={props.failure.correlationId}
          />
        </div>
      ) : null}

      {(props.phase === "ready" || props.phase === "error") && props.showcaseDemoRun !== undefined && !props.buyerPolishedShell ? (
        <div
          className={cn(OPERATOR_CARD.nested, OPERATOR_SURFACE_CARD_CLASS, "space-y-2")}
          data-testid="operator-home-showcase-demo-banner"
        >
          <p className={cn("m-0", OPERATOR_TYPE_SCALE.cardTitle, "text-neutral-900 dark:text-neutral-100")}>
            {SHOWCASE_BUYER_REVIEW_TITLE}
          </p>
          <p className={cn("m-0", OPERATOR_TYPE_SCALE.body, "text-neutral-600 dark:text-neutral-400")}>
            Completed sample review · Approved with monitoring
          </p>
          <p className={cn("m-0", OPERATOR_TYPE_SCALE.body, "text-neutral-600 dark:text-neutral-400")}>
            {props.buyerSafeHighlight ? (
              <>
                Start with the finalized review or the public walkthrough — technical workspace detail stays
                available for architects who want the authenticated console.
              </>
            ) : (
              <>
                Explore the completed sample review: review detail, finalized review, primary finding, or the
                read-only marketing showcase.
              </>
            )}
          </p>
          <div className="flex flex-wrap items-center gap-2">
            {props.buyerSafeHighlight && props.showcasePrimaryCta !== null ? (
              <>
                <Button asChild variant={showcaseLeadButtonVariant} size="sm" className="h-8">
                  <Link href={props.showcasePrimaryCta.href}>{props.showcasePrimaryCta.label}</Link>
                </Button>
                <Button asChild variant="outline" size="sm" className="h-8">
                  <Link href={getShowcaseWalkthroughHref()}>Showcase walkthrough</Link>
                </Button>
                <Button asChild variant="outline" size="sm" className="h-8">
                  <Link href={getCanonicalReviewWorkspaceHref(props.showcaseDemoRun.runId)}>Technical workspace</Link>
                </Button>
              </>
            ) : (
              <>
                <Button asChild variant={showcaseLeadButtonVariant} size="sm" className="h-8">
                  <Link href={`/architecture/reviews/${encodeURIComponent(props.showcaseDemoRun.runId)}`}>Review</Link>
                </Button>
                <Button asChild variant="outline" size="sm" className="h-8">
                  <Link href={getShowcaseManifestHref()}>{BUYER_VIEW_SIGNED_RECORD_CTA}</Link>
                </Button>
                <Button asChild variant="outline" size="sm" className="h-8">
                  <Link
                    href={`/architecture/reviews/${encodeURIComponent(props.showcaseDemoRun.runId)}/findings/${encodeURIComponent(SHOWCASE_STATIC_DEMO_PRIMARY_FINDING_ID)}`}
                  >
                    View primary finding
                  </Link>
                </Button>
                <Button asChild variant="outline" size="sm" className="h-8">
                  <Link href={getShowcaseWalkthroughHref()}>View showcase</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      ) : null}

      {showArchivedEmptyState ? <OperatorHomeWorkspaceArchivedEmptyState /> : null}

      {showWorkspaceEmptyState ? <OperatorHomeWorkspaceEmptyState /> : null}

      {showStatusFilterEmptyState ? (
        <p className={cn("m-0 leading-relaxed text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
          {props.statusFilterEmptyMessage}
        </p>
      ) : null}

      {showGovernanceWarningsEmptyState ? (
        <div
          className="flex flex-wrap items-center gap-2"
          data-testid="runs-dashboard-governance-warnings-empty"
          role="status"
        >
          <p className={cn("m-0 leading-relaxed text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
            No reviews with {RUNS_DASHBOARD_LABELS.governanceWarningsOnly.toLowerCase()}
          </p>
          {props.onClearGovernanceWarningsFilter !== undefined ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-auto px-2 py-1 text-al-text-primary"
              onClick={props.onClearGovernanceWarningsFilter}
              data-testid="runs-dashboard-governance-warnings-empty-clear"
            >
              Clear
            </Button>
          ) : null}
        </div>
      ) : null}

      {showBuyerProofSummary && props.showcaseDemoRun !== undefined ? (
        <section aria-label="Featured review summary">
          <OperatorHomeReviewSummaryCard
            run={props.showcaseDemoRun}
            href={`/architecture/reviews/${encodeURIComponent(props.showcaseDemoRun.runId)}`}
            buyerPolishedShell={props.buyerPolishedShell}
            variant="featured"
            primaryAction={props.showcasePrimaryCta}
            pagePrimaryOwnedElsewhere={props.pagePrimaryOwnedElsewhere}
          />
        </section>
      ) : null}

      {(props.phase === "ready" || props.phase === "error") && featuredItems.length > 0 ? (
        <>
          {props.pagePrimaryOwnedElsewhere === true ? (
            <OperatorHomeRecentReviewsTable
              runs={featuredItems}
              suppressContinueForRunId={heroResumeTarget?.runId}
              remainingReviewCount={hiddenFeaturedCount}
            />
          ) : (
            <ul className="m-0 list-none space-y-0 p-0" data-testid="recent-runs-home-panel">
              {featuredItems.map((run) => {
                const requestId = runListPrimaryRequestId(run);

                return (
                  <li key={run.runId} className="flex flex-wrap items-start gap-2">
                    <div className="min-w-0 flex-1">
                      <OperatorHomeReviewSummaryCard
                        run={run}
                        href={`/architecture/reviews/${encodeURIComponent(run.runId)}`}
                        buyerPolishedShell={props.buyerPolishedShell}
                        variant="list"
                        siblingRuns={featuredItems}
                      />
                    </div>
                    {props.showArchived && requestId !== null ? (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className={cn("h-7", OPERATOR_TYPOGRAPHY.button)}
                        disabled={props.restoreBusyRequestId === requestId}
                        data-testid={`runs-dashboard-restore-${run.runId}`}
                        onClick={() => {
                          props.onRestoreArchivedRequest(requestId);
                        }}
                      >
                        {props.restoreBusyRequestId === requestId
                          ? RUNS_DASHBOARD_LABELS.restoringRequest
                          : RUNS_DASHBOARD_LABELS.restoreRequest}
                      </Button>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          )}
          {hiddenFeaturedCount > 0 && props.pagePrimaryOwnedElsewhere !== true ? (
            <p className={cn("m-0 mt-2", OPERATOR_TYPOGRAPHY.helper, "text-neutral-600 dark:text-neutral-400")}>
              <Link href="/architecture/reviews" className={OPERATOR_LINK.nav}>
                View all reviews
              </Link>
              {` (${hiddenFeaturedCount} more on this page)`}
            </p>
          ) : null}
        </>
      ) : null}
    </div>
  );
}
