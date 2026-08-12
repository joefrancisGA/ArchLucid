"use client";

import type { ReactElement } from "react";
import { useCallback, useId, useLayoutEffect, useState } from "react";
import { ChevronDown } from "lucide-react";

import { useNavCommittedArchitectureReview } from "@/components/OperatorNavAuthorityProvider";
import { OperatorHomeCardSectionTitle } from "@/components/operator-home/OperatorHomeCardSectionTitle";
import { OperatorHomeWorkspaceMetricsSummary } from "@/components/operator-home/OperatorHomeWorkspaceMetricsSummary";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useFinishSetupReadinessContext } from "@/hooks/use-finish-setup-readiness-context";
import { useLiveOperatorHomeRunsDashboard } from "@/hooks/use-live-operator-home-runs-dashboard";
import type { OperatorHomeRunsDashboardModel } from "@/app/(operator)/_sections/operator-home-runs-dashboard-model";
import {
  OPERATOR_HOME_DISCLOSURE_STORAGE_KEYS,
  readOperatorHomeDisclosureExpanded,
  writeOperatorHomeDisclosureExpanded,
} from "@/lib/operator/operator-home-disclosure-storage";
import { deriveOperatorHomeWorkspaceMetrics } from "@/lib/operator/operator-home-workspace-metrics";
import {
  OPERATOR_CARD,
  OPERATOR_LAYOUT,
  OPERATOR_LINK,
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
  const hasCommittedArchitectureReview = useNavCommittedArchitectureReview();
  const detailsPanelId = useId();
  const setupReadiness = useFinishSetupReadinessContext();
  const runsDashboard = useLiveOperatorHomeRunsDashboard(props.runsDashboard);
  const [hydrated, setHydrated] = useState(false);
  const [detailsExpanded, setDetailsExpanded] = useState(false);

  useLayoutEffect(() => {
    setDetailsExpanded(
      readOperatorHomeDisclosureExpanded(OPERATOR_HOME_DISCLOSURE_STORAGE_KEYS.readinessDetails, false),
    );
    setHydrated(true);
  }, []);

  const persistDetailsExpanded = useCallback((nextExpanded: boolean) => {
    setDetailsExpanded(nextExpanded);
    writeOperatorHomeDisclosureExpanded(OPERATOR_HOME_DISCLOSURE_STORAGE_KEYS.readinessDetails, nextExpanded);
  }, []);

  if (!hasCommittedArchitectureReview) {
    return null;
  }

  const workspaceMetrics = deriveOperatorHomeWorkspaceMetrics(
    runsDashboard.items,
    runsDashboard.totalCount,
  );
  const showDetailsExpanded = hydrated ? detailsExpanded : false;
  const detailsToggleLabel = showDetailsExpanded ? "Hide metrics details" : "View details";
  // TB-1037: details (delta / zero evidence) stay collapsed away until reviews exist.
  const showDetailsToggle = workspaceMetrics.hasReviews;

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
      <OperatorHomeCardSectionTitle id="operator-home-workspace-metrics-heading">
        {WORKSPACE_METRICS_SECTION_TITLE}
      </OperatorHomeCardSectionTitle>

      <OperatorHomeWorkspaceMetricsSummary
        variant="primary"
        runsDashboard={runsDashboard}
        setupReadyCount={setupReadiness.readyCount}
        setupTotalCount={setupReadiness.totalCount}
        setupReadinessLoading={setupReadiness.phase === "loading"}
      />

      {showDetailsToggle ? (
        <Collapsible open={showDetailsExpanded} onOpenChange={persistDetailsExpanded}>
          <CollapsibleTrigger asChild>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className={cn(
                "mt-1 h-auto gap-1 px-0 py-1 hover:bg-transparent",
                OPERATOR_LINK.optional,
              )}
              aria-expanded={showDetailsExpanded}
              aria-controls={detailsPanelId}
              data-testid="operator-home-workspace-metrics-details-toggle"
            >
              <span>{detailsToggleLabel}</span>
              <ChevronDown
                className={cn(
                  "h-3.5 w-3.5 shrink-0 transition-transform",
                  showDetailsExpanded ? "rotate-180" : "rotate-0",
                )}
                aria-hidden
              />
            </Button>
          </CollapsibleTrigger>

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
      ) : null}
    </section>
  );
}
