import Link from "next/link";
import { cn } from "@/lib/utils";

import { OperatorApiProblem } from "@/components/OperatorApiProblem";
import { OperatorHomeWorkspaceArchivedEmptyState } from "@/components/operator-home/OperatorHomeWorkspaceArchivedEmptyState";
import { OperatorHomeWorkspaceEmptyState } from "@/components/operator-home/OperatorHomeWorkspaceEmptyState";
import {
  runListPrimaryRequestId,
  runListPrimaryTitle,
  RunListRowBadges,
} from "@/components/operator-home/runs-dashboard-helpers";
import type { RunsDashboardLoadPhase } from "@/components/operator-home/runs-dashboard-load-phase";
import { Button } from "@/components/ui/button";
import { isShowcaseStaticDemoRunId } from "@/lib/demo-run-canonical";
import {
  getCanonicalReviewWorkspaceHref,
  getShowcaseManifestHref,
  getShowcaseWalkthroughHref,
} from "@/lib/buyer-safe-review-navigation";
import { BUYER_FINDINGS_COUNT_WITH_MONITORED_RISK } from "@/lib/buyer-polish-copy";
import {
  OPERATOR_CARD,
  OPERATOR_SURFACE_CARD_CLASS,
  OPERATOR_TYPOGRAPHY,
  OPERATOR_TYPE_SCALE,
} from "@/lib/design-tokens";
import { RUNS_DASHBOARD_LABELS } from "@/lib/i18n";
import {
  formatRunHomeListInsightLine,
  formatRunHomeListUpdatedLabel,
} from "@/lib/operator-home-run-list-insight";
import {
  SHOWCASE_BUYER_REVIEW_TITLE,
  SHOWCASE_STATIC_DEMO_PRIMARY_FINDING_ID,
  SHOWCASE_STATIC_DEMO_SPINE_COUNTS,
} from "@/lib/showcase-static-demo";
import type { ApiLoadFailureState } from "@/lib/api-load-failure";
import type { RunSummary } from "@/types/authority";

export type RunsDashboardRecentTabProps = {
  readonly phase: RunsDashboardLoadPhase;
  readonly failure: ApiLoadFailureState | null;
  readonly runListError: boolean;
  readonly filteredItems: RunSummary[];
  readonly effectiveItems: RunSummary[];
  readonly buyerPolishedShell: boolean;
  readonly showcaseDemoRun: RunSummary | undefined;
  readonly showcasePrimaryCta: { href: string; label: string } | null;
  readonly buyerSafeHighlight: boolean;
  readonly showArchived: boolean;
  readonly archivedFieldSupported: boolean;
  readonly restoreBusyRequestId: string | null;
  readonly onRestoreArchivedRequest: (requestId: string) => void;
};

