"use client";

import { useCallback, useEffect, useState } from "react";

import { DismissControl } from "@/components/usability/DismissControl";
import { PLANNING_CLAIM_DISCIPLINE } from "@/lib/planning-evidence-copy";
import { DESIGN_TOKENS, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

const DISMISS_KEY = "archlucid_planning_claim_discipline_dismissed_v1";

/**
 * Claim-discipline callout for Improvement planning.
 * Dismissible after first read so planning content owns the viewport on return visits;
 * a quieter residual line remains so honesty is never fully removed.
 */
export function PlanningClaimDisciplineCallout(): React.JSX.Element {
  const [ready, setReady] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    setDismissed(window.localStorage.getItem(DISMISS_KEY) === "1");
    setReady(true);
  }, []);

  const dismiss = useCallback(() => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(DISMISS_KEY, "1");
    }

    setDismissed(true);
  }, []);

  if (!ready) {
    return (
      <aside
        className={cn(DESIGN_TOKENS.callout.warn, "p-3")}
        data-testid="planning-claim-discipline"
      >
        <h2 className={cn("m-0 text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}>Derived plans only</h2>
        <p className={cn("m-0 mt-2", OPERATOR_TYPOGRAPHY.body)}>{PLANNING_CLAIM_DISCIPLINE}</p>
      </aside>
    );
  }

  if (dismissed) {
    return (
      <p
        className={cn("m-0 max-w-3xl text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}
        data-testid="planning-claim-discipline-residual"
        role="note"
      >
        {PLANNING_CLAIM_DISCIPLINE}
      </p>
    );
  }

  return (
    <aside
      className={cn(DESIGN_TOKENS.callout.warn, "p-3")}
      data-testid="planning-claim-discipline"
    >
      <div className="flex items-start justify-between gap-3">
        <h2 className={cn("m-0 text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}>Derived plans only</h2>
        <DismissControl className="shrink-0" onDismiss={dismiss} />
      </div>
      <p className={cn("m-0 mt-2", OPERATOR_TYPOGRAPHY.body)}>{PLANNING_CLAIM_DISCIPLINE}</p>
    </aside>
  );
}
