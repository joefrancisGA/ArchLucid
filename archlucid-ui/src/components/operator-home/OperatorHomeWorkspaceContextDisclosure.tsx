"use client";

import type { ReactElement } from "react";
import { useCallback, useId, useLayoutEffect, useState } from "react";

import { OperatorHomeCardSectionTitle } from "@/components/operator-home/OperatorHomeCardSectionTitle";
import { OperatorHomeWorkspaceMetricsSummary } from "@/components/operator-home/OperatorHomeWorkspaceMetricsSummary";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useFinishSetupReadinessContext } from "@/hooks/use-finish-setup-readiness-context";
import type { OperatorHomeRunsDashboardModel } from "@/app/(operator)/_sections/operator-home-runs-dashboard-model";
import {
  OPERATOR_HOME_DISCLOSURE_STORAGE_KEYS,
  readOperatorHomeDisclosureExpanded,
  writeOperatorHomeDisclosureExpanded,
} from "@/lib/operator-home-disclosure-storage";
import { OPERATOR_CARD, OPERATOR_LAYOUT, OPERATOR_SURFACE_CARD_CLASS, OPERATOR_TYPE_SCALE } from "@/lib/design-tokens";
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
): ReactElement {
  const detailsPanelId = useId();
  const setupReadiness = useFinishSetupReadinessContext();
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

  const showDetailsExpanded = hydrated ? detailsExpanded : false;
  const detailsToggleLabel = showDetailsExpanded ? "Hide metrics details" : "View details";

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
        runsDashboard={props.runsDashboard}
        setupReadyCount={setupReadiness.readyCount}
        setupTotalCount={setupReadiness.totalCount}
        setupReadinessLoading={setupReadiness.phase === "loading"}
      />

      <Collapsible open={showDetailsExpanded} onOpenChange={persistDetailsExpanded}>
        <CollapsibleTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className={cn(
              "mt-1 h-auto px-0 py-1 text-neutral-600 hover:bg-transparent hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100",
              OPERATOR_TYPE_SCALE.helper,
            )}
            aria-expanded={showDetailsExpanded}
            aria-controls={detailsPanelId}
            data-testid="operator-home-workspace-metrics-details-toggle"
          >
            {detailsToggleLabel}
          </Button>
        </CollapsibleTrigger>

        <CollapsibleContent id={detailsPanelId} data-testid="operator-home-workspace-metrics-details">
          <div className="space-y-4 border-t border-neutral-200/80 pt-3 dark:border-neutral-800">
            <OperatorHomeDeltaPanel />
            {props.showWorkspaceStatus ? <OperatorHomeWorkspaceStatusPanel /> : null}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </section>
  );
}
