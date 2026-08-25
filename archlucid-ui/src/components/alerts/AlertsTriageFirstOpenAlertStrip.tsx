"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import type { AlertActionKind } from "@/components/alerts/AlertsInboxAlertCard";
import { DismissControl } from "@/components/usability/DismissControl";
import { Button } from "@/components/ui/button";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import type { AlertsInboxTriageFirstAlertTarget } from "@/lib/resolve-alerts-inbox-triage-first-alert";
import { cn } from "@/lib/utils";

const STORAGE_KEY = "archlucid_alerts_triage_first_open_alert_strip_dismissed_v1";

export type AlertsTriageFirstOpenAlertStripProps = {
  readonly target: AlertsInboxTriageFirstAlertTarget;
  readonly canAcknowledge: boolean;
  readonly onAcknowledge: (alertId: string, action: AlertActionKind) => void;
};

/** Dismissible strip routing operators to the highest-priority open alert. */
export function AlertsTriageFirstOpenAlertStrip(
  props: AlertsTriageFirstOpenAlertStripProps,
): React.JSX.Element | null {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      setVisible(window.localStorage.getItem(STORAGE_KEY) !== "1");
    } catch {
      setVisible(true);
    }
  }, []);

  const onDismiss = useCallback(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, "1");
    } catch {
      /* ignore */
    }

    setVisible(false);
  }, []);

  const scrollToAlert = useCallback((): void => {
    document
      .querySelector(`[data-alert-id="${props.target.alertId}"]`)
      ?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [props.target.alertId]);

  if (!visible) {
    return null;
  }

  return (
    <div
      className={cn(
        "mb-3 flex flex-wrap items-start justify-between gap-3 rounded-md border border-neutral-200 bg-al-surface-raised px-3 py-3 dark:border-neutral-800",
        OPERATOR_TYPOGRAPHY.body,
      )}
      data-testid="alerts-triage-first-open-alert-strip"
      role="note"
    >
      <div className="min-w-0 flex-1">
        <p className="m-0 font-medium text-al-text-primary">Start with this alert</p>
        <p className={cn("m-0 mt-1 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
          Triage highest severity first — <span className="font-medium text-al-text-primary">{props.target.title}</span>{" "}
          ({props.target.severity}).
        </p>
      </div>
      <div className="flex shrink-0 flex-wrap items-center gap-2">
        {props.target.openHref !== null ? (
          <Button type="button" variant="primary" size="sm" asChild data-testid="alerts-triage-first-open-alert-open">
            <Link href={props.target.openHref}>Open</Link>
          </Button>
        ) : (
          <Button
            type="button"
            variant="primary"
            size="sm"
            data-testid="alerts-triage-first-open-alert-open"
            onClick={scrollToAlert}
          >
            Open
          </Button>
        )}
        {props.canAcknowledge ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            data-testid="alerts-triage-first-open-alert-acknowledge"
            onClick={() => {
              props.onAcknowledge(props.target.alertId, "Acknowledge");
            }}
          >
            Acknowledge
          </Button>
        ) : null}
        <DismissControl className="h-7" onDismiss={onDismiss} />
      </div>
    </div>
  );
}
