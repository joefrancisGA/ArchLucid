"use client";

import { cn } from "@/lib/utils";
import dynamic from "next/dynamic";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";

import { OperatorPageContainer } from "@/components/OperatorPageContainer";
import { NewRunWizardSkeleton } from "@/components/skeletons/NewRunWizardSkeleton";
import { InlineGuidanceText } from "@/components/InlineGuidanceText";
import { Button } from "@/components/ui/button";
import {
  REVIEWS_NEW_BACK_TO_QUICK_START_CTA,
  REVIEWS_NEW_GUIDED_QUESTIONS_LABEL,
  REVIEWS_NEW_PATH_HINTS,
} from "@/lib/reviews-new-path-copy";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { readBuyerCtoDemoTourActive } from "@/lib/buyer-cto-demo-tour";
import { useCorePilotCommitContextQuery } from "@/hooks/use-core-pilot-commit-context-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { ReviewsNewDeferredIntentCallout } from "./ReviewsNewDeferredIntentCallout";
import { ReviewIntakeInvalidTemplateCallout } from "@/components/review-intake/ReviewIntakeInvalidTemplateCallout";
import { resolveReviewIntakeExampleTemplateFromSearchParams } from "@/lib/operator-home-example-request";
import { ReviewsNewMoreWaysToStart } from "./ReviewsNewMoreWaysToStart";
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
  { id: "guided-intake", label: REVIEWS_NEW_GUIDED_QUESTIONS_LABEL },
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

function reviewsNewPathHref(pathname: string, path: ReviewsNewActivePath, searchParams: URLSearchParams): string {
  const next = new URLSearchParams(searchParams.toString());
  next.set("path", path);

  const query = next.toString();

  return query.length > 0 ? `${pathname}?${query}` : pathname;
}

function ReviewsNewActiveWizard(props: { readonly activePath: ReviewsNewActivePath }): React.JSX.Element {
  const { activePath } = props;

  if (activePath === "guided-intake") {
    return <SocraticIntakeWizard />;
  }

  if (activePath === "detailed") {
    return <NewRunWizardClient />;
  }

  return <FirstPilotIntakeWizard />;
}

/**
 * Path switcher at the top of `/architecture/reviews/new`: quick start, guided intake, or templates wizard.
 * Wizards load on demand so the initial `/architecture/reviews/new` chunk stays smaller.
 */
export function ReviewsNewPathSwitcher() {
  const router = useRouter();
  const pathname = usePathname() ?? "/architecture/reviews/new";
  const searchParams = useSearchParams();
  const commitContextQuery = useCorePilotCommitContextQuery();
  const baselineFirst = searchParams?.get("baseline") === "1";
  const presetGreenfield = searchParams?.get("preset") === "greenfield";
  const invalidExampleTemplateId = useMemo(
    () =>
      resolveReviewIntakeExampleTemplateFromSearchParams((key) => searchParams?.get(key) ?? null).invalidTemplateId,
    [searchParams],
  );
  const [activePath, setActivePath] = useState<ReviewsNewActivePath>("quick-review");
  const [ready, setReady] = useState(false);
  const pathTabLabels = Object.fromEntries(REVIEWS_NEW_PATH_TABS.map((tab) => [tab.id, tab.label])) as Record<
    ReviewsNewActivePath,
    string
  >;
  const pathHints = REVIEWS_NEW_PATH_HINTS;
  const hasCommittedManifest = commitContextQuery.data?.hasCommittedManifest ?? false;
  const usePrimaryPathLayout = !hasCommittedManifest;
  const shellReady = ready && !commitContextQuery.isPending;

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
    const params = new URLSearchParams(searchParams?.toString() ?? "");
    router.replace(reviewsNewPathHref(pathname, path, params), { scroll: false });
  };

  return (
    <OperatorPageContainer variant="workflow" className="space-y-5">
      <Suspense fallback={null}>
        <ReviewsNewDeferredIntentCallout />
      </Suspense>
      {invalidExampleTemplateId !== null ? (
        <ReviewIntakeInvalidTemplateCallout templateId={invalidExampleTemplateId} />
      ) : null}
      {shellReady ? (
        usePrimaryPathLayout ? (
          <div className="space-y-4" data-testid="reviews-new-primary-path-layout">
            <p
              className={cn("m-0 leading-relaxed", OPERATOR_TYPOGRAPHY.helper)}
              data-testid="reviews-new-path-hint"
            >
              <InlineGuidanceText text={pathHints[activePath]} />
            </p>
            <div className="pt-1" data-testid="reviews-new-path-panel">
              <ReviewsNewActiveWizard activePath={activePath} />
            </div>
            {activePath === "quick-review" ? (
              <ReviewsNewMoreWaysToStart onSelectPath={selectPath} />
            ) : (
              <Button
                type="button"
                variant="outline"
                size="sm"
                data-testid="reviews-new-back-to-quick-start"
                onClick={() => {
                  selectPath("quick-review");
                }}
              >
                {REVIEWS_NEW_BACK_TO_QUICK_START_CTA}
              </Button>
            )}
          </div>
        ) : (
          <Tabs
            value={activePath}
            onValueChange={(next) => {
              selectPath(next as ReviewsNewActivePath);
            }}
            className="space-y-3"
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
            <p
              className={cn("m-0 leading-relaxed", OPERATOR_TYPOGRAPHY.helper)}
              data-testid="reviews-new-path-hint"
            >
              <InlineGuidanceText text={pathHints[activePath]} />
            </p>
            <TabsContent value="quick-review" className="mt-0 pt-1" data-testid="reviews-new-path-panel">
              <FirstPilotIntakeWizard />
            </TabsContent>
            <TabsContent value="guided-intake" className="mt-0 pt-1" data-testid="reviews-new-path-panel">
              <SocraticIntakeWizard />
            </TabsContent>
            <TabsContent value="detailed" className="mt-0 pt-1" data-testid="reviews-new-path-panel">
              <NewRunWizardClient />
            </TabsContent>
          </Tabs>
        )
      ) : (
        <p className={OPERATOR_TYPOGRAPHY.helper}>Loading…</p>
      )}
    </OperatorPageContainer>
  );
}
