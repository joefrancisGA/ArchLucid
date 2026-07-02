"use client";

import {
  AlertsInboxInteractiveClient,
  type AlertsInboxInteractiveClientProps,
} from "@/components/alerts/AlertsInboxInteractiveClient";

export type AlertsInboxContentProps = AlertsInboxInteractiveClientProps;

/** Thin client entry for the alerts inbox (TB-564). */
export function AlertsInboxContent(props: AlertsInboxContentProps = {}) {
  return <AlertsInboxInteractiveClient initialModel={props.initialModel ?? null} />;
}
