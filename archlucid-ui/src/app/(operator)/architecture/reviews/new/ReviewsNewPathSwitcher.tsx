"use client";

import { cn } from "@/lib/utils";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useMemo, useState } from "react";

import { InlineGuidanceText } from "@/components/InlineGuidanceText";
import { CollapsibleSection } from "@/components/CollapsibleSection";
import { isAcceleratorPackId } from "@/lib/accelerator-wizard-presets";
import {
  ACCELERATOR_JOB_CHOOSER_HEADING,
  ACCELERATOR_JOB_CHOOSER_LEAD,
} from "@/lib/accelerator-chooser-start-copy";
import {
  REVIEWS_NEW_BACK_TO_QUICK_START_CTA,
  REVIEWS_NEW_PATH_HINTS,
} from "@/lib/reviews-new-path-copy";
import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { readBuyerCtoDemoTourActive } from "@/lib/buyer/buyer-cto-demo-tour";

import { ReviewsNewDeferredIntentCallout } from "./ReviewsNewDeferredIntentCallout";
import { SpecimenDeliverablePreviewCallout } from "@/components/usability/SpecimenDeliverablePreviewCallout";
import { ReviewIntakeInvalidTemplateCallout } from "@/components/review-intake/ReviewIntakeInvalidTemplateCallout";
import { resolveReviewIntakeExampleTemplateFromSearchParams } from "@/lib/operator/operator-home-example-request";
import { ReviewsNewMoreWaysToStart } from "./ReviewsNewMoreWaysToStart";
import { ReviewsNewJobChooserSection } from "./ReviewsNewJobChooserSection";
import { ReviewsNewOwnEvidenceStart } from "./ReviewsNewOwnEvidenceStart";
import { useCorePilotCommitContextQuery } from "@/hooks/use-core-pilot-commit-context-query";
import { useReviewsNewSpecimenPreviewPresentation } from "./use-reviews-new-specimen-preview-presentation";
import {
  parseReviewsNewReturningJobChooserOpenFromSearch,
  reviewsNewReturningJobChooserDisclosureHrefFromSearch,
} from "@/lib/reviews/reviews-new-returning-job-chooser-disclosure-url";
import {
  buildReviewsNewPathHref,
  persistActivePath,
  resolveInitialReviewsNewActivePath,
  type ReviewsNewActivePath,
} from "./reviews-new-path-switcher-state";
import {
  ReviewsNewFirstPilotIntakeWizardDeferred,
  ReviewsNewNewRunWizardClientDeferred,
  ReviewsNewSocraticIntakeWizardDeferred,
} from "./reviews-new-path-switcher-deferred-chunks";

function ReviewsNewActiveWizard(props: { readonly activePath: ReviewsNewActivePath }): React.JSX.Element {
  const { activePath } = props;

  if (activePath === "guided-intake") {
    return <ReviewsNewSocraticIntakeWizardDeferred />;
  }

  if (activePath === "detailed") {
    return <ReviewsNewNewRunWizardClientDeferred embeddedInPathSwitcher />;
  }

  return <ReviewsNewFirstPilotIntakeWizardDeferred />;
}

/**
 * Path switcher at the top of `/architecture/reviews/new`: quick start, guided intake, or templates wizard.
 * Wizards load on demand so the initial `/architecture/reviews/new` chunk stays smaller.
 */
