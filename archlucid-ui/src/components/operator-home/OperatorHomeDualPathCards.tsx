"use client";

import { useState } from "react";

import { useNavCallerAuthorityRank } from "@/components/OperatorNavAuthorityProvider";
import { OperatorHomeCompletedSampleAction } from "@/components/operator-home/OperatorHomeCompletedSampleAction";
import { OperatorHomeNavigateLoadingButton } from "@/components/operator-home/OperatorHomeNavigateLoadingButton";
import { OperatorHomeReadinessStrip } from "@/components/operator-home/OperatorHomeReadinessStrip";
import { useOperatorHomeWorkspaceActivity } from "@/components/operator-home/operator-home-workspace-activity-context";
import { ReviewStartInlineError } from "@/components/review-intake/ReviewStartInlineError";
import { ReviewStartLoadingButton } from "@/components/review-intake/ReviewStartLoadingButton";
import { ReviewStartStagedProgress } from "@/components/review-intake/ReviewStartStagedProgress";
import { StatusTag } from "@/components/ui/status-tag";
import { useCreateArchitectureNavigation } from "@/hooks/use-create-architecture-navigation";
import { useFinishSetupReadinessContext } from "@/hooks/use-finish-setup-readiness-context";
import { useOperateCapability } from "@/hooks/use-operate-capability";
import { useReviewIntakeNavigation } from "@/hooks/use-review-intake-navigation";
import { CREATE_ARCHITECTURE_LABEL } from "@/lib/architecture-workflow-labels";
import {
  OPERATOR_HOME_BEST_FOR_EVALUATING_BADGE,
  OPERATOR_HOME_CLOUD_EVIDENCE_LINK,
  OPERATOR_HOME_CREATE_ARCHITECTURE_CARD_BODY,
  OPERATOR_HOME_CREATE_ARCHITECTURE_CARD_TITLE,
  OPERATOR_HOME_EXPLORE_COMPLETED_REVIEW_BODY,
  OPERATOR_HOME_EXPLORE_COMPLETED_REVIEW_TITLE,
  OPERATOR_HOME_READ_ONLY_INTENT_HINT,
  OPERATOR_HOME_REVIEW_ARCHITECTURE_CARD_BODY,
  OPERATOR_HOME_REVIEW_ARCHITECTURE_CARD_TITLE,
  OPERATOR_HOME_REVIEW_ARCHITECTURE_CTA,
} from "@/lib/buyer-polish-copy";
import { OPERATOR_LAYOUT, OPERATOR_LINK, OPERATOR_SURFACE_CARD_CLASS, OPERATOR_TYPE_SCALE } from "@/lib/design-tokens";
import { CLOUD_CONNECTIONS_PATH } from "@/lib/integrations-nav-paths";
import { AUTHORITY_RANK } from "@/lib/nav-authority";
import { resolveOperatorHomeWorkspaceReadiness } from "@/lib/operator-home-workspace-readiness";
import {
  OPERATOR_HOME_OPENING_CLOUD_CONNECTIONS_LABEL,
  REVIEW_START_LOADING_LABEL,
  REVIEW_START_PREPARING_LABEL,
} from "@/lib/review-start-progress-copy";
import { cn } from "@/lib/utils";

type SelectedHomePath = "explore-completed-review" | "create-architecture" | "review-architecture" | null;

type OperatorHomeDualPathCardsProps = {
  readonly variant?: "prominent" | "compact";
};

