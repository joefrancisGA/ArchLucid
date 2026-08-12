import { cn } from "@/lib/utils";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  GOVERNANCE_OVERVIEW_BACK_ACTION,
  GOVERNANCE_OVERVIEW_LOAD_REVIEW_ACTION,
} from "@/lib/governance-overview-copy";
import { buyerFacingReviewLinkLabelFromRunId } from "@/lib/buyer-facing-review-title";
import {
  enterpriseMutationControlDisabledTitle,
  governanceWorkflowRefreshRunDataButtonLabel,
  governanceWorkflowRefreshRunDataTitle,
} from "@/lib/enterprise-controls-context-copy";
import {
  GOVERNANCE_WORKFLOW_AUDIT_TRAIL_ACTOR_HELPER,
  GOVERNANCE_WORKFLOW_AUDIT_TRAIL_ACTOR_LABEL,
  GOVERNANCE_WORKFLOW_AUDIT_TRAIL_ACTOR_PLACEHOLDER,
} from "@/lib/governance-workflow-release-copy";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

export type GovernanceReviewContextBarProps = {
  readonly activeRunId: string;
  /** Resolved buyer-facing title; falls back to the run id when null/empty. */
  readonly reviewDisplayTitle?: string | null;
  readonly buyerPolishedShell: boolean;
  readonly canMutateWorkflow: boolean;
  readonly listsLoading: boolean;
  readonly listsLoadingShowsBusyChrome: boolean;
  readonly workflowActor: string;
  readonly setWorkflowActor: (value: string) => void;
  readonly onBackToOverview: () => void;
  readonly onRefresh: () => void;
};

/** Compact review context header — replaces the duplicate approval-queue card on `/governance`. */
export function GovernanceReviewContextBar(props: GovernanceReviewContextBarProps): React.JSX.Element {
  const {
    activeRunId,
    reviewDisplayTitle,
    buyerPolishedShell,
    canMutateWorkflow,
    listsLoading,
    listsLoadingShowsBusyChrome,
    workflowActor,
    setWorkflowActor,
    onBackToOverview,
    onRefresh,
  } = props;

  const titleTrimmed = reviewDisplayTitle?.trim() ?? "";
  const selectedReviewLabel =
    titleTrimmed.length > 0 ? titleTrimmed : buyerFacingReviewLinkLabelFromRunId(activeRunId);

  return (
    <div
      className="mb-6 flex flex-col gap-3 rounded-md border border-neutral-200 bg-al-surface-raised px-4 py-3 dark:border-neutral-800"
      data-testid="governance-review-context-bar"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className={cn("m-0 text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}>
          <span className="font-semibold">Selected review:</span>{" "}
          <span data-testid="governance-review-context-title">{selectedReviewLabel}</span>
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <Button type="button" variant="outline" size="sm" onClick={onBackToOverview}>
            {GOVERNANCE_OVERVIEW_BACK_ACTION}
          </Button>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            data-testid="governance-refresh-review-data"
            onClick={() => {
              onRefresh();
            }}
            disabled={listsLoading}
            title={governanceWorkflowRefreshRunDataTitle}
          >
            {listsLoadingShowsBusyChrome
              ? "Refreshing…"
              : buyerPolishedShell
                ? "Refresh review data"
                : governanceWorkflowRefreshRunDataButtonLabel}
          </Button>
        </div>
      </div>
      <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
        Review-scoped approval requests, submissions, and governance activity appear below.{" "}
        <Link className="underline underline-offset-2" href={`/architecture/reviews/${encodeURIComponent(activeRunId)}`}>
          Open review
        </Link>
        {" · "}
        <span className="sr-only">Load another review from </span>
        {GOVERNANCE_OVERVIEW_LOAD_REVIEW_ACTION.toLowerCase()} using the overview page.
      </p>
      {canMutateWorkflow && !buyerPolishedShell ? (
        <div className="grid gap-2">
          <Label htmlFor="gov-workflow-actor">{GOVERNANCE_WORKFLOW_AUDIT_TRAIL_ACTOR_LABEL}</Label>
          <Input
            id="gov-workflow-actor"
            value={workflowActor}
            onChange={(event) => {
              setWorkflowActor(event.target.value);
            }}
            placeholder={GOVERNANCE_WORKFLOW_AUDIT_TRAIL_ACTOR_PLACEHOLDER}
            autoComplete="username"
            title={canMutateWorkflow ? undefined : enterpriseMutationControlDisabledTitle}
          />
          <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
            {GOVERNANCE_WORKFLOW_AUDIT_TRAIL_ACTOR_HELPER}
          </p>
        </div>
      ) : null}
    </div>
  );
}
