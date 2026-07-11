"use client";

import { useState } from "react";

import { ReviewStartInlineError } from "@/components/review-intake/ReviewStartInlineError";
import { ReviewStartLoadingButton } from "@/components/review-intake/ReviewStartLoadingButton";
import { ReviewStartStagedProgress } from "@/components/review-intake/ReviewStartStagedProgress";
import { StatusTag } from "@/components/ui/status-tag";
import { useReviewIntakeNavigation } from "@/hooks/use-review-intake-navigation";
import { CREATE_ARCHITECTURE_LABEL } from "@/lib/architecture-workflow-labels";
import {
  OPERATOR_HOME_CREATE_ARCHITECTURE_CARD_BODY,
  OPERATOR_HOME_CREATE_ARCHITECTURE_CARD_TITLE,
  OPERATOR_HOME_DUAL_PATH_CHOOSER_GUIDANCE,
  OPERATOR_HOME_RECOMMENDED_FIRST_BADGE,
  OPERATOR_HOME_REVIEW_ARCHITECTURE_CARD_BODY,
  OPERATOR_HOME_REVIEW_ARCHITECTURE_CARD_TITLE,
  OPERATOR_HOME_REVIEW_ARCHITECTURE_CTA,
} from "@/lib/buyer-polish-copy";
import { OPERATOR_LAYOUT, OPERATOR_SURFACE_CARD_CLASS, OPERATOR_TYPE_SCALE } from "@/lib/design-tokens";
import { REVIEW_START_PREPARING_LABEL } from "@/lib/review-start-progress-copy";
import { REVIEWS_NEW_GUIDED_INTAKE_HREF } from "@/lib/reviews-new-path-copy";
import { cn } from "@/lib/utils";

type SelectedHomePath = "create-architecture" | "review-architecture" | null;

/** Side-by-side create vs review entry points on Overview. */
export function OperatorHomeDualPathCards(): React.JSX.Element {
  const navigation = useReviewIntakeNavigation();
  const [selectedPath, setSelectedPath] = useState<SelectedHomePath>(null);

  const startCreateArchitecture = () => {
    setSelectedPath("create-architecture");
    navigation.navigate({ href: REVIEWS_NEW_GUIDED_INTAKE_HREF });
  };

  const startReviewArchitecture = () => {
    setSelectedPath("review-architecture");
    navigation.navigate({ href: "/reviews/new" });
  };

  return (
    <div
      className={cn("space-y-3", OPERATOR_LAYOUT.inlineGap)}
      data-testid="operator-home-dual-path-cards"
      aria-busy={navigation.isNavigating}
    >
      <p
        className={cn("m-0", OPERATOR_TYPE_SCALE.helper, "text-al-text-secondary")}
        data-testid="operator-home-dual-path-chooser-guidance"
      >
        {OPERATOR_HOME_DUAL_PATH_CHOOSER_GUIDANCE}
      </p>
      <div
        className={cn("grid gap-3 sm:grid-cols-2", OPERATOR_LAYOUT.inlineGap)}
        role="status"
        aria-live="polite"
      >
        <article
          className={cn(
            OPERATOR_SURFACE_CARD_CLASS,
            "flex flex-col gap-3 border border-neutral-200 p-4 dark:border-neutral-800",
            selectedPath === "create-architecture" && "ring-2 ring-teal-700/40 ring-offset-2",
          )}
          data-testid="operator-home-create-architecture-card"
          aria-current={selectedPath === "create-architecture" ? "true" : undefined}
        >
          <div className="min-w-0 space-y-1">
            <h3 className={cn("m-0", OPERATOR_TYPE_SCALE.sectionTitle)}>{OPERATOR_HOME_CREATE_ARCHITECTURE_CARD_TITLE}</h3>
            <p className={cn("m-0", OPERATOR_TYPE_SCALE.helper, "text-al-text-secondary")}>
              {OPERATOR_HOME_CREATE_ARCHITECTURE_CARD_BODY}
            </p>
          </div>
          <ReviewStartLoadingButton
            variant="primary"
            size="sm"
            className="h-8 w-fit"
            idleLabel={CREATE_ARCHITECTURE_LABEL}
            loadingLabel={navigation.loadingLabel}
            isLoading={navigation.isNavigating && selectedPath === "create-architecture"}
            onClick={startCreateArchitecture}
            data-testid="operator-home-create-architecture-cta"
          />
        </article>

        <article
          className={cn(
            OPERATOR_SURFACE_CARD_CLASS,
            "flex flex-col gap-3 border-2 border-teal-800/25 p-4 dark:border-teal-500/30",
            selectedPath === "review-architecture" && "ring-2 ring-teal-700/40 ring-offset-2",
          )}
          data-testid="operator-home-review-architecture-card"
          aria-current={selectedPath === "review-architecture" ? "true" : undefined}
        >
          <div className="min-w-0 space-y-2">
            <StatusTag
              kind="ready"
              label={OPERATOR_HOME_RECOMMENDED_FIRST_BADGE}
              data-testid="operator-home-review-recommended-first"
            />
            <h3 className={cn("m-0", OPERATOR_TYPE_SCALE.sectionTitle)}>{OPERATOR_HOME_REVIEW_ARCHITECTURE_CARD_TITLE}</h3>
            <p className={cn("m-0", OPERATOR_TYPE_SCALE.helper, "text-al-text-secondary")}>
              {OPERATOR_HOME_REVIEW_ARCHITECTURE_CARD_BODY}
            </p>
          </div>
          <ReviewStartLoadingButton
            variant="primary"
            size="sm"
            className="h-8 w-fit"
            idleLabel={OPERATOR_HOME_REVIEW_ARCHITECTURE_CTA}
            loadingLabel={navigation.loadingLabel}
            isLoading={navigation.isNavigating && selectedPath === "review-architecture"}
            onClick={startReviewArchitecture}
            data-testid="operator-home-review-architecture-cta"
          />
        </article>
      </div>

      {navigation.showStagedPanel && navigation.activeStageId !== null ? (
        <ReviewStartStagedProgress
          stages={navigation.stages}
          activeStageId={navigation.activeStageId}
          headline={REVIEW_START_PREPARING_LABEL}
          testId="operator-home-review-start-progress"
        />
      ) : null}

      {navigation.error !== null ? <ReviewStartInlineError message={navigation.error} /> : null}
    </div>
  );
}
