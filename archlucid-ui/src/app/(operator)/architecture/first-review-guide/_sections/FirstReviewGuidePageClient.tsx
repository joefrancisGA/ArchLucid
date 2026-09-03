"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";

import { GettingStartedTrialSection } from "@/components/GettingStartedTrialSection";
import { EvidenceOrientationClaimAndSourcesStrip } from "@/components/evidence-orientation/EvidenceOrientationClaimAndSourcesStrip";
import { EVIDENCE_SOURCES_STYLE } from "@/components/evidence-orientation/evidence-orientation-styles";
import { OperatorPageContainer } from "@/components/operator/OperatorPageContainer";
import { OperatorPageHeader } from "@/components/operator/OperatorPageHeader";
import { OperatorErrorCallout } from "@/components/operator/OperatorShellMessage";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusTag } from "@/components/ui/status-tag";
import { OperatorErrorRecoveryActions } from "@/components/usability/OperatorErrorRecoveryActions";
import { WhyDisabledCtaHint } from "@/components/usability/WhyDisabledCtaHint";
import type { WhyDisabledCtaReason } from "@/lib/why-disabled-cta";
import { useFirstReviewGuideState } from "@/hooks/use-first-review-guide-state";
import {
  BUYER_ONBOARDING_PAGE_LEAD,
  BUYER_ONBOARDING_PAGE_TITLE,
  FIRST_REVIEW_GUIDE_PROGRESS_SECTION_TITLE,
} from "@/lib/buyer/buyer-polish-copy";
import { OPERATOR_LAYOUT, OPERATOR_SHORT_HELPER_MEASURE_CLASS, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { HELP_PAGE_LAYOUT } from "@/lib/help/help-page-layout";
import {
  FIRST_REVIEW_GUIDE_FIRST_VIEWPORT_ID,
  FIRST_REVIEW_GUIDE_PRIMARY_CONTENT_ID,
  FIRST_REVIEW_GUIDE_SKIP_LINK_LABEL,
  FIRST_REVIEW_GUIDE_SKIP_TARGET_ID,
} from "@/lib/first-review-guide-page-copy";
import {
  FIRST_REVIEW_GUIDE_PATH,
  FIRST_REVIEW_GUIDE_PROGRESS_HEADING_ID,
  isFirstReviewGuideProgressDeepLinkHash,
} from "@/lib/first-review-guide-route";
import { useDeepLinkHashScroll } from "@/hooks/use-deep-link-hash-scroll";
import {
  FIRST_REVIEW_GUIDE_CLAIM_DISCIPLINE,
  FIRST_REVIEW_GUIDE_EVALUATION_SCOPE_HELPER,
  FIRST_REVIEW_GUIDE_SOURCES,
  FIRST_REVIEW_GUIDE_SOURCES_INTRO,
} from "@/lib/first-review-guide-evidence-copy";
import { formatConversationListDate } from "@/lib/locale-datetime";

import { FirstReviewGuideProgressSummary } from "./FirstReviewGuideProgressSummary";
import { FirstReviewGuideRequiredSetupPanel } from "./FirstReviewGuideRequiredSetupPanel";
import { FirstReviewGuideSupportPanel } from "./FirstReviewGuideSupportPanel";
import { FirstReviewGuideWalkthrough } from "./FirstReviewGuideWalkthrough";
import { OnboardingOptionalSetupSection } from "./OnboardingOptionalSetupSection";
import { OnboardingSampleReviewShortcut } from "@/components/usability/OnboardingSampleReviewShortcut";
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

function shouldShowEvaluationScopeHelper(
  kind: ReturnType<typeof useFirstReviewGuideState>["readiness"]["kind"],
): boolean {
  return kind === "ready-to-start" || kind === "in-progress";
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

function sealedRecordFinalizedOnLabel(finalizedOnUtc: string | null): string | null {
  if (finalizedOnUtc === null) {
    return null;
  }

  const trimmed = finalizedOnUtc.trim();

  if (trimmed.length === 0 || !Number.isFinite(Date.parse(trimmed))) {
    return null;
  }

  return formatConversationListDate(trimmed);
}

function FirstReviewGuideSealedRecordProvenance(props: {
  readonly sealedReviewRecord: NonNullable<ReturnType<typeof useFirstReviewGuideState>["sealedReviewRecord"]>;
}) {
  const { sealedReviewRecord } = props;
  const recordTitle = sealedReviewRecord.displayName ?? "Architecture review";
  const finalizedOn = sealedRecordFinalizedOnLabel(sealedReviewRecord.finalizedOnUtc);

  return (
    <div className="space-y-1" data-testid="first-review-guide-sealed-record-provenance">
      <p className={cn("m-0", OPERATOR_SHORT_HELPER_MEASURE_CLASS, OPERATOR_TYPOGRAPHY.helper)}>
        <span className="font-medium text-neutral-900 dark:text-neutral-100">{recordTitle}</span>
        {finalizedOn !== null ? ` — finalized ${finalizedOn}` : null}
      </p>
      <details className={cn("text-neutral-600 dark:text-neutral-400", OPERATOR_SHORT_HELPER_MEASURE_CLASS)}>
        <summary className={cn("cursor-pointer", OPERATOR_TYPOGRAPHY.helper)}>Technical identifiers</summary>
        <p className={cn("m-0 mt-1 font-mono", OPERATOR_TYPOGRAPHY.helper)}>Record ID: {sealedReviewRecord.runId}</p>
        {sealedReviewRecord.finalizedByUserId !== null ? (
          <p className={cn("m-0 mt-1 font-mono", OPERATOR_TYPOGRAPHY.helper)}>
            Created by: {sealedReviewRecord.finalizedByUserId}
          </p>
        ) : null}
      </details>
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
      <a
        href={`#${FIRST_REVIEW_GUIDE_SKIP_TARGET_ID}`}
        className={HELP_PAGE_LAYOUT.technicalReferenceSkipLink}
      >
        {FIRST_REVIEW_GUIDE_SKIP_LINK_LABEL}
      </a>

      <OperatorPageHeader
        navHref={FIRST_REVIEW_GUIDE_PATH}
        title={BUYER_ONBOARDING_PAGE_TITLE}
        headingLevel="h1"
        subtitle={BUYER_ONBOARDING_PAGE_LEAD}
      />

      <div
        id={FIRST_REVIEW_GUIDE_PRIMARY_CONTENT_ID}
        data-testid={FIRST_REVIEW_GUIDE_PRIMARY_CONTENT_ID}
        className={cn("scroll-mt-24", OPERATOR_LAYOUT.sectionStack)}
      >
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(260px,320px)] lg:items-start">
        <div className={OPERATOR_LAYOUT.sectionStack}>
          <div
            id={FIRST_REVIEW_GUIDE_FIRST_VIEWPORT_ID}
            data-testid={FIRST_REVIEW_GUIDE_FIRST_VIEWPORT_ID}
            className={OPERATOR_LAYOUT.sectionStack}
          >
            {guide.isError ? (
              <FirstReviewGuideContextErrorCallout onRetry={guide.retry} />
            ) : guide.isPending ? (
              <FirstReviewGuideHeaderLoadingSkeleton />
            ) : (
              <>
                <div className="space-y-2" data-testid="first-review-guide-readiness">
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusTag kind={readinessStatusKind(guide.readiness.kind)} label={guide.readiness.headline} />
                  </div>

                  {guide.readiness.detail !== null ? (
                    <p className={cn("m-0", OPERATOR_SHORT_HELPER_MEASURE_CLASS, OPERATOR_TYPOGRAPHY.helper)}>
                      {guide.readiness.detail}
                    </p>
                  ) : null}

                  {guide.sealedReviewRecord !== null ? (
                    <FirstReviewGuideSealedRecordProvenance sealedReviewRecord={guide.sealedReviewRecord} />
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
                    <Button asChild variant="primary" data-testid="first-review-guide-primary">
                      <Link href={guide.headerActions.primaryHref}>{guide.headerActions.primaryLabel}</Link>
                    </Button>
                  )}

                  {guide.headerActions.secondaryHref !== null ? (
                    <Button variant="outline" asChild data-testid="first-review-guide-secondary">
                      <Link href={guide.headerActions.secondaryHref}>{guide.headerActions.secondaryLabel}</Link>
                    </Button>
                  ) : null}
                </div>

                <WhyDisabledCtaHint
                  id="first-review-guide-primary-disabled-hint"
                  reason={primaryDisabledReason}
                  testId="first-review-guide-primary-disabled-hint"
                  className={OPERATOR_SHORT_HELPER_MEASURE_CLASS}
                />

                {shouldShowEvaluationScopeHelper(guide.readiness.kind) ? (
                  <p
                    className={cn("m-0", OPERATOR_SHORT_HELPER_MEASURE_CLASS, OPERATOR_TYPOGRAPHY.helper)}
                    data-testid="first-review-guide-evaluation-scope"
                  >
                    {FIRST_REVIEW_GUIDE_EVALUATION_SCOPE_HELPER}
                  </p>
                ) : null}

                <FirstReviewGuideRequiredSetupPanel blockers={guide.requiredBlockers} />
              </>
            )}

          {guide.sealedReviewRecord === null ? <OnboardingSampleReviewShortcut /> : null}

          {model.fromRegistration ? <GettingStartedTrialSection fromRegistrationQuery={model.fromRegistration} /> : null}

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
              progressPhase={guide.progress.phase}
            />
          </section>
          </div>
        </div>

        <FirstReviewGuideSupportPanel
          className={OPERATOR_LAYOUT.stickyAsideTop}
          sealedRunId={guide.sealedReviewRecord?.runId ?? null}
        />
      </div>

      <EvidenceOrientationClaimAndSourcesStrip
        slug="first-review-guide"
        claim={FIRST_REVIEW_GUIDE_CLAIM_DISCIPLINE}
        sourcesIntro={FIRST_REVIEW_GUIDE_SOURCES_INTRO}
        sources={FIRST_REVIEW_GUIDE_SOURCES}
        claimElement="aside"
        sourcesStyle={EVIDENCE_SOURCES_STYLE.operatorMuted}
      />

      <OnboardingOptionalSetupSection />
      </div>
    </OperatorPageContainer>
  );
}
