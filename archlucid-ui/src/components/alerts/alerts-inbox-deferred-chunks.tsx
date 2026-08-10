"use client";

import dynamic from "next/dynamic";
import type { ComponentType } from "react";

import { cn } from "@/lib/utils";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

import type { AlertsInboxDialogsProps } from "@/components/alerts/AlertsInboxDialogs";
import type { AlertsGovernanceContextPanelProps } from "@/components/alerts/AlertsGovernanceContextPanel";

function AlertsInboxDeferredLoading(props: { readonly label: string }): React.JSX.Element {
  return (
    <div
      className={cn(
        "min-h-12 animate-pulse rounded-md border border-neutral-200 bg-neutral-100 dark:border-neutral-700 dark:bg-neutral-800",
        OPERATOR_TYPOGRAPHY.body,
      )}
      role="status"
      aria-label={props.label}
      data-testid="alerts-inbox-deferred-chunk-loading"
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
      loading: () => <AlertsInboxDeferredLoading label="Loading alerts context" />,
    },
  );
