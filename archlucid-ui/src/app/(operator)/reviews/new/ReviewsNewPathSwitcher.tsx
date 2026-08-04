"use client";

import { cn } from "@/lib/utils";
import dynamic from "next/dynamic";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";

import { OperatorPageContainer } from "@/components/OperatorPageContainer";
import { NewRunWizardSkeleton } from "@/components/skeletons/NewRunWizardSkeleton";
import { InlineGuidanceText } from "@/components/InlineGuidanceText";
import { CREATE_ARCHITECTURE_INTENT } from "@/lib/architecture-workflow-intent";
import {
  REVIEWS_NEW_CREATE_ARCHITECTURE_PATH_HINTS,
  REVIEWS_NEW_CREATE_ARCHITECTURE_PATH_TAB_LABELS,
  REVIEWS_NEW_PATH_HINTS,
} from "@/lib/reviews-new-path-copy";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { readBuyerCtoDemoTourActive } from "@/lib/buyer-cto-demo-tour";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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
 * Path switcher at the top of `/architecture/reviews/new`: quick start, guided intake, or templates wizard.
 * Wizards load on demand so the initial `/architecture/reviews/new` chunk stays smaller.
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
  const isCreateArchitectureIntent =
    searchParams?.get("intent")?.trim().toLowerCase() === CREATE_ARCHITECTURE_INTENT;
  const pathTabLabels = isCreateArchitectureIntent
    ? REVIEWS_NEW_CREATE_ARCHITECTURE_PATH_TAB_LABELS
    : Object.fromEntries(REVIEWS_NEW_PATH_TABS.map((tab) => [tab.id, tab.label])) as Record<
        ReviewsNewActivePath,
        string
      >;
  const pathHints = isCreateArchitectureIntent
    ? REVIEWS_NEW_CREATE_ARCHITECTURE_PATH_HINTS
    : REVIEWS_NEW_PATH_HINTS;

  useEffect(() => {
    const activeTour = readBuyerCtoDemoTourActive();
    const pathQuery = searchParams?.get("path")?.trim().toLowerCase() ?? "";

    if (pathQuery === "quick-review") {
      setActivePath("quick-review");
      persistActivePath("quick-review");
    } else if (pathQuery === "guided-intake") {
      setActivePath("guided-intake");
      persistActivePath("guided-intake");
    } else if (pathQuery === "detailed") {
      setActivePath("detailed");
      persistActivePath("detailed");
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
        <Tabs
          value={activePath}
          onValueChange={(next) => {
            selectPath(next as ReviewsNewActivePath);
          }}
        >
          <TabsList
            aria-label="Review creation path"
            data-testid="reviews-new-path-toggle"
            className="overflow-x-auto overflow-y-hidden"
          >
            {REVIEWS_NEW_PATH_TABS.map((tab) => (
              <TabsTrigger
                key={tab.id}
                value={tab.id}
                data-testid={reviewsNewPathTabTestId(tab.id)}
                className="shrink-0"
              >
                {pathTabLabels[tab.id]}
              </TabsTrigger>
            ))}
          </TabsList>
          <p className={cn("m-0", OPERATOR_TYPOGRAPHY.helper)} data-testid="reviews-new-path-hint">
            <InlineGuidanceText text={pathHints[activePath]} />
          </p>
          <TabsContent value="quick-review" className="pt-0" data-testid="reviews-new-path-panel">
            <FirstPilotIntakeWizard />
          </TabsContent>
          <TabsContent value="guided-intake" className="pt-0" data-testid="reviews-new-path-panel">
            <SocraticIntakeWizard />
          </TabsContent>
          <TabsContent value="detailed" className="pt-0" data-testid="reviews-new-path-panel">
            <NewRunWizardClient />
          </TabsContent>
        </Tabs>
      ) : (
        <p className={OPERATOR_TYPOGRAPHY.helper}>Loading…</p>
      )}
    </OperatorPageContainer>
  );
}
