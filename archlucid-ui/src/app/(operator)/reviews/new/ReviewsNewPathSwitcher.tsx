"use client";

import { cn } from "@/lib/utils";
import dynamic from "next/dynamic";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";

import { OperatorPageContainer } from "@/components/OperatorPageContainer";
import { NewRunWizardSkeleton } from "@/components/skeletons/NewRunWizardSkeleton";
import { InlineGuidanceText } from "@/components/InlineGuidanceText";
import { REVIEWS_NEW_PATH_HINTS } from "@/lib/reviews-new-path-copy";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { readBuyerCtoDemoTourActive } from "@/lib/buyer-cto-demo-tour";

import { ReviewsNewDeferredIntentCallout } from "./ReviewsNewDeferredIntentCallout";
import { ReviewIntakeInvalidTemplateCallout } from "@/components/review-intake/ReviewIntakeInvalidTemplateCallout";
import { resolveReviewIntakeExampleTemplateFromSearchParams } from "@/lib/operator-home-example-request";
import {
  persistActivePath,
  readStoredActivePath,
  type ReviewsNewActivePath,
} from "./reviews-new-path-switcher-state";

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

const REVIEWS_NEW_PATH_TABS: readonly { id: ReviewsNewActivePath; label: string }[] = [
  { id: "quick-review", label: "Quick start" },
  { id: "guided-intake", label: "Guided intake" },
  { id: "detailed", label: "Templates and imports" },
] as const;

function reviewsNewPathTabId(path: ReviewsNewActivePath): string {
  return `reviews-new-path-tab-${path}`;
}

function reviewsNewPathPanelId(path: ReviewsNewActivePath): string {
  return `reviews-new-path-panel-${path}`;
}

function reviewsNewPathTabTestId(path: ReviewsNewActivePath): string {
  switch (path) {
    case "quick-review":
      return "reviews-new-path-quick";
    case "guided-intake":
      return "reviews-new-path-guided-intake";
    case "detailed":
      return "reviews-new-path-detailed";
    default: {
      const exhaustive: never = path;
      return exhaustive;
    }
  }
}

/**
 * Path switcher at the top of `/reviews/new`: quick start, guided intake, or templates wizard.
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
      {ready ? (
        <nav aria-label="Review creation path">
          <div
            className="-mb-px flex flex-wrap gap-1 overflow-x-auto border-b border-neutral-200 dark:border-neutral-800"
            role="tablist"
            data-testid="reviews-new-path-toggle"
          >
            {REVIEWS_NEW_PATH_TABS.map((tab) => {
              const selected = activePath === tab.id;

              return (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  id={reviewsNewPathTabId(tab.id)}
                  aria-selected={selected}
                  aria-controls={reviewsNewPathPanelId(tab.id)}
                  data-testid={reviewsNewPathTabTestId(tab.id)}
                  onClick={() => {
                    selectPath(tab.id);
                  }}
                  className={cn(
                    "shrink-0 px-4 py-2 font-medium leading-none outline-none transition-colors",
                    OPERATOR_TYPOGRAPHY.body,
                    "-mb-px border-b-2",
                    selected
                      ? "border-teal-600 text-teal-700 dark:border-teal-400 dark:text-teal-300"
                      : "border-transparent text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100",
                  )}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </nav>
      ) : null}
      {ready ? (
        <p className={cn("m-0", OPERATOR_TYPOGRAPHY.helper)} data-testid="reviews-new-path-hint">
          <InlineGuidanceText text={REVIEWS_NEW_PATH_HINTS[activePath]} />
        </p>
      ) : (
        <p className={OPERATOR_TYPOGRAPHY.helper}>Loading…</p>
      )}
      {ready ? (
        <div
          role="tabpanel"
          id={reviewsNewPathPanelId(activePath)}
          aria-labelledby={reviewsNewPathTabId(activePath)}
          data-testid="reviews-new-path-panel"
        >
          {activePath === "quick-review" ? (
            <FirstPilotIntakeWizard />
          ) : activePath === "guided-intake" ? (
            <SocraticIntakeWizard />
          ) : (
            <NewRunWizardClient />
          )}
        </div>
      ) : null}
    </OperatorPageContainer>
  );
}
