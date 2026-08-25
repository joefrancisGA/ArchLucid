"use client";

import { useCallback, useEffect, useState } from "react";

import { DismissControl } from "@/components/usability/DismissControl";
import { Button } from "@/components/ui/button";
import { formatRiskExceptionExpiresAtUtc } from "@/components/governance/risk-exception-status";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import type { RiskExceptionsTriageFirstExpiringTarget } from "@/lib/governance/resolve-risk-exceptions-triage-first-expiring";
import { cn } from "@/lib/utils";

const STORAGE_KEY = "archlucid_risk_exceptions_triage_first_expiring_strip_dismissed_v1";

export type RiskExceptionsTriageFirstExpiringStripProps = {
  readonly target: RiskExceptionsTriageFirstExpiringTarget;
  readonly onExtend: (riskExceptionId: string) => void;
};

/** Dismissible strip routing operators to the soonest-expiring open waiver. */
export function RiskExceptionsTriageFirstExpiringStrip(
  props: RiskExceptionsTriageFirstExpiringStripProps,
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

  const scrollToException = useCallback((): void => {
    document
      .querySelector(`[data-risk-exception-id="${props.target.riskExceptionId}"]`)
      ?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [props.target.riskExceptionId]);

  if (!visible) {
    return null;
  }

  return (
    <div
      className={cn(
        "mb-3 flex flex-wrap items-start justify-between gap-3 rounded-md border border-neutral-200 bg-al-surface-raised px-3 py-3 dark:border-neutral-800",
        OPERATOR_TYPOGRAPHY.body,
      )}
      data-testid="risk-exceptions-triage-first-expiring-strip"
      role="note"
    >
      <div className="min-w-0 flex-1">
        <p className="m-0 font-medium text-al-text-primary">Start with the soonest expiring waiver</p>
        <p className={cn("m-0 mt-1 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
          <span className="font-medium text-al-text-primary">{props.target.findingId}</span> expires{" "}
          {formatRiskExceptionExpiresAtUtc(props.target.expiresAtUtc)}.
        </p>
      </div>
      <div className="flex shrink-0 flex-wrap items-center gap-2">
        <Button
          type="button"
          variant="primary"
          size="sm"
          data-testid="risk-exceptions-triage-first-expiring-open"
          onClick={scrollToException}
        >
          Open exception
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          data-testid="risk-exceptions-triage-first-expiring-extend"
          onClick={() => {
            props.onExtend(props.target.riskExceptionId);
          }}
        >
          Extend waiver
        </Button>
        <DismissControl className="h-7" onDismiss={onDismiss} />
      </div>
    </div>
  );
}