export function RunsDashboardRecentTab(props: RunsDashboardRecentTabProps) {
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

  return (
    <div data-testid="runs-dashboard-tab-recent">
      {props.phase === "loading" ? (
        <p className={cn("m-0 text-neutral-500 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
          {RUNS_DASHBOARD_LABELS.loadingReviews}
        </p>
      ) : null}

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
            Completed example review · Approved with monitoring
          </p>
          <p className={cn("m-0", OPERATOR_TYPE_SCALE.body, "text-neutral-600 dark:text-neutral-400")}>
            {props.buyerSafeHighlight ? (
              <>
                Start with the finalized review package or the public walkthrough — technical workspace detail stays
                available for architects who want the authenticated console.
              </>
            ) : (
              <>
                Explore the completed sample review: review detail, finalized review package, primary finding, or the
                read-only marketing showcase.
              </>
            )}
          </p>
          <div className="flex flex-wrap items-center gap-2">
            {props.buyerSafeHighlight && props.showcasePrimaryCta !== null ? (
              <>
                <Button asChild variant="primary" size="sm" className="h-8">
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
                <Button asChild variant="primary" size="sm" className="h-8">
                  <Link href={`/reviews/${encodeURIComponent(props.showcaseDemoRun.runId)}`}>Review package</Link>
                </Button>
                <Button asChild variant="outline" size="sm" className="h-8">
                  <Link href={getShowcaseManifestHref()}>View signed record</Link>
                </Button>
                <Button asChild variant="outline" size="sm" className="h-8">
                  <Link
                    href={`/reviews/${encodeURIComponent(props.showcaseDemoRun.runId)}/findings/${encodeURIComponent(SHOWCASE_STATIC_DEMO_PRIMARY_FINDING_ID)}`}
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

      {(props.phase === "ready" || props.phase === "error") && props.showcaseDemoRun !== undefined && props.buyerPolishedShell ? (
        <section
          aria-label="Featured review package summary"
          className={cn("space-y-2", OPERATOR_CARD.nested, OPERATOR_SURFACE_CARD_CLASS)}
          data-testid="runs-dashboard-buyer-proof-summary"
        >
          <p className={cn("m-0", OPERATOR_TYPE_SCALE.cardTitle, "text-neutral-900 dark:text-neutral-100")}>
            Decision: Package finalized
          </p>
          <p className={cn("m-0 text-neutral-800 dark:text-neutral-200", OPERATOR_TYPOGRAPHY.helper)}>
            Governance approval: Approved with monitoring
          </p>
          <p className={cn("m-0 text-neutral-800 dark:text-neutral-200", OPERATOR_TYPOGRAPHY.helper)}>
            {BUYER_FINDINGS_COUNT_WITH_MONITORED_RISK(
              SHOWCASE_STATIC_DEMO_SPINE_COUNTS.findingCount,
              SHOWCASE_STATIC_DEMO_SPINE_COUNTS.warningCount,
            )}
          </p>
          <p className={cn("m-0 text-neutral-800 dark:text-neutral-200", OPERATOR_TYPOGRAPHY.helper)}>Evidence trail: Ready</p>
          <p className={cn("m-0 text-neutral-800 dark:text-neutral-200", OPERATOR_TYPOGRAPHY.helper)}>Audit trail: Complete</p>
          {props.showcasePrimaryCta !== null ? (
            <Button asChild variant="primary" size="sm" className="mt-1 h-8">
              <Link href={props.showcasePrimaryCta.href}>{props.showcasePrimaryCta.label}</Link>
            </Button>
          ) : null}
        </section>
      ) : null}

      {(props.phase === "ready" || props.phase === "error") && props.filteredItems.length > 0 ? (
        <ul className="m-0 list-none space-y-2 p-0" data-testid="recent-runs-home-panel">
          {props.filteredItems.map((run) => {
            const requestId = runListPrimaryRequestId(run);

            return (
              <li
                key={run.runId}
                className="flex flex-wrap items-start gap-2 border-b border-neutral-100 pb-2 last:border-b-0 last:pb-0 dark:border-neutral-800"
              >
                <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <div className="flex min-w-0 flex-wrap items-center gap-2">
                    <Link
                      href={`/reviews/${encodeURIComponent(run.runId)}`}
                      className={cn(
                        "min-w-0 font-semibold text-teal-900 underline decoration-teal-300/80 hover:text-teal-950 dark:text-teal-100 dark:hover:text-teal-50",
                        OPERATOR_TYPE_SCALE.body,
                      )}
                    >
                      {runListPrimaryTitle(run)}
                    </Link>
                    <RunListRowBadges run={run} className="text-[0.6rem]" />
                  </div>
                  {isShowcaseStaticDemoRunId(run.runId ?? "") ? (
                    <p className={cn("m-0 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.navHelper)}>
                      Completed example review · Approved with monitoring
                    </p>
                  ) : null}
                  {(() => {
                    const insightLine = formatRunHomeListInsightLine(run);
                    const updatedLabel = formatRunHomeListUpdatedLabel(run);

                    if (insightLine === null && updatedLabel === null) {
                      return null;
                    }

                    return (
                      <p
                        className={cn("m-0 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.navHelper)}
                        data-testid={`run-home-list-insight-${run.runId}`}
                      >
                        {[insightLine, updatedLabel].filter((part) => part !== null).join(" · ")}
                      </p>
                    );
                  })()}
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
      ) : null}
    </div>
  );
}
