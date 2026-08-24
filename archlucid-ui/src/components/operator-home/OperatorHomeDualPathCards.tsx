"use client";

import { useState } from "react";

import { useNavCallerAuthorityRank } from "@/components/operator/OperatorNavAuthorityProvider";
import { OperatorHomeCompletedSampleAction } from "@/components/operator-home/OperatorHomeCompletedSampleAction";
import { useSampleReviewsOnOverviewVisible } from "@/components/SampleReviewsOnOverviewPreferenceProvider";
import { SpecimenDeliverablePreviewCallout } from "@/components/usability/SpecimenDeliverablePreviewCallout";
import { OperatorHomeNavigateLoadingButton } from "@/components/operator-home/OperatorHomeNavigateLoadingButton";
import { OperatorHomeReadinessStrip } from "@/components/operator-home/OperatorHomeReadinessStrip";
import { ReviewStartInlineError } from "@/components/review-intake/ReviewStartInlineError";
import { ReviewStartLoadingButton } from "@/components/review-intake/ReviewStartLoadingButton";
import { ReviewStartNavigationStallNotice } from "@/components/review-intake/ReviewStartNavigationStallNotice";
import { ReviewStartStagedProgress } from "@/components/review-intake/ReviewStartStagedProgress";
import { StatusTag } from "@/components/ui/status-tag";
import { useCreateArchitectureNavigation } from "@/hooks/use-create-architecture-navigation";
import { useFinishSetupReadinessContext } from "@/hooks/use-finish-setup-readiness-context";
import { useOperateCapability } from "@/hooks/use-operate-capability";
import { useReviewIntakeNavigation } from "@/hooks/use-review-intake-navigation";
import { CREATE_ARCHITECTURE_LABEL } from "@/lib/architecture/architecture-workflow-labels";
import {
  OPERATOR_HOME_BEST_FOR_EVALUATING_BADGE,
  OPERATOR_HOME_CLOUD_CONNECT_ADMIN_HINT,
  OPERATOR_HOME_CONNECT_CLOUD_CTA,
  OPERATOR_HOME_CREATE_ARCHITECTURE_CARD_BODY,
  OPERATOR_HOME_CREATE_ARCHITECTURE_CARD_BODY_COMPACT,
  OPERATOR_HOME_CREATE_ARCHITECTURE_CARD_TITLE,
  OPERATOR_HOME_EXPLORE_COMPLETED_REVIEW_BODY,
  OPERATOR_HOME_EXPLORE_COMPLETED_REVIEW_TITLE,
  OPERATOR_HOME_LIFECYCLE_RECOMMENDED_BADGE,
  OPERATOR_HOME_READ_ONLY_INTENT_HINT,
  OPERATOR_HOME_REVIEW_ARCHITECTURE_CARD_BODY,
  OPERATOR_HOME_REVIEW_ARCHITECTURE_CARD_BODY_COMPACT,
  OPERATOR_HOME_REVIEW_ARCHITECTURE_CARD_TITLE,
  OPERATOR_HOME_REVIEW_ARCHITECTURE_CTA,
} from "@/lib/buyer/buyer-polish-copy";
import { OPERATOR_CARD, OPERATOR_LAYOUT, OPERATOR_HOME_LIFECYCLE_CARD_TITLE, OPERATOR_SURFACE_CARD_CLASS, OPERATOR_TYPE_SCALE } from "@/lib/design-tokens";
import type { OperatorHomeLifecyclePath } from "@/lib/resolve-operator-home-workspace-phase";
import { trackOperatorHomeLifecyclePathClick } from "@/lib/operator/operator-home-lifecycle-path-telemetry";
import { CLOUD_CONNECTIONS_PATH } from "@/lib/integrations-nav-paths";
import { AUTHORITY_RANK } from "@/lib/nav-authority";
import { resolveOperatorHomeWorkspaceReadiness } from "@/lib/operator/operator-home-workspace-readiness";
import {
  OPERATOR_HOME_OPENING_CLOUD_CONNECTIONS_LABEL,
  REVIEW_START_LOADING_LABEL,
  REVIEW_START_PREPARING_LABEL,
} from "@/lib/review-start-progress-copy";
import { cn } from "@/lib/utils";

