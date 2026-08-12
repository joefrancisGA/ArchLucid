"use client";

import { cn } from "@/lib/utils";
import dynamic from "next/dynamic";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";

import { InlineGuidanceText } from "@/components/InlineGuidanceText";
import { NewRunWizardSkeleton } from "@/components/skeletons/NewRunWizardSkeleton";
import { Button } from "@/components/ui/button";
import { isAcceleratorPackId } from "@/lib/accelerator-wizard-presets";
import {
  REVIEWS_NEW_BACK_TO_QUICK_START_CTA,
  REVIEWS_NEW_GUIDED_QUESTIONS_LABEL,
  REVIEWS_NEW_PATH_HINTS,
  REVIEWS_NEW_QUICK_START_TAB_LABEL,
} from "@/lib/reviews-new-path-copy";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { readBuyerCtoDemoTourActive } from "@/lib/buyer/buyer-cto-demo-tour";
import { useCorePilotCommitContextQuery } from "@/hooks/use-core-pilot-commit-context-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { ReviewsNewDeferredIntentCallout } from "./ReviewsNewDeferredIntentCallout";
import { SpecimenDeliverablePreviewCallout } from "@/components/usability/SpecimenDeliverablePreviewCallout";
import { ReviewIntakeInvalidTemplateCallout } from "@/components/review-intake/ReviewIntakeInvalidTemplateCallout";
import { resolveReviewIntakeExampleTemplateFromSearchParams } from "@/lib/operator/operator-home-example-request";
import { ReviewsNewMoreWaysToStart } from "./ReviewsNewMoreWaysToStart";
import { ReviewsNewJobChooserSection } from "./ReviewsNewJobChooserSection";
import { ReviewsNewOwnEvidenceStart } from "./ReviewsNewOwnEvidenceStart";
import {
  buildReviewsNewPathHref,
  persistActivePath,
  resolveInitialReviewsNewActivePath,
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
  { id: "quick-review", label: REVIEWS_NEW_QUICK_START_TAB_LABEL },
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

function ReviewsNewActiveWizard(props: { readonly activePath: ReviewsNewActivePath }): React.JSX.Element {
  const { activePath } = props;

  if (activePath === "guided-intake") {
    return <SocraticIntakeWizard />;
  }

  if (activePath === "detailed") {
    return <NewRunWizardClient embeddedInPathSwitcher />;
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
  const hasExampleTemplateIntent = useMemo(() => {
    const resolution = resolveReviewIntakeExampleTemplateFromSearchParams((key) => searchParams?.get(key) ?? null);

    return resolution.template !== null;
  }, [searchParams]);
  const [activePath, setActivePath] = useState<ReviewsNewActivePath>("quick-review");
  const [ready, setReady] = useState(false);
  const [suppressAcceleratorStartIntent, setSuppressAcceleratorStartIntent] = useState(false);
  const pathTabLabels = Object.fromEntries(REVIEWS_NEW_PATH_TABS.map((tab) => [tab.id, tab.label])) as Record<
    ReviewsNewActivePath,
    string
  >;
  const pathHints = REVIEWS_NEW_PATH_HINTS;
  const hasCommittedManifest = commitContextQuery.data?.hasCommittedManifest ?? false;
  const usePrimaryPathLayout = !hasCommittedManifest;
  const shellReady = ready && !commitContextQuery.isPending;
  const acceleratorPackId = searchParams?.get("accelerator")?.trim() ?? "";
  const hasAcceleratorStartIntent =
    !suppressAcceleratorStartIntent &&
    (baselineFirst ||
      presetGreenfield ||
      hasExampleTemplateIntent ||
      isAcceleratorPackId(acceleratorPackId));
  const showFirstRunStartOptions =
    usePrimaryPathLayout && activePath === "quick-review" && !hasAcceleratorStartIntent;

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
    <div className="space-y-5" data-testid="reviews-new-path-switcher">
      <Suspense fallback={null}>
        <ReviewsNewDeferredIntentCallout />
      </Suspense>
      {invalidExampleTemplateId !== null ? (
        <ReviewIntakeInvalidTemplateCallout templateId={invalidExampleTemplateId} />
      ) : null}
      {shellReady ? (
        usePrimaryPathLayout ? (
          <div className="space-y-4" data-testid="reviews-new-primary-path-layout">
            <SpecimenDeliverablePreviewCallout />
            {showFirstRunStartOptions ? (
              <>
                <ReviewsNewOwnEvidenceStart />
                <ReviewsNewJobChooserSection />
                <ReviewsNewMoreWaysToStart onSelectPath={selectPath} />
              </>
            ) : (
              <>
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
              </>
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
            <SpecimenDeliverablePreviewCallout />
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
              <NewRunWizardClient embeddedInPathSwitcher />
            </TabsContent>
          </Tabs>
        )
      ) : (
        <p className={OPERATOR_TYPOGRAPHY.helper}>Loading…</p>
      )}
    </div>
  );
}
