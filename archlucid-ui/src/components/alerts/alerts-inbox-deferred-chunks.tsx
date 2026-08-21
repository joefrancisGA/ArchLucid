"use client";

import dynamic from "next/dynamic";
import type { ComponentType } from "react";

import { createDeferredComponentFromManifest } from "@/lib/operator/load-deferred-chunk-from-manifest";

import type { AlertsInboxDialogsProps } from "@/components/alerts/AlertsInboxDialogs";
import type { AlertsGovernanceContextPanelProps } from "@/components/alerts/AlertsGovernanceContextPanel";

/** Triage + action-loop dialogs — off inbox First Load JS (wave 11). */
export const AlertsInboxDialogsDeferred: ComponentType<AlertsInboxDialogsProps> = dynamic(
  () => import("@/components/alerts/AlertsInboxDialogs").then((module) => module.AlertsInboxDialogs),
  { ssr: false, loading: () => null },
);

export const AlertsGovernanceContextPanelDeferred: ComponentType<AlertsGovernanceContextPanelProps> =
  createDeferredComponentFromManifest("alerts-inbox-governance-context-panel", {
    loadingTestId: "alerts-inbox-deferred-chunk-loading",
  });
