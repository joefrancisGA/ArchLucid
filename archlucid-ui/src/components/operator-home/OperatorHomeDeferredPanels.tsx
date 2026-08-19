"use client";

import dynamic from "next/dynamic";

import type { OperatorHomeRunsDashboardModel } from "@/app/(operator)/_sections/operator-home-runs-dashboard-model";
import { cn } from "@/lib/utils";
import { OPERATOR_SURFACE_CARD_CLASS } from "@/lib/design-tokens";

const RunsDashboardPanel = dynamic(
  () => import("@/components/operator-home/RunsDashboardPanel").then((module) => module.RunsDashboardPanel),
  {
    ssr: false,
    loading: () => (
      <div
        className={cn(OPERATOR_SURFACE_CARD_CLASS, "h-40 animate-pulse p-4")}
        role="status"
        aria-label="Loading recent reviews"
        data-testid="home-block-runs-dashboard-loading"
      />
    ),
  },
);

const BeforeAfterDeltaPanel = dynamic(
  () => import("@/components/BeforeAfterDeltaPanel").then((module) => module.BeforeAfterDeltaPanel),
  { loading: () => null },
);

const OperatorHomeWorkspaceStatusSection = dynamic(
  () =>
    import("@/components/operator-home/OperatorHomeWorkspaceStatusSection").then(
      (module) => module.OperatorHomeWorkspaceStatusSection,
    ),
  { loading: () => null },
);

type OperatorHomeRunsPanelProps = {
  readonly hideHeading?: boolean;
  readonly initialModel?: OperatorHomeRunsDashboardModel | null;
};

export function OperatorHomeRunsPanel(props: OperatorHomeRunsPanelProps) {
  return <RunsDashboardPanel hideHeading={props.hideHeading} initialModel={props.initialModel ?? null} />;
}

export function OperatorHomeDeltaPanel() {
  return <BeforeAfterDeltaPanel />;
}

export function OperatorHomeWorkspaceStatusPanel() {
  return <OperatorHomeWorkspaceStatusSection />;
}
