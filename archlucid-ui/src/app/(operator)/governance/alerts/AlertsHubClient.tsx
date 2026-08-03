"use client";

import { AlertsInboxContent } from "@/components/alerts/AlertsInboxContent";

import type { AlertsInboxPageModel } from "./_sections/alerts-inbox-page-model";
import { AlertsHubChrome } from "./AlertsHubChrome";

export type AlertsHubClientProps = {
  readonly initialInboxModel?: AlertsInboxPageModel | null;
};

/**
 * Alerts triage inbox chrome + content (tests / callers with a preloaded model).
 * Production route streams via {@link AlertsInboxStreamingBody} under Suspense (TB-2026).
 */
export function AlertsHubClient({ initialInboxModel = null }: AlertsHubClientProps = {}) {
  return (
    <AlertsHubChrome>
      <AlertsInboxContent initialModel={initialInboxModel} />
    </AlertsHubChrome>
  );
}
