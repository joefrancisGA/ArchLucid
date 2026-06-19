"use client";

import dynamic from "next/dynamic";

import { RunsDashboardPanel } from "@/components/operator-home/RunsDashboardPanel";

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
};

export function OperatorHomeRunsPanel(props: OperatorHomeRunsPanelProps) {
  return <RunsDashboardPanel hideHeading={props.hideHeading} />;
}

export function OperatorHomeDeltaPanel() {
  return <BeforeAfterDeltaPanel />;
}

export function OperatorHomeWorkspaceStatusPanel() {
  return <OperatorHomeWorkspaceStatusSection />;
}
