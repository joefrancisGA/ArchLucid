"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";
import { Sparkles } from "lucide-react";

import { CollapsibleSection } from "@/components/CollapsibleSection";
import { EmptyState } from "@/components/EmptyState";
import { OperatorApiProblem } from "@/components/OperatorApiProblem";
import { Button } from "@/components/ui/button";
import { OPERATOR_LAYOUT, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { enterpriseMutationControlDisabledTitle } from "@/lib/enterprise-controls-context-copy";

import { RecommendationLearningEnterpriseGuide } from "./RecommendationLearningEnterpriseGuide";
import { RecommendationLearningHowItWorksCard } from "./RecommendationLearningHowItWorksCard";
import { RecommendationLearningSummaryPanel } from "./RecommendationLearningSummaryPanel";
import { RecommendationLearningWorkflowSteps } from "./RecommendationLearningWorkflowSteps";
import type { RecommendationLearningPageViewModel } from "./recommendation-learning-page-view-model";
import {
  RECOMMENDATION_LEARNING_BUILD_FIRST_ACTION,
  RECOMMENDATION_LEARNING_EMPTY_DESCRIPTION,
  RECOMMENDATION_LEARNING_EMPTY_TITLE,
  RECOMMENDATION_LEARNING_INSUFFICIENT_DESCRIPTION,
  RECOMMENDATION_LEARNING_INSUFFICIENT_TITLE,
  RECOMMENDATION_LEARNING_LEARN_MORE_ACTION,
  RECOMMENDATION_LEARNING_MUTATION_DENIED,
  RECOMMENDATION_LEARNING_PAGE_SUBTITLE,
  RECOMMENDATION_LEARNING_PAGE_TITLE,
  RECOMMENDATION_LEARNING_RECALCULATE_ACTION,
  RECOMMENDATION_LEARNING_RECALCULATE_HELP,
  RECOMMENDATION_LEARNING_REFRESH_ACTION,
} from "./recommendation-learning-copy";
import { profileHasInsufficientHistory } from "./recommendation-learning-display";

type Props = {
  readonly model: RecommendationLearningPageViewModel;
};

export function RecommendationLearningPageView(props: Props) {
  const m = props.model;
  const hasProfile = m.profile !== null;
  const insufficientHistory = hasProfile && profileHasInsufficientHistory(m.profile);
  const hasMeaningfulProfile = hasProfile && !insufficientHistory;
  const isBusy = m.loading || m.isRebuilding;

  return (
    <div className={`max-w-5xl ${OPERATOR_LAYOUT.sectionStack}`}>
      <div className={OPERATOR_LAYOUT.sectionHeadingStack}>
        <h2 className={cn("mt-0", OPERATOR_TYPOGRAPHY.sectionTitle)}>{RECOMMENDATION_LEARNING_PAGE_TITLE}</h2>
        <p className={cn("max-w-3xl leading-relaxed text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
          {RECOMMENDATION_LEARNING_PAGE_SUBTITLE}
        </p>
      </div>

      {hasMeaningfulProfile ? (
        <div className="flex flex-wrap gap-3">
          <Button type="button" onClick={() => void m.loadLatest()} disabled={isBusy}>
            {RECOMMENDATION_LEARNING_REFRESH_ACTION}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => void m.rebuild()}
            disabled={isBusy || !m.canMutate}
            title={m.canMutate ? undefined : enterpriseMutationControlDisabledTitle}
          >
            {RECOMMENDATION_LEARNING_RECALCULATE_ACTION}
          </Button>
        </div>
      ) : null}

      {!m.canMutate && hasMeaningfulProfile ? (
        <p className={cn("text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>{RECOMMENDATION_LEARNING_MUTATION_DENIED}</p>
      ) : null}

      {hasMeaningfulProfile ? (
        <p className={cn("text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>{RECOMMENDATION_LEARNING_RECALCULATE_HELP}</p>
      ) : null}

      {m.failure !== null ? (
        <div role="alert">
          <OperatorApiProblem
            problem={m.failure.problem}
            fallbackMessage={m.failure.message}
            correlationId={m.failure.correlationId}
          />
        </div>
      ) : null}

      {isBusy ? (
        <p className={cn("text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)} role="status" aria-live="polite">
          {m.isRebuilding ? "Recalculating recommendation learning…" : "Refreshing learning summary…"}
        </p>
      ) : null}

      {!isBusy && m.failure === null && !hasProfile ? (
        <EmptyState
          icon={Sparkles}
          title={RECOMMENDATION_LEARNING_EMPTY_TITLE}
          description={RECOMMENDATION_LEARNING_EMPTY_DESCRIPTION}
        />
      ) : null}

      {!isBusy && m.failure === null && insufficientHistory ? (
        <EmptyState
          icon={Sparkles}
          title={RECOMMENDATION_LEARNING_INSUFFICIENT_TITLE}
          description={RECOMMENDATION_LEARNING_INSUFFICIENT_DESCRIPTION}
        />
      ) : null}

      {!hasMeaningfulProfile ? (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,18rem)_1fr]">
          <RecommendationLearningWorkflowSteps />
          <div className="space-y-4">
            <div className="flex flex-wrap gap-3">
              <Button
                type="button"
                onClick={() => void m.rebuild()}
                disabled={isBusy || !m.canMutate}
                title={m.canMutate ? undefined : enterpriseMutationControlDisabledTitle}
              >
                {RECOMMENDATION_LEARNING_BUILD_FIRST_ACTION}
              </Button>
              <Button type="button" variant="outline" asChild>
                <Link href="#how-learning-works">{RECOMMENDATION_LEARNING_LEARN_MORE_ACTION}</Link>
              </Button>
            </div>
            {!m.canMutate ? (
              <p className={cn("text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
                {RECOMMENDATION_LEARNING_MUTATION_DENIED}
              </p>
            ) : null}
            {insufficientHistory ? (
              <p className={cn("text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
                {RECOMMENDATION_LEARNING_RECALCULATE_HELP}
              </p>
            ) : null}
          </div>
        </div>
      ) : null}

      {hasMeaningfulProfile && m.profile !== null ? (
        <>
          <RecommendationLearningSummaryPanel profile={m.profile} />

          <CollapsibleSection
            title="Recommendation model weights"
            defaultOpen={false}
            sectionTestId="recommendation-learning-weight-details"
          >
            <div className={cn("space-y-4 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
              <div>
                <h4 className={cn("mb-2", OPERATOR_TYPOGRAPHY.cardTitle)}>Category weights</h4>
                <ul className="m-0 list-disc pl-5">
                  {Object.entries(m.profile.categoryWeights).map(([key, value]) => (
                    <li key={key}>
                      {key}: {value.toFixed(2)}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h4 className={cn("mb-2", OPERATOR_TYPOGRAPHY.cardTitle)}>Urgency weights</h4>
                <ul className="m-0 list-disc pl-5">
                  {Object.entries(m.profile.urgencyWeights).map(([key, value]) => (
                    <li key={key}>
                      {key}: {value.toFixed(2)}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h4 className={cn("mb-2", OPERATOR_TYPOGRAPHY.cardTitle)}>Signal type weights</h4>
                <ul className="m-0 list-disc pl-5">
                  {Object.entries(m.profile.signalTypeWeights).map(([key, value]) => (
                    <li key={key}>
                      {key}: {value.toFixed(2)}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </CollapsibleSection>
        </>
      ) : null}

      <RecommendationLearningHowItWorksCard />
      <RecommendationLearningEnterpriseGuide />
    </div>
  );
}
