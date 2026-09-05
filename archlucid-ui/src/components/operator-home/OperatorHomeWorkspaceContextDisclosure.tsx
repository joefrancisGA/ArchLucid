"use client";

import type { ReactElement } from "react";
import { useCallback, useId, useLayoutEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { DisclosureTriangleIndicator } from "@/components/DisclosureTriangleIndicator";
import { useNavCommittedArchitectureReview } from "@/components/operator/OperatorNavAuthorityProvider";
import { OperatorHomeCardSectionTitle } from "@/components/operator-home/OperatorHomeCardSectionTitle";
import { OperatorHomeWorkspaceMetricsSummary } from "@/components/operator-home/OperatorHomeWorkspaceMetricsSummary";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useFinishSetupReadinessContext } from "@/hooks/use-finish-setup-readiness-context";
import { useLiveOperatorHomeRunsDashboard } from "@/hooks/use-live-operator-home-runs-dashboard";
import type { OperatorHomeRunsDashboardModel } from "@/app/(operator)/_sections/operator-home-runs-dashboard-model";
import {
  collapseAriaLabel,
  expandAriaLabel,
  OPERATOR_HOME_DISCLOSURE_STORAGE_KEYS,
  readOperatorHomeDisclosureExpanded,
  writeOperatorHomeDisclosureExpanded,
} from "@/lib/operator/operator-home-disclosure-storage";
import {
  homeWorkspaceDetailsHrefFromSearch,
  parseHomeWorkspaceDetailsOpenFromSearch,
} from "@/lib/operator-home/home-workspace-details-url";
import { deriveOperatorHomeWorkspaceMetrics } from "@/lib/operator/operator-home-workspace-metrics";
import {
  OPERATOR_CARD,
  OPERATOR_LAYOUT,
  OPERATOR_SURFACE_CARD_CLASS,
} from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

import { OperatorHomeDeltaPanel, OperatorHomeWorkspaceStatusPanel } from "./OperatorHomeDeferredPanels";

type OperatorHomeWorkspaceContextDisclosureProps = {
  readonly showWorkspaceStatus: boolean;
  readonly runsDashboard: OperatorHomeRunsDashboardModel;
};

const WORKSPACE_METRICS_SECTION_TITLE = "Workspace metrics and status";