/** Three intent cards on Overview — explore, review, or create without implying sequence. */
export function OperatorHomeDualPathCards(props: OperatorHomeDualPathCardsProps): React.JSX.Element {
  const variant = props.variant ?? "prominent";
  const reviewNavigation = useReviewIntakeNavigation();
  const createArchitectureNavigation = useCreateArchitectureNavigation();
  const canExecute = useOperateCapability();
  const callerAuthorityRank = useNavCallerAuthorityRank();
  const readiness = useFinishSetupReadinessContext();
  const { hasWorkspaceReviews } = useOperatorHomeWorkspaceActivity();
  const [selectedPath, setSelectedPath] = useState<SelectedHomePath>(null);

  const canManageCloudConnections = callerAuthorityRank >= AUTHORITY_RANK.AdminAuthority;
  const showEvaluationBadge = !hasWorkspaceReviews && variant === "prominent";
  const isCompact = variant === "compact";

  const workspaceReadiness =
    readiness.context !== null
      ? resolveOperatorHomeWorkspaceReadiness(readiness.context)
      : { canBegin: true, blockerMessage: null };

  const startCreateArchitecture = () => {
    setSelectedPath("create-architecture");
    createArchitectureNavigation.navigate();
  };

  const startReviewArchitecture = () => {
    setSelectedPath("review-architecture");
    reviewNavigation.navigate({ href: "/reviews/new" });
  };

  return (
    <div
      className={cn("space-y-3", OPERATOR_LAYOUT.inlineGap)}
      data-testid="operator-home-dual-path-cards"
      data-variant={variant}
      aria-busy={reviewNavigation.isNavigating || createArchitectureNavigation.isNavigating}
    >
      <div
        className={cn("grid gap-3 sm:grid-cols-2 md:grid-cols-3", OPERATOR_LAYOUT.inlineGap)}
        role="status"
        aria-live="polite"
      >
        <article
          className={cn(
            OPERATOR_SURFACE_CARD_CLASS,
            "flex flex-col gap-3 p-4",
            isCompact
              ? "border border-neutral-200 dark:border-neutral-800"
              : "border-2 border-teal-800/25 dark:border-teal-500/30",
            selectedPath === "explore-completed-review" && "ring-2 ring-teal-700/40 ring-offset-2",
          )}
          data-testid="operator-home-explore-completed-review-card"
          aria-labelledby="operator-home-explore-completed-review-title"
        >
          <div className="min-w-0 space-y-2">
            {showEvaluationBadge ? (
              <StatusTag
                kind="ready"
                label={OPERATOR_HOME_BEST_FOR_EVALUATING_BADGE}
                data-testid="operator-home-explore-recommended-badge"
              />
            ) : null}
            <h3
              className={cn("m-0", isCompact ? OPERATOR_TYPE_SCALE.helper : OPERATOR_TYPE_SCALE.sectionTitle)}
              id="operator-home-explore-completed-review-title"
            >
              {OPERATOR_HOME_EXPLORE_COMPLETED_REVIEW_TITLE}
            </h3>
            {!isCompact ? (
              <p className={cn("m-0", OPERATOR_TYPE_SCALE.helper, "text-al-text-secondary")}>
                {OPERATOR_HOME_EXPLORE_COMPLETED_REVIEW_BODY}
              </p>
            ) : null}
          </div>
          <OperatorHomeCompletedSampleAction compact={isCompact} />
        </article>

        <article
          className={cn(
            OPERATOR_SURFACE_CARD_CLASS,
            "flex flex-col gap-3 border border-neutral-200 p-4 dark:border-neutral-800",
            selectedPath === "review-architecture" && "ring-2 ring-teal-700/40 ring-offset-2",
          )}
          data-testid="operator-home-review-architecture-card"
          aria-labelledby="operator-home-review-architecture-title"
          aria-current={selectedPath === "review-architecture" ? "true" : undefined}
        >
          <div className="min-w-0 space-y-1">
            <h3
              className={cn("m-0", isCompact ? OPERATOR_TYPE_SCALE.helper : OPERATOR_TYPE_SCALE.sectionTitle)}
              id="operator-home-review-architecture-title"
            >
              {OPERATOR_HOME_REVIEW_ARCHITECTURE_CARD_TITLE}
            </h3>
            {!isCompact ? (
              <p className={cn("m-0", OPERATOR_TYPE_SCALE.helper, "text-al-text-secondary")}>
                {OPERATOR_HOME_REVIEW_ARCHITECTURE_CARD_BODY}
              </p>
            ) : null}
          </div>
          {canExecute ? (
            <ReviewStartLoadingButton
              variant="primary"
              size="sm"
              className="h-8 w-fit"
              idleLabel={OPERATOR_HOME_REVIEW_ARCHITECTURE_CTA}
              loadingLabel={REVIEW_START_LOADING_LABEL}
              isLoading={reviewNavigation.isNavigating && selectedPath === "review-architecture"}
              onClick={startReviewArchitecture}
              data-testid="operator-home-review-architecture-cta"
            />
          ) : (
            <p className={cn("m-0", OPERATOR_TYPE_SCALE.micro, "text-al-text-secondary")}>
              {OPERATOR_HOME_READ_ONLY_INTENT_HINT}
            </p>
          )}
          {canManageCloudConnections ? (
            <div className="pt-1" data-testid="operator-home-optional-cloud-shortcut">
              <OperatorHomeNavigateLoadingButton
                variant="outline"
                size="sm"
                className={cn("h-8 w-fit border-0 px-0 font-medium shadow-none", OPERATOR_LINK.nav)}
                href={CLOUD_CONNECTIONS_PATH}
                idleLabel={OPERATOR_HOME_CLOUD_EVIDENCE_LINK}
                loadingLabel={OPERATOR_HOME_OPENING_CLOUD_CONNECTIONS_LABEL}
                data-testid="operator-home-connect-cloud"
              />
            </div>
          ) : null}
        </article>

        <article
          className={cn(
            OPERATOR_SURFACE_CARD_CLASS,
            "flex flex-col gap-3 border border-neutral-200 p-4 dark:border-neutral-800 sm:col-span-2 md:col-span-1",
            selectedPath === "create-architecture" && "ring-2 ring-teal-700/40 ring-offset-2",
          )}
          data-testid="operator-home-create-architecture-card"
          aria-labelledby="operator-home-create-architecture-title"
          aria-current={selectedPath === "create-architecture" ? "true" : undefined}
        >
          <div className="min-w-0 space-y-1">
            <h3
              className={cn("m-0", isCompact ? OPERATOR_TYPE_SCALE.helper : OPERATOR_TYPE_SCALE.sectionTitle)}
              id="operator-home-create-architecture-title"
            >
              {OPERATOR_HOME_CREATE_ARCHITECTURE_CARD_TITLE}
            </h3>
            {!isCompact ? (
              <p className={cn("m-0", OPERATOR_TYPE_SCALE.helper, "text-al-text-secondary")}>
                {OPERATOR_HOME_CREATE_ARCHITECTURE_CARD_BODY}
              </p>
            ) : null}
          </div>
          {canExecute ? (
            <ReviewStartLoadingButton
              variant="primary"
              size="sm"
              className="h-8 w-fit"
              idleLabel={CREATE_ARCHITECTURE_LABEL}
              loadingLabel={createArchitectureNavigation.loadingLabel}
              isLoading={createArchitectureNavigation.isNavigating && selectedPath === "create-architecture"}
              onClick={startCreateArchitecture}
              data-testid="operator-home-create-architecture-cta"
            />
          ) : (
            <p className={cn("m-0", OPERATOR_TYPE_SCALE.micro, "text-al-text-secondary")}>
              {OPERATOR_HOME_READ_ONLY_INTENT_HINT}
            </p>
          )}
        </article>
      </div>

      {!isCompact ? (
        <OperatorHomeReadinessStrip
          canBegin={workspaceReadiness.canBegin}
          blockerMessage={workspaceReadiness.blockerMessage}
        />
      ) : null}

      {reviewNavigation.showStagedPanel && reviewNavigation.activeStageId !== null ? (
        <ReviewStartStagedProgress
          stages={reviewNavigation.stages}
          activeStageId={reviewNavigation.activeStageId}
          headline={REVIEW_START_PREPARING_LABEL}
          testId="operator-home-review-start-progress"
        />
      ) : null}

      {reviewNavigation.error !== null ? <ReviewStartInlineError message={reviewNavigation.error} /> : null}
      {createArchitectureNavigation.error !== null ? (
        <ReviewStartInlineError message={createArchitectureNavigation.error} />
      ) : null}
    </div>
  );
}
