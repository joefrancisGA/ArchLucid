"use client";

import dynamic from "next/dynamic";
import type { ComponentType } from "react";

import { DeferredChunkLoading } from "@/components/ui/deferred-chunk-loading";

import type { AlertsInboxDialogsProps } from "@/components/alerts/AlertsInboxDialogs";
import type { AlertsGovernanceContextPanelProps } from "@/components/alerts/AlertsGovernanceContextPanel";

function alertsInboxDeferredLoading(label: string): React.JSX.Element {
  return (
    <DeferredChunkLoading
      label={label}
      variant="context"
      testId="alerts-inbox-deferred-chunk-loading"
    />
  );
}

/** Triage + action-loop dialogs — off inbox First Load JS (wave 11). */
export const AlertsInboxDialogsDeferred: ComponentType<AlertsInboxDialogsProps> = dynamic(
  () => import("@/components/alerts/AlertsInboxDialogs").then((module) => module.AlertsInboxDialogs),
  { ssr: false, loading: () => null },
);

export const AlertsGovernanceContextPanelDeferred: ComponentType<AlertsGovernanceContextPanelProps> =
  dynamic(
    () =>
      import("@/components/alerts/AlertsGovernanceContextPanel").then(
        (module) => module.AlertsGovernanceContextPanel,
      ),
    {
      ssr: false,
      loading: () => alertsInboxDeferredLoading("Loading alerts context"),
    },
  );