type SelectedHomePath = "explore-completed-review" | "create-architecture" | "review-architecture" | null;

type OperatorHomeDualPathCardsProps = {
  readonly variant?: "prominent" | "compact";
  readonly emphasizedPath?: OperatorHomeLifecyclePath | null;
  /** When resume draft or Do-this-next owns the page primary, keep lifecycle cards secondary. */
  readonly pagePrimaryOwnedElsewhere?: boolean;
  /** Hide the completed-sample explore card when Home already surfaces active reviews. */
  readonly hideExplorePath?: boolean;
};

type LifecycleCardPath = Exclude<SelectedHomePath, null>;

function resolveLifecycleCardButtonVariant(
  path: LifecycleCardPath,
  options: {
    emphasizedPath: OperatorHomeLifecyclePath | null | undefined;
    pagePrimaryOwnedElsewhere: boolean;
  },
): "primary" | "outline" {
  if (
    options.emphasizedPath !== null &&
    options.emphasizedPath !== undefined &&
    options.emphasizedPath === path
  ) {
    return "primary";
  }

  if (options.pagePrimaryOwnedElsewhere) {
    return "outline";
  }

  if (options.emphasizedPath !== null && options.emphasizedPath !== undefined && options.emphasizedPath !== path) {
    return "outline";
  }

  return "primary";
}

function lifecycleCardClassName(
  path: Exclude<SelectedHomePath, null>,
  emphasizedPath: OperatorHomeLifecyclePath | null | undefined,
  selectedPath: SelectedHomePath,
  extraClassName?: string,
): string {
  const isEmphasized = emphasizedPath === path;

  return cn(
    OPERATOR_SURFACE_CARD_CLASS,
    "flex flex-col gap-3 border border-neutral-200 p-4 dark:border-neutral-800",
    isEmphasized && OPERATOR_CARD.lifecycleEmphasized,
    selectedPath === path && "ring-2 ring-teal-700/40 ring-offset-2",
    extraClassName,
  );
}

function lifecycleRecommendedBadge(
  path: OperatorHomeLifecyclePath,
  emphasizedPath: OperatorHomeLifecyclePath | null | undefined,
  isCompact: boolean,
): React.JSX.Element | null {
  if (isCompact || emphasizedPath !== path) {
    return null;
  }

  if (path === "explore-completed-review") {
    return (
      <StatusTag
        kind="ready"
        label={OPERATOR_HOME_BEST_FOR_EVALUATING_BADGE}
        data-testid="operator-home-explore-recommended-badge"
      />
    );
  }

  return (
    <StatusTag
      kind="ready"
      label={OPERATOR_HOME_LIFECYCLE_RECOMMENDED_BADGE}
      data-testid={`operator-home-lifecycle-recommended-${path}`}
    />
  );
}

