import { CREATE_ARCHITECTURE_LABEL } from "@/lib/architecture-workflow-labels";
import { cn } from "@/lib/utils";
import Link from "next/link";

import { OperatorPageContainer } from "@/components/OperatorPageContainer";
import { Button } from "@/components/ui/button";
import { GettingStartedTrialSection } from "@/components/GettingStartedTrialSection";
import { InAppHelpLink } from "@/components/InAppHelpLink";
import { CorePilotChecklist } from "@/components/CorePilotChecklist";
import { BUYER_ONBOARDING_PAGE_LEAD, BUYER_ONBOARDING_PAGE_TITLE, BUYER_ONBOARDING_WALKTHROUGH_HELP_LINK } from "@/lib/buyer-polish-copy";
import { SHOWCASE_STATIC_DEMO_RUN_ID } from "@/lib/showcase-static-demo";
import { OPERATOR_TYPOGRAPHY, OPERATOR_LINK } from "@/lib/design-tokens";

import { OnboardingOptionalSetupSection } from "./OnboardingOptionalSetupSection";
import type { OnboardingPageViewModel } from "./onboarding-page-view-model";

type OnboardingPageViewProps = {
  model: OnboardingPageViewModel;
};

const sampleReviewHref = `/reviews/${encodeURIComponent(SHOWCASE_STATIC_DEMO_RUN_ID)}`;

/**
 * Canonical onboarding orientation: primary first-review path, single progress checklist,
 * and collapsed optional setup for ROI, workspace, and CLI tooling.
 */
export function OnboardingPageView({ model }: OnboardingPageViewProps) {
  const { fromRegistration } = model;

  return (
    <OperatorPageContainer variant="reading" className="space-y-8">
      <header className="max-w-prose space-y-3" data-testid="onboarding-hero">
        <h1 className={`m-0 ${OPERATOR_TYPOGRAPHY.pageTitle}`}>
          {BUYER_ONBOARDING_PAGE_TITLE}
        </h1>
        <p className={`m-0 ${OPERATOR_TYPOGRAPHY.helper}`}>
          {BUYER_ONBOARDING_PAGE_LEAD}
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <Button asChild size="sm" variant="default">
            <Link href="/reviews/new">{CREATE_ARCHITECTURE_LABEL}</Link>
          </Button>
          <Button asChild size="sm" variant="outline">
            <Link href={sampleReviewHref}>Open sample review</Link>
          </Button>
        </div>
      </header>

      {fromRegistration ? <GettingStartedTrialSection fromRegistrationQuery={fromRegistration} /> : null}

      <section aria-labelledby="onboarding-progress-heading" className="space-y-3" data-testid="onboarding-progress">
        <h2 id="onboarding-progress-heading" className={`m-0 ${OPERATOR_TYPOGRAPHY.sectionTitle}`}>
          Progress
        </h2>
        <p className={cn("m-0 max-w-prose", OPERATOR_TYPOGRAPHY.helper)}>
          Follow this guided path to create and commit your first review package.
        </p>
        <CorePilotChecklist variant="full" />
        <div className="flex flex-wrap items-center gap-2">
          <InAppHelpLink helpSlug="first-pilot-path" label={BUYER_ONBOARDING_WALKTHROUGH_HELP_LINK} />
          <Link className={OPERATOR_LINK.inline} href="/faq">
            Product FAQ
          </Link>
          <InAppHelpLink helpSlug="specialty-walkthroughs" label="Choose a review template" variant="text" />
        </div>
      </section>

      <OnboardingOptionalSetupSection />
    </OperatorPageContainer>
  );
}
