"use client";



import { cn } from "@/lib/utils";

import Link from "next/link";



import { GettingStartedTrialSection } from "@/components/GettingStartedTrialSection";

import { OperatorPageContainer } from "@/components/operator/OperatorPageContainer";

import { OperatorPageHeader } from "@/components/operator/OperatorPageHeader";

import { OperatorErrorCallout } from "@/components/operator/OperatorShellMessage";

import { Button } from "@/components/ui/button";

import { Skeleton } from "@/components/ui/skeleton";

import { StatusTag } from "@/components/ui/status-tag";

import {

  PageContextualHelpButton,

  PAGE_HELP_SHORT_TRIGGER_TEXT,

} from "@/components/usability/PageContextualHelpButton";

import { OperatorErrorRecoveryActions } from "@/components/usability/OperatorErrorRecoveryActions";

import { WhyDisabledCtaHint } from "@/components/usability/WhyDisabledCtaHint";

import type { WhyDisabledCtaReason } from "@/lib/why-disabled-cta";

import { useFirstReviewGuideState } from "@/hooks/use-first-review-guide-state";

import {

  BUYER_ONBOARDING_PAGE_LEAD,

  BUYER_ONBOARDING_PAGE_TITLE,

  FIRST_REVIEW_GUIDE_PROGRESS_SECTION_TITLE,

} from "@/lib/buyer/buyer-polish-copy";

import { OPERATOR_LAYOUT, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

import {
  FIRST_REVIEW_GUIDE_PATH,
  FIRST_REVIEW_GUIDE_PROGRESS_HEADING_ID,
  isFirstReviewGuideProgressDeepLinkHash,
} from "@/lib/first-review-guide-route";
import { useDeepLinkHashScroll } from "@/hooks/use-deep-link-hash-scroll";
import { FIRST_REVIEW_GUIDE_EVALUATION_SCOPE_HELPER } from "@/lib/first-review-guide-evidence-copy";



import { FirstReviewGuideProgressSummary } from "./FirstReviewGuideProgressSummary";

import { FirstReviewGuideRequiredSetupPanel } from "./FirstReviewGuideRequiredSetupPanel";

import { FirstReviewGuideSupportPanel } from "./FirstReviewGuideSupportPanel";

import { FirstReviewGuideWalkthrough } from "./FirstReviewGuideWalkthrough";

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



function FirstReviewGuideHeaderLoadingSkeleton() {

  return (

    <div className="space-y-3" data-testid="first-review-guide-header-loading">

      <Skeleton className="h-6 w-40" aria-hidden />

      <Skeleton className="h-4 w-full max-w-xl" aria-hidden />

      <div className="flex flex-wrap gap-2">

        <Skeleton className="h-9 w-36" aria-hidden />

        <Skeleton className="h-9 w-40" aria-hidden />

      </div>

    </div>

  );

}



function FirstReviewGuideContextErrorCallout(props: { readonly onRetry: () => void }) {

  return (

    <div data-testid="first-review-guide-context-error">

      <OperatorErrorCallout>

        <strong>Could not load review progress</strong>

        <p className="mt-2">Your checklist could not sync with workspace reviews. Retry when your connection is stable.</p>

        <OperatorErrorRecoveryActions helpSlug="troubleshooting" />

        <div className="mt-2">

          <Button type="button" size="sm" variant="outline" onClick={props.onRetry} data-testid="first-review-guide-retry">

            Retry

          </Button>

        </div>

      </OperatorErrorCallout>

    </div>

  );

}



export function FirstReviewGuidePageClient({ model }: FirstReviewGuidePageClientProps) {

  const guide = useFirstReviewGuideState();

  useDeepLinkHashScroll(FIRST_REVIEW_GUIDE_PROGRESS_HEADING_ID, isFirstReviewGuideProgressDeepLinkHash);

  const primaryDisabledReason: WhyDisabledCtaReason | null =

    guide.headerActions.primaryDisabledReason !== null &&

    guide.headerActions.primaryDisabledReason.trim().length > 0

      ? {

          kind: "role",

          message: guide.headerActions.primaryDisabledReason,

        }

      : null;



  return (

    <OperatorPageContainer

      variant="workflow"

      className={OPERATOR_LAYOUT.sectionStack}

      data-testid="first-review-guide-page"

    >

      <OperatorPageHeader

        navHref={FIRST_REVIEW_GUIDE_PATH}

        title={BUYER_ONBOARDING_PAGE_TITLE}

        headingLevel="h1"

        subtitle={BUYER_ONBOARDING_PAGE_LEAD}

        subtitleClassName="max-w-3xl"

        actions={<PageContextualHelpButton triggerText={PAGE_HELP_SHORT_TRIGGER_TEXT} />}

      >

        {guide.isError ? (

          <FirstReviewGuideContextErrorCallout onRetry={guide.retry} />

        ) : guide.isPending ? (

          <FirstReviewGuideHeaderLoadingSkeleton />

        ) : (

          <>

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

            <div className="flex flex-wrap items-center gap-2" data-testid="first-review-guide-primary-actions">

              {guide.headerActions.primaryDisabled ? (

                <Button

                  disabled

                  aria-describedby="first-review-guide-primary-disabled-hint"

                  data-testid="first-review-guide-primary-disabled"

                >

                  {guide.headerActions.primaryLabel}

                </Button>

              ) : (

                <Button asChild data-testid="first-review-guide-primary">

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

            <p

              className={cn("m-0 max-w-3xl", OPERATOR_TYPOGRAPHY.helper)}

              data-testid="first-review-guide-evaluation-scope"

            >

              {FIRST_REVIEW_GUIDE_EVALUATION_SCOPE_HELPER}

            </p>

            <FirstReviewGuideRequiredSetupPanel blockers={guide.requiredBlockers} />

          </>

        )}

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

            <FirstReviewGuideProgressSummary

              progress={guide.progress}

              isPending={guide.isPending}

              isError={guide.isError}

            />

          </div>

          <FirstReviewGuideWalkthrough

            steps={guide.steps}

            isPending={guide.isPending}

            isError={guide.isError}

            announceProgress={guide.hasLoadedContext}

          />

        </section>



        <FirstReviewGuideSupportPanel />

      </div>



      <OnboardingOptionalSetupSection />

    </OperatorPageContainer>

  );

}