/** Overview lifecycle entry — Step 1 draft, Step 2 review, plus an optional completed-sample explore path. */
export function OperatorHomeDualPathCards(props: OperatorHomeDualPathCardsProps): React.JSX.Element {
  const variant = props.variant ?? "prominent";
  const emphasizedPath = props.emphasizedPath ?? null;
  const pagePrimaryOwnedElsewhere = props.pagePrimaryOwnedElsewhere === true;
  const createArchitectureVariant = resolveLifecycleCardButtonVariant("create-architecture", {
    emphasizedPath,
    pagePrimaryOwnedElsewhere,
  });
  const reviewArchitectureVariant = resolveLifecycleCardButtonVariant("review-architecture", {
    emphasizedPath,
    pagePrimaryOwnedElsewhere,
  });
  const exploreCompletedReviewVariant = resolveLifecycleCardButtonVariant("explore-completed-review", {
    emphasizedPath,
    pagePrimaryOwnedElsewhere,
  });
  const reviewNavigation = useReviewIntakeNavigation();
  const createArchitectureNavigation = useCreateArchitectureNavigation();
  const canExecute = useOperateCapability();
  const callerAuthorityRank = useNavCallerAuthorityRank();
  const readiness = useFinishSetupReadinessContext();
  const [selectedPath, setSelectedPath] = useState<SelectedHomePath>(null);

  const canManageCloudConnections = callerAuthorityRank >= AUTHORITY_RANK.AdminAuthority;
  const isCompact = variant === "compact";
  const sampleReviewsVisible = useSampleReviewsOnOverviewVisible();
  const hideExplorePath = props.hideExplorePath === true || !sampleReviewsVisible;

  const workspaceReadiness =
    readiness.context !== null
      ? resolveOperatorHomeWorkspaceReadiness(readiness.context)
      : { canBegin: true, blockerMessage: null };

  const startCreateArchitecture = () => {
    setSelectedPath("create-architecture");
    trackOperatorHomeLifecyclePathClick("create-architecture");
    createArchitectureNavigation.navigate();
  };

  const startReviewArchitecture = () => {
    setSelectedPath("review-architecture");
    trackOperatorHomeLifecyclePathClick("review-architecture");
    reviewNavigation.navigate({ href: "/architecture/reviews/new" });
  };

  return (
    <div
      className={cn("space-y-3", OPERATOR_LAYOUT.inlineGap)}
      data-testid="operator-home-dual-path-cards"
      data-variant={variant}
      aria-busy={reviewNavigation.isNavigating || createArchitectureNavigation.isNavigating}
    >
      <div
        className={cn(
          "grid gap-3",
          hideExplorePath ? "sm:grid-cols-2" : "sm:grid-cols-2 md:grid-cols-3",
          OPERATOR_LAYOUT.inlineGap,
        )}
      >
        <article
          className={lifecycleCardClassName("create-architecture", emphasizedPath, selectedPath)}
          data-testid="operator-home-create-architecture-card"
          aria-labelledby="operator-home-create-architecture-title"
          aria-current={selectedPath === "create-architecture" ? "true" : undefined}
        >
          <div className="min-w-0 space-y-1">
            {lifecycleRecommendedBadge("create-architecture", emphasizedPath, isCompact)}
            <h3
              className={cn("m-0", OPERATOR_HOME_LIFECYCLE_CARD_TITLE)}
              id="operator-home-create-architecture-title"
            >
              {OPERATOR_HOME_CREATE_ARCHITECTURE_CARD_TITLE}
            </h3>
            {!isCompact ? (
              <p className={cn("m-0", OPERATOR_TYPE_SCALE.helper, "text-al-text-secondary")}>
                {OPERATOR_HOME_CREATE_ARCHITECTURE_CARD_BODY}
              </p>
            ) : (
              <p className={cn("m-0", OPERATOR_TYPE_SCALE.helper, "text-al-text-secondary")}>
                {OPERATOR_HOME_CREATE_ARCHITECTURE_CARD_BODY_COMPACT}
              </p>
            )}
          </div>
          {canExecute ? (
            <div className="space-y-2" data-testid="operator-home-create-architecture-actions">
              <div
                className="flex flex-wrap items-center gap-2"
                data-testid="operator-home-connect-cloud-path"
              >
                <ReviewStartLoadingButton
                  variant={createArchitectureVariant}
                  size="sm"
                  className="h-8 w-fit"
                  idleLabel={CREATE_ARCHITECTURE_LABEL}
                  loadingLabel={createArchitectureNavigation.loadingLabel}
                  isLoading={createArchitectureNavigation.isNavigating && selectedPath === "create-architecture"}
                  onClick={startCreateArchitecture}
                  data-testid="operator-home-create-architecture-cta"
                />
                <OperatorHomeNavigateLoadingButton
                  variant="outline"
                  size="sm"
                  className="h-8 w-fit"
                  href={CLOUD_CONNECTIONS_PATH}
                  idleLabel={OPERATOR_HOME_CONNECT_CLOUD_CTA}
                  loadingLabel={OPERATOR_HOME_OPENING_CLOUD_CONNECTIONS_LABEL}
                  onNavigate={() => {
                    setSelectedPath("create-architecture");
                  }}
                  data-testid="operator-home-connect-cloud"
                />
              </div>
              {!canManageCloudConnections ? (
                <p className={cn("m-0", OPERATOR_TYPE_SCALE.micro, "text-al-text-secondary")}>
                  {OPERATOR_HOME_CLOUD_CONNECT_ADMIN_HINT}
                </p>
              ) : null}
            </div>
          ) : (
            <p className={cn("m-0", OPERATOR_TYPE_SCALE.micro, "text-al-text-secondary")}>
              {OPERATOR_HOME_READ_ONLY_INTENT_HINT}
            </p>
          )}
        </article>

        <article
          className={lifecycleCardClassName("review-architecture", emphasizedPath, selectedPath)}
          data-testid="operator-home-review-architecture-card"
          aria-labelledby="operator-home-review-architecture-title"
          aria-current={selectedPath === "review-architecture" ? "true" : undefined}
        >
          <div className="min-w-0 space-y-1">
            {lifecycleRecommendedBadge("review-architecture", emphasizedPath, isCompact)}
            <h3
              className={cn("m-0", OPERATOR_HOME_LIFECYCLE_CARD_TITLE)}
              id="operator-home-review-architecture-title"
            >
              {OPERATOR_HOME_REVIEW_ARCHITECTURE_CARD_TITLE}
            </h3>
            {!isCompact ? (
              <p className={cn("m-0", OPERATOR_TYPE_SCALE.helper, "text-al-text-secondary")}>
                {OPERATOR_HOME_REVIEW_ARCHITECTURE_CARD_BODY}
              </p>
            ) : (
              <p className={cn("m-0", OPERATOR_TYPE_SCALE.helper, "text-al-text-secondary")}>
                {OPERATOR_HOME_REVIEW_ARCHITECTURE_CARD_BODY_COMPACT}
              </p>
            )}
          </div>
          {canExecute ? (
            <ReviewStartLoadingButton
              variant={reviewArchitectureVariant}
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
        </article>

        <article
          className={lifecycleCardClassName(
            "explore-completed-review",
            emphasizedPath,
            selectedPath,
            hideExplorePath ? "hidden" : "sm:col-span-2 md:col-span-1",
          )}
          data-testid="operator-home-explore-completed-review-card"
          aria-labelledby="operator-home-explore-completed-review-title"
        >
          <div className="min-w-0 space-y-2">
            {lifecycleRecommendedBadge("explore-completed-review", emphasizedPath, isCompact)}
            <h3
              className={cn("m-0", isCompact ? OPERATOR_TYPE_SCALE.helper : OPERATOR_HOME_LIFECYCLE_CARD_TITLE)}
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
          <SpecimenDeliverablePreviewCallout
            variant="compact"
            sectionTestId="operator-home-explore-completed-review-specimen-preview"
          />
          <OperatorHomeCompletedSampleAction
            compact={isCompact}
            pagePrimaryOwnedElsewhere={exploreCompletedReviewVariant === "outline"}
            onOpenSample={() => {
              setSelectedPath("explore-completed-review");
              trackOperatorHomeLifecyclePathClick("explore-completed-review");
            }}
          />
        </article>
      </div>

      {/* Renders only when a prerequisite blocks starting — compact layouts must not hide that. */}
      <OperatorHomeReadinessStrip
        canBegin={workspaceReadiness.canBegin}
        blockerMessage={workspaceReadiness.blockerMessage}
      />


      {reviewNavigation.showStagedPanel && reviewNavigation.activeStageId !== null ? (
        <ReviewStartStagedProgress
          stages={reviewNavigation.stages}
          activeStageId={reviewNavigation.activeStageId}
          headline={REVIEW_START_PREPARING_LABEL}
          testId="operator-home-review-start-progress"
        />
      ) : null}

      {reviewNavigation.stalled && reviewNavigation.stalledHref !== null ? (
        <ReviewStartNavigationStallNotice
          href={reviewNavigation.stalledHref}
          testId="operator-home-review-start-stall"
        />
      ) : null}

      {reviewNavigation.error !== null ? <ReviewStartInlineError message={reviewNavigation.error} /> : null}
      {createArchitectureNavigation.error !== null ? (
        <ReviewStartInlineError message={createArchitectureNavigation.error} />
      ) : null}
    </div>
  );
}
