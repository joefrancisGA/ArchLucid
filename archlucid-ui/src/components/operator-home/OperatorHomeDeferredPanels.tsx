"use client";

import type { ComponentType } from "react";

import type { OperatorHomeRunsDashboardModel } from "@/app/(operator)/_sections/operator-home-runs-dashboard-model";
import { OPERATOR_SURFACE_CARD_CLASS } from "@/lib/design-tokens";
import { createDeferredComponentFromManifest } from "@/lib/operator/load-deferred-chunk-from-manifest";
import { cn } from "@/lib/utils";

function runsDashboardDeferredLoading(): React.JSX.Element {
  return (
    <div
      className={cn(OPERATOR_SURFACE_CARD_CLASS, "h-40 animate-pulse p-4")}
      role="status"
      aria-label="Loading recent reviews"
      data-testid="home-block-runs-dashboard-loading"
    />
  );
}

const RunsDashboardPanelDeferred: ComponentType<{
  readonly hideHeading?: boolean;
  readonly initialModel?: OperatorHomeRunsDashboardModel | null;
}> = createDeferredComponentFromManifest("operator-home-runs-dashboard", {
  loadingWrapper: () => runsDashboardDeferredLoading(),
});

const BeforeAfterDeltaPanelDeferred = createDeferredComponentFromManifest("operator-home-before-after-delta", {
  suppressLoading: true,
});

const OperatorHomeWorkspaceStatusSectionDeferred = createDeferredComponentFromManifest(
  "operator-home-workspace-status",
  { suppressLoading: true },
);

type OperatorHomeRunsPanelProps = {
  readonly hideHeading?: boolean;
  readonly initialModel?: OperatorHomeRunsDashboardModel | null;
};

export function OperatorHomeRunsPanel(props: OperatorHomeRunsPanelProps) {
  return (
    <RunsDashboardPanelDeferred hideHeading={props.hideHeading} initialModel={props.initialModel ?? null} />
  );
}

export function OperatorHomeDeltaPanel() {
  return <BeforeAfterDeltaPanelDeferred />;
}

export function OperatorHomeWorkspaceStatusPanel() {
  return <OperatorHomeWorkspaceStatusSectionDeferred />;
}
