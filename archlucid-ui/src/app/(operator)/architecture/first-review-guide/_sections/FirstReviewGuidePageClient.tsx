"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";

import { FirstReviewGuideFirstArchitectureReviewVocabularyRail } from "@/components/FirstReviewGuideFirstArchitectureReviewVocabularyRail";
import { GettingStartedTrialSection } from "@/components/GettingStartedTrialSection";
import { OperatorPageContainer } from "@/components/operator/OperatorPageContainer";
import { OperatorPageHeader } from "@/components/operator/OperatorPageHeader";
import { Button } from "@/components/ui/button";
import { StatusTag } from "@/components/ui/status-tag";
import { PageContextualHelpButton } from "@/components/usability/PageContextualHelpButton";
import { WhyDisabledCtaHint } from "@/components/usability/WhyDisabledCtaHint";
import type { WhyDisabledCtaReason } from "@/lib/why-disabled-cta";
import { useFirstReviewGuideState } from "@/hooks/use-first-review-guide-state";
import {
  BUYER_ONBOARDING_PAGE_LEAD,
  BUYER_ONBOARDING_PAGE_TITLE,
  FIRST_REVIEW_GUIDE_PROGRESS_SECTION_TITLE,
} from "@/lib/buyer/buyer-polish-copy";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

import { FirstReviewGuideProgressSummary } from "./FirstReviewGuideProgressSummary";
import { FirstReviewGuideRequiredSetupPanel } from "./FirstReviewGuideRequiredSetupPanel";
import { FirstReviewGuideSupportPanel } from "./FirstReviewGuideSupportPanel";
import { FirstReviewGuideNextActionCard, FirstReviewGuideWalkthrough } from "./FirstReviewGuideWalkthrough";
import { OnboardingOptionalSetupSection } from "./OnboardingOptionalSetupSection";
import type { OnboardingPageViewModel } from "./onboarding-page-view-model";

type FirstReviewGuidePageClientProps = {
  readonly model: OnboardingPageViewModel;
};

function readinessStatusKind(
  kind: ReturnType<typeof useFirstReviewGuideState>["readiness"]["kind"],
): "ready" | "in-progress" | "needs-attention" | "neutral" {
  switch (kind) {
    case "ready-to-start":
      return "ready";
    case "in-progress":
      return "in-progress";
    case "completed":
      return "ready";
    case "required-setup-remains":
      return "needs-attention";
    default: {
      const exhaustive: never = kind;

      return exhaustive;
    }
  }
}

export function FirstReviewGuidePageClient({ model }: FirstReviewGuidePageClientProps) {
  const guide = useFirstReviewGuideState();
  const nextStep = guide.steps.find((step) => step.isNextStep) ?? null;
  const primaryDisabledReason: WhyDisabledCtaReason | null =
    guide.headerActions.primaryDisabledReason !== null &&
    guide.headerActions.primaryDisabledReason.trim().length > 0
      ? {
          kind: "role",
          message: guide.headerActions.primaryDisabledReason,
        }
      : null;

  return (
    <OperatorPageContainer variant="reading" className="mx-auto max-w-[1100px] space-y-8">
      <OperatorPageHeader
        title={BUYER_ONBOARDING_PAGE_TITLE}
        headingLevel="h1"
        subtitle={BUYER_ONBOARDING_PAGE_LEAD}
        subtitleClassName="max-w-3xl"
        actions={<PageContextualHelpButton />}
      >
        <FirstReviewGuideFirstArchitectureReviewVocabularyRail currentSurfaceId="first-review-guide" />
        <div
          className="space-y-2"
          data-testid="first-review-guide-readiness"
          aria-live="polite"
        >
          <div className="flex flex-wrap items-center gap-2">
            <StatusTag kind={readinessStatusKind(guide.readiness.kind)} label={guide.readiness.headline} />
          </div>
          {guide.readiness.detail !== null ? (
            <p className={cn("m-0 max-w-3xl", OPERATOR_TYPOGRAPHY.helper)}>{guide.readiness.detail}</p>
          ) : null}
        </div>
        <FirstReviewGuideRequiredSetupPanel blockers={guide.requiredBlockers} />
        <div className="flex flex-wrap items-center gap-2">
          {guide.headerActions.primaryDisabled ? (
            <Button
              size="sm"
              disabled
              aria-describedby="first-review-guide-primary-disabled-hint"
              data-testid="first-review-guide-primary-disabled"
            >
              {guide.headerActions.primaryLabel}
            </Button>
          ) : (
            <Button size="sm" asChild data-testid="first-review-guide-primary">
              <Link href={guide.headerActions.primaryHref}>{guide.headerActions.primaryLabel}</Link>
            </Button>
          )}
          {guide.headerActions.secondaryHref !== null ? (
            <Button size="sm" variant="outline" asChild data-testid="first-review-guide-secondary">
              <Link href={guide.headerActions.secondaryHref}>{guide.headerActions.secondaryLabel}</Link>
            </Button>
          ) : null}
        </div>
        <WhyDisabledCtaHint
          id="first-review-guide-primary-disabled-hint"
          reason={primaryDisabledReason}
          testId="first-review-guide-primary-disabled-hint"
          className="max-w-3xl"
        />
      </OperatorPageHeader>

      {model.fromRegistration ? <GettingStartedTrialSection fromRegistrationQuery={model.fromRegistration} /> : null}

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(260px,320px)] lg:items-start">
        <section
          aria-labelledby="first-review-guide-progress-heading"
          className="space-y-4"
          data-testid="onboarding-progress"
        >
          <div className="space-y-2">
            <h2 id="first-review-guide-progress-heading" className={cn("m-0", OPERATOR_TYPOGRAPHY.sectionTitle)}>
              {FIRST_REVIEW_GUIDE_PROGRESS_SECTION_TITLE}
            </h2>
            <FirstReviewGuideProgressSummary progress={guide.progress} />
          </div>
          <FirstReviewGuideWalkthrough steps={guide.steps} isPending={guide.isPending} />
        </section>

        <div className="space-y-4">
          <FirstReviewGuideNextActionCard
            step={nextStep}
            readyToFinalize={guide.readyToFinalize}
            finalizeHref={guide.latestRunHref}
            canExecute={guide.canExecute}
          />
          <FirstReviewGuideSupportPanel />
        </div>
      </div>

      <OnboardingOptionalSetupSection />
    </OperatorPageContainer>
  );
}