export function ReviewsNewPathSwitcher() {
  const router = useRouter();
  const pathname = usePathname() ?? "/architecture/reviews/new";
  const searchParams = useSearchParams();
  const baselineFirst = searchParams?.get("baseline") === "1";
  const presetGreenfield = searchParams?.get("preset") === "greenfield";
  const invalidExampleTemplateId = useMemo(
    () =>
      resolveReviewIntakeExampleTemplateFromSearchParams((key) => searchParams?.get(key) ?? null).invalidTemplateId,
    [searchParams],
  );
  const hasExampleTemplateIntent = useMemo(() => {
    const resolution = resolveReviewIntakeExampleTemplateFromSearchParams((key) => searchParams?.get(key) ?? null);

    return resolution.template !== null;
  }, [searchParams]);
  const [activePath, setActivePath] = useState<ReviewsNewActivePath>("quick-review");
  const [ready, setReady] = useState(false);
  const [suppressAcceleratorStartIntent, setSuppressAcceleratorStartIntent] = useState(false);
  const pathHints = REVIEWS_NEW_PATH_HINTS;
  const shellReady = ready;
  const acceleratorPackId = searchParams?.get("accelerator")?.trim() ?? "";
  const hasAcceleratorStartIntent =
    !suppressAcceleratorStartIntent &&
    (baselineFirst ||
      presetGreenfield ||
      hasExampleTemplateIntent ||
      isAcceleratorPackId(acceleratorPackId));
  const showJobChooserStartOptions = activePath === "quick-review" && !hasAcceleratorStartIntent;
  const specimenPreviewPresentation = useReviewsNewSpecimenPreviewPresentation();
  const commitQuery = useCorePilotCommitContextQuery();
  const isReturningTenant =
    commitQuery.isPending || commitQuery.data?.hasCommittedManifest === true;
  const reviewsNewReturningJobChooserOpenParam = searchParams?.get("reviewsNewReturningJobChooserOpen");
  const [returningJobChooserOpen, setReturningJobChooserOpenState] = useState(() =>
    parseReviewsNewReturningJobChooserOpenFromSearch(reviewsNewReturningJobChooserOpenParam),
  );

  const syncReturningJobChooserOpenToUrl = useCallback(
    (open: boolean) => {
      router.replace(
        reviewsNewReturningJobChooserDisclosureHrefFromSearch(searchParams?.toString() ?? "", open, pathname),
        { scroll: false },
      );
    },
    [pathname, router, searchParams],
  );

  const setReturningJobChooserOpen = useCallback(
    (open: boolean) => {
      setReturningJobChooserOpenState(open);
      syncReturningJobChooserOpenToUrl(open);
    },
    [syncReturningJobChooserOpenToUrl],
  );

  useEffect(() => {
    setReturningJobChooserOpenState(
      parseReviewsNewReturningJobChooserOpenFromSearch(reviewsNewReturningJobChooserOpenParam),
    );
  }, [reviewsNewReturningJobChooserOpenParam]);

  useEffect(() => {
    const activeTour = readBuyerCtoDemoTourActive();
    const pathQuery = searchParams?.get("path")?.trim() ?? "";
    const initialPath = resolveInitialReviewsNewActivePath({
      pathQuery,
      baselineFirst,
      presetGreenfield,
      activeTour,
    });

    setActivePath(initialPath);
    persistActivePath(initialPath);
    setReady(true);
  }, [baselineFirst, presetGreenfield, searchParams]);

  const selectPath = (path: ReviewsNewActivePath) => {
    setActivePath(path);
    persistActivePath(path);
    const params = new URLSearchParams(searchParams?.toString() ?? "");

    if (path === "quick-review") {
      setSuppressAcceleratorStartIntent(true);
      params.delete("baseline");
      params.delete("accelerator");
      params.delete("preset");
      params.delete("template");
    }

    router.replace(buildReviewsNewPathHref(pathname, path, params), { scroll: false });
  };

  return (
    <div className="space-y-4" data-testid="reviews-new-path-switcher">
      <Suspense fallback={null}>
        <ReviewsNewDeferredIntentCallout />
      </Suspense>
      {invalidExampleTemplateId !== null ? (
        <ReviewIntakeInvalidTemplateCallout templateId={invalidExampleTemplateId} />
      ) : null}
      {shellReady ? (
        <div className="space-y-4" data-testid="reviews-new-primary-path-layout">
          {specimenPreviewPresentation.showProminentSection ? <SpecimenDeliverablePreviewCallout /> : null}
          {showJobChooserStartOptions ? (
            <>
              <ReviewsNewOwnEvidenceStart />
              {isReturningTenant ? (
                <CollapsibleSection
                  title={ACCELERATOR_JOB_CHOOSER_HEADING}
                  summaryLine={ACCELERATOR_JOB_CHOOSER_LEAD}
                  open={returningJobChooserOpen}
                  onToggle={setReturningJobChooserOpen}
                  sectionTestId="reviews-new-returning-job-chooser"
                >
                  <ReviewsNewJobChooserSection hideHeading />
                </CollapsibleSection>
              ) : (
                <ReviewsNewJobChooserSection />
              )}
              <ReviewsNewMoreWaysToStart onSelectPath={selectPath} />
            </>
          ) : (
            <>
              {activePath !== "quick-review" ? (
                <button
                  type="button"
                  className={cn("m-0 h-auto cursor-pointer border-0 bg-transparent p-0", OPERATOR_LINK.nav)}
                  data-testid="reviews-new-back-to-quick-start"
                  onClick={() => {
                    selectPath("quick-review");
                  }}
                >
                  {REVIEWS_NEW_BACK_TO_QUICK_START_CTA}
                </button>
              ) : null}
              <p
                className={cn("m-0 leading-relaxed", OPERATOR_TYPOGRAPHY.helper)}
                data-testid="reviews-new-path-hint"
              >
                <InlineGuidanceText text={pathHints[activePath]} />
              </p>
              <div data-testid="reviews-new-path-panel">
                <ReviewsNewActiveWizard activePath={activePath} />
              </div>
              {activePath === "quick-review" ? (
                <ReviewsNewMoreWaysToStart onSelectPath={selectPath} />
              ) : null}
            </>
          )}
        </div>
      ) : (
        <p className={OPERATOR_TYPOGRAPHY.helper}>Loading…</p>
      )}
    </div>
  );
}
