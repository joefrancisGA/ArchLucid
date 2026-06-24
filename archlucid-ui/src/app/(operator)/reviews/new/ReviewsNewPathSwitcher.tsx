"use client";

import dynamic from "next/dynamic";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";

import { OperatorPageContainer } from "@/components/OperatorPageContainer";
import { NewRunWizardSkeleton } from "@/components/skeletons/NewRunWizardSkeleton";
import { Button } from "@/components/ui/button";
import { readBuyerCtoDemoTourActive } from "@/lib/buyer-cto-demo-tour";
import { REVIEWS_NEW_PATH_HINTS } from "@/lib/reviews-new-path-copy";
import { useCorePilotCommitPresentationContext } from "@/lib/use-core-pilot-commit-presentation-context";

import { ReviewsNewDeferredIntentCallout } from "./ReviewsNewDeferredIntentCallout";
import { ReviewIntakeInvalidTemplateCallout } from "@/components/review-intake/ReviewIntakeInvalidTemplateCallout";
import { resolveReviewIntakeExampleTemplateFromSearchParams } from "@/lib/operator-home-example-request";
import {
  persistActivePath,
  readStoredActivePath,
  type ReviewsNewActivePath,
} from "./reviews-new-path-switcher-state";

const QuickReviewWizard = dynamic(
  () => import("./QuickReviewWizard").then((module) => module.QuickReviewWizard),
  { loading: () => <NewRunWizardSkeleton /> },
);

const FirstPilotIntakeWizard = dynamic(
  () => import("./FirstPilotIntakeWizard").then((module) => module.FirstPilotIntakeWizard),
  { loading: () => <NewRunWizardSkeleton /> },
);

const SocraticIntakeWizard = dynamic(
  () => import("./SocraticIntakeWizard").then((module) => module.SocraticIntakeWizard),
  { loading: () => <NewRunWizardSkeleton /> },
);

const NewRunWizardClient = dynamic(
  () => import("./NewRunWizardClient").then((module) => module.NewRunWizardClient),
  { loading: () => <NewRunWizardSkeleton /> },
);

/**
 * Path switcher at the top of `/reviews/new`: guided intake (default), quick review, or templates wizard.
 * Wizards load on demand so the initial `/reviews/new` chunk stays smaller.
 */
export function ReviewsNewPathSwitcher() {
  const searchParams = useSearchParams();
  const baselineFirst = searchParams?.get("baseline") === "1";
  const presetGreenfield = searchParams?.get("preset") === "greenfield";
  const invalidExampleTemplateId = useMemo(
    () =>
      resolveReviewIntakeExampleTemplateFromSearchParams((key) => searchParams?.get(key) ?? null).invalidTemplateId,
    [searchParams],
  );
  const [activePath, setActivePath] = useState<ReviewsNewActivePath>("quick-review");
  const [ready, setReady] = useState(false);
  const [showMoreIntakeOptions, setShowMoreIntakeOptions] = useState(false);
  const commitContext = useCorePilotCommitPresentationContext();

  const forceDetailedPath = baselineFirst;
  const isFirstRunTenant = !commitContext.hasCommittedManifest;
  const showPathSwitcher = forceDetailedPath || !isFirstRunTenant || showMoreIntakeOptions;

  useEffect(() => {
    const activeTour = readBuyerCtoDemoTourActive();
    const pathQuery = searchParams?.get("path")?.trim().toLowerCase() ?? "";

    if (pathQuery === "quick-review") {
      setActivePath("quick-review");
      persistActivePath("quick-review");
    } else if (baselineFirst) {
      setActivePath("detailed");
      persistActivePath("detailed");
    } else if (presetGreenfield) {
      setActivePath("quick-review");
      persistActivePath("quick-review");
    } else if (activeTour) {
      setActivePath("quick-review");
      persistActivePath("quick-review");
    } else {
      setActivePath(readStoredActivePath());
    }

    setReady(true);
  }, [baselineFirst, presetGreenfield, searchParams]);

  const selectPath = (path: ReviewsNewActivePath) => {
    setActivePath(path);
    persistActivePath(path);
  };

  return (
    <OperatorPageContainer variant="workflow" className="space-y-3">
      <Suspense fallback={null}>
        <ReviewsNewDeferredIntentCallout />
      </Suspense>
      {invalidExampleTemplateId !== null ? (
        <ReviewIntakeInvalidTemplateCallout templateId={invalidExampleTemplateId} />
      ) : null}
      {ready && showPathSwitcher ? (
        <div
          className="flex flex-wrap gap-2 rounded-lg border border-neutral-200/80 bg-neutral-50/80 p-3 dark:border-neutral-800 dark:bg-neutral-900/40"
          role="tablist"
          aria-label="Review creation path"
          data-testid="reviews-new-path-toggle"
        >
          <Button
            type="button"
            role="tab"
            aria-selected={activePath === "quick-review"}
            variant={activePath === "quick-review" ? "default" : "outline"}
            className="min-w-[10rem]"
            onClick={() => {
              selectPath("quick-review");
            }}
            data-testid="reviews-new-path-quick"
          >
            Quick start
          </Button>
          <Button
            type="button"
            role="tab"
            aria-selected={activePath === "guided-intake"}
            variant={activePath === "guided-intake" ? "default" : "outline"}
            className="min-w-[10rem]"
            onClick={() => {
              selectPath("guided-intake");
            }}
            data-testid="reviews-new-path-guided-intake"
          >
            Guided intake
          </Button>
          <Button
            type="button"
            role="tab"
            aria-selected={activePath === "detailed"}
            variant={activePath === "detailed" ? "default" : "outline"}
            className="min-w-[10rem]"
            onClick={() => {
              selectPath("detailed");
            }}
            data-testid="reviews-new-path-detailed"
          >
            Templates and imports
          </Button>
        </div>
      ) : null}
      {ready && isFirstRunTenant && !showPathSwitcher ? (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-neutral-200/80 bg-neutral-50/80 px-3 py-2 dark:border-neutral-800 dark:bg-neutral-900/40">
          <p className="m-0 text-sm text-neutral-700 dark:text-neutral-300">
            Streamlined first review — upload one diagram to start. Policy packs apply automatically.
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              setShowMoreIntakeOptions(true);
            }}
            data-testid="reviews-new-more-intake-options"
          >
            More intake options
          </Button>
        </div>
      ) : null}
      {ready && showPathSwitcher ? (
        <p className="m-0 text-sm text-neutral-600 dark:text-neutral-400" data-testid="reviews-new-path-hint">
          {REVIEWS_NEW_PATH_HINTS[activePath]}
        </p>
      ) : null}
      {ready ? null : (
        <p className="text-sm text-neutral-500 dark:text-neutral-400">Loading…</p>
      )}
      {!ready ? null : activePath === "quick-review" || (isFirstRunTenant && !showMoreIntakeOptions && !forceDetailedPath) ? (
        <FirstPilotIntakeWizard />
      ) : activePath === "guided-intake" ? (
        <SocraticIntakeWizard />
      ) : (
        <NewRunWizardClient />
      )}
    </OperatorPageContainer>
  );
}