/** Operator home workspace metrics: compact summary always visible; delta/status panels behind details. */
export function OperatorHomeWorkspaceContextDisclosure(
  props: OperatorHomeWorkspaceContextDisclosureProps,
): ReactElement | null {
  const router = useRouter();
  const pathname = usePathname() ?? "/";
  const searchParams = useSearchParams();
  const homeWorkspaceDetailsOpenParam = searchParams.get("homeWorkspaceDetailsOpen");
  const hasCommittedArchitectureReview = useNavCommittedArchitectureReview();
  const detailsPanelId = useId();
  const setupReadiness = useFinishSetupReadinessContext();
  const runsDashboard = useLiveOperatorHomeRunsDashboard(props.runsDashboard);
  const [hydrated, setHydrated] = useState(false);
  const [detailsExpanded, setDetailsExpandedState] = useState(false);

  const syncDetailsExpandedToUrl = useCallback(
    (open: boolean) => {
      router.replace(homeWorkspaceDetailsHrefFromSearch(searchParams.toString(), open, pathname), {
        scroll: false,
      });
    },
    [pathname, router, searchParams],
  );

  const persistDetailsExpanded = useCallback(
    (nextExpanded: boolean) => {
      setDetailsExpandedState(nextExpanded);
      writeOperatorHomeDisclosureExpanded(OPERATOR_HOME_DISCLOSURE_STORAGE_KEYS.readinessDetails, nextExpanded);
      syncDetailsExpandedToUrl(nextExpanded);
    },
    [syncDetailsExpandedToUrl],
  );

  useLayoutEffect(() => {
    const fromUrl = parseHomeWorkspaceDetailsOpenFromSearch(homeWorkspaceDetailsOpenParam);

    if (fromUrl) {
      setDetailsExpandedState(true);
      setHydrated(true);

      return;
    }

    setDetailsExpandedState(
      readOperatorHomeDisclosureExpanded(OPERATOR_HOME_DISCLOSURE_STORAGE_KEYS.readinessDetails, false),
    );
    setHydrated(true);
  }, [homeWorkspaceDetailsOpenParam]);

  if (!hasCommittedArchitectureReview) {
    return null;
  }

  const workspaceMetrics = deriveOperatorHomeWorkspaceMetrics(
    runsDashboard.items,
    runsDashboard.totalCount,
  );
  const showDetailsExpanded = hydrated ? detailsExpanded : false;
  const detailsToggleLabel = showDetailsExpanded
    ? collapseAriaLabel(WORKSPACE_METRICS_SECTION_TITLE)
    : expandAriaLabel(WORKSPACE_METRICS_SECTION_TITLE);
  // TB-1037: details (delta / zero evidence) stay collapsed away until reviews exist.
  const showDetailsToggle = workspaceMetrics.hasReviews;

  const sectionHeading =
    showDetailsToggle ? (
      <div className="flex items-center gap-2">
        <CollapsibleTrigger asChild>
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="h-7 w-7 shrink-0 text-neutral-900 hover:text-neutral-700 dark:text-neutral-100 dark:hover:text-neutral-200"
            aria-expanded={showDetailsExpanded}
            aria-controls={detailsPanelId}
            aria-label={detailsToggleLabel}
            data-testid="operator-home-workspace-metrics-details-toggle"
          >
            <DisclosureTriangleIndicator className={cn(showDetailsExpanded ? "rotate-90" : "rotate-0")} />
          </Button>
        </CollapsibleTrigger>
        <OperatorHomeCardSectionTitle id="operator-home-workspace-metrics-heading">
          {WORKSPACE_METRICS_SECTION_TITLE}
        </OperatorHomeCardSectionTitle>
      </div>
    ) : (
      <OperatorHomeCardSectionTitle id="operator-home-workspace-metrics-heading">
        {WORKSPACE_METRICS_SECTION_TITLE}
      </OperatorHomeCardSectionTitle>
    );

  const primaryMetricsSummary = (
    <OperatorHomeWorkspaceMetricsSummary
      variant="primary"
      runsDashboard={runsDashboard}
      setupReadyCount={setupReadiness.readyCount}
      setupTotalCount={setupReadiness.totalCount}
      setupReadinessLoading={setupReadiness.phase === "loading"}
    />
  );

  return (
    <section
      data-testid="operator-home-workspace-context"
      aria-labelledby="operator-home-workspace-metrics-heading"
      className={cn(
        OPERATOR_SURFACE_CARD_CLASS,
        OPERATOR_CARD.body,
        "border-neutral-200/80 bg-neutral-50/40 dark:border-neutral-800 dark:bg-neutral-950/30",
        OPERATOR_LAYOUT.sectionHeadingStack,
      )}
    >
      {showDetailsToggle ? (
        <Collapsible open={showDetailsExpanded} onOpenChange={persistDetailsExpanded}>
          {sectionHeading}
          {primaryMetricsSummary}
          <CollapsibleContent id={detailsPanelId} data-testid="operator-home-workspace-metrics-details">
            <div className="space-y-4 border-t border-neutral-200/80 pt-3 dark:border-neutral-800">
              <OperatorHomeWorkspaceMetricsSummary
                variant="secondary"
                runsDashboard={runsDashboard}
                setupReadyCount={setupReadiness.readyCount}
                setupTotalCount={setupReadiness.totalCount}
                setupReadinessLoading={setupReadiness.phase === "loading"}
              />
              <OperatorHomeDeltaPanel />
              {props.showWorkspaceStatus ? <OperatorHomeWorkspaceStatusPanel /> : null}
            </div>
          </CollapsibleContent>
        </Collapsible>
      ) : (
        <>
          {sectionHeading}
          {primaryMetricsSummary}
        </>
      )}
    </section>
  );
}
