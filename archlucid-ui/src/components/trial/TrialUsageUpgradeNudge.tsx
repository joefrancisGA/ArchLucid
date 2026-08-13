"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { DismissControl } from "@/components/usability/DismissControl";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useTenantTrialStatusQuery } from "@/hooks/use-tenant-trial-status-query";
import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { startTrialBillingCheckout } from "@/lib/trial-billing-checkout";
import {
  dismissTrialUpgradeNudge24h,
  isTrialUpgradeNudgeDismissed,
  markTrialUpgradeNudgeShownThisSession,
  wasTrialUpgradeNudgeShownThisSession,
} from "@/lib/trial-upgrade-nudge-dismiss";
import { recordTrialUpgradeNudgeClicked, recordTrialUpgradeNudgeShown } from "@/lib/trial-upgrade-nudge-telemetry";
import {
  buildTrialUpgradeNudgePricingHref,
  resolveTrialUpgradeNudgeTrigger,
  type TrialUpgradeNudgeStatusPayload,
  type TrialUpgradeNudgeTrigger,
} from "@/lib/trial-upgrade-nudge-trigger";

function nudgeCopy(
  trigger: TrialUpgradeNudgeTrigger,
  payload: TrialUpgradeNudgeStatusPayload,
): { title: string; detail: string; ctaLabel: string } {
  if (trigger === "expiry") {
    if (payload.status === "Expired" || payload.status === "ReadOnly") {
      return {
        title: "Your trial has expired",
        detail: "Upgrade to restore full write access and continue architecture reviews.",
        ctaLabel: "Upgrade now",
      };
    }

    const days = payload.daysRemaining;

    return {
      title:
        typeof days === "number" && days === 0
          ? "Your trial ends today"
          : `${days ?? 0} day${days === 1 ? "" : "s"} left on your trial`,
      detail: "Upgrade before access changes.",
      ctaLabel: "Upgrade now",
    };
  }

  if (trigger === "runs") {
    const used = payload.trialRunsUsed ?? 0;
    const limit = payload.trialRunsLimit;

    return {
      title: "You're approaching your trial review limit",
      detail:
        typeof limit === "number"
          ? `${used} of ${limit} evaluation runs used — talk to us to extend or upgrade.`
          : `${used} evaluation runs used — talk to us to extend or upgrade.`,
      ctaLabel: "Request a quote",
    };
  }

  const used = payload.trialSeatsUsed ?? 0;
  const limit = payload.trialSeatsLimit;

  return {
    title: "You're approaching your trial seat limit",
    detail:
      typeof limit === "number"
        ? `${used} of ${limit} seats in use — request a quote to add capacity.`
        : `${used} seats in use — request a quote to add capacity.`,
    ctaLabel: "Request a quote",
  };
}

function isExpiredTrial(payload: TrialUpgradeNudgeStatusPayload): boolean {
  return payload.status === "Expired" || payload.status === "ReadOnly";
}

/**
 * Usage-based upgrade nudge for active trial tenants (Improvement #14). Shown in the operator shell when
 * run usage, seat usage, or expiry crosses documented thresholds.
 */
export function TrialUsageUpgradeNudge() {
  const { data: payload, isFetched } = useTenantTrialStatusQuery();
  const [activeTrigger, setActiveTrigger] = useState<TrialUpgradeNudgeTrigger | null>(null);
  const [visible, setVisible] = useState(false);
  const [dismissedLocally, setDismissedLocally] = useState(false);
  const [expiredModalOpen, setExpiredModalOpen] = useState(false);
  const evaluatedPayloadRef = useRef<TrialUpgradeNudgeStatusPayload | null | undefined>(undefined);

  useEffect(() => {
    if (!isFetched) {
      return;
    }

    if (evaluatedPayloadRef.current === payload) {
      return;
    }

    evaluatedPayloadRef.current = payload ?? null;

    const json = payload ?? null;
    const trigger = resolveTrialUpgradeNudgeTrigger(json);

    setActiveTrigger(trigger);

    if (trigger === null || json === null) {
      setVisible(false);
      setExpiredModalOpen(false);

      return;
    }

    if (isExpiredTrial(json)) {
      setVisible(true);
      setExpiredModalOpen(true);
      recordTrialUpgradeNudgeShown(trigger);

      return;
    }

    if (isTrialUpgradeNudgeDismissed(trigger) || wasTrialUpgradeNudgeShownThisSession(trigger)) {
      setVisible(false);
      setExpiredModalOpen(false);

      return;
    }

    setVisible(true);
    setExpiredModalOpen(trigger === "expiry");
    markTrialUpgradeNudgeShownThisSession(trigger);
    recordTrialUpgradeNudgeShown(trigger);
  }, [isFetched, payload]);

  if (!visible || dismissedLocally || activeTrigger === null || payload == null) {
    return null;
  }

  if (isBuyerPolishedOperatorShellEnv()) {
    return null;
  }

  const copy = nudgeCopy(activeTrigger, payload);
  const pricingHref = buildTrialUpgradeNudgePricingHref(activeTrigger);
  const expiredTrial = isExpiredTrial(payload);

  return (
    <>
      <div
        role="region"
        aria-label="Trial upgrade nudge"
        data-testid="trial-usage-upgrade-nudge"
        data-trigger={activeTrigger}
        className={cn(
          "mb-4 flex flex-wrap items-start justify-between gap-3 rounded-md border border-amber-600/40 bg-al-surface-raised p-3 text-al-text-primary shadow-sm dark:border-amber-700/50",
          OPERATOR_TYPOGRAPHY.body,
        )}
      >
        <div className="min-w-0">
          <p className="m-0 font-semibold">{copy.title}</p>
          <p className={cn("mt-1 text-amber-900 dark:text-amber-200", OPERATOR_TYPOGRAPHY.helper)}>{copy.detail}</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {activeTrigger === "expiry" ? (
              <Button
                type="button"
                size="sm"
                className="bg-teal-800 text-white hover:bg-teal-900 dark:bg-teal-700"
                data-testid="trial-upgrade-nudge-cta"
                onClick={() => {
                  recordTrialUpgradeNudgeClicked(activeTrigger);
                  void startTrialBillingCheckout();
                }}
              >
                {copy.ctaLabel}
              </Button>
            ) : (
              <Button asChild type="button" size="sm" className="bg-teal-800 text-white hover:bg-teal-900 dark:bg-teal-700">
                <Link
                  href={pricingHref}
                  data-testid="trial-upgrade-nudge-cta"
                  onClick={() => {
                    recordTrialUpgradeNudgeClicked(activeTrigger);
                  }}
                >
                  {copy.ctaLabel}
                </Link>
              </Button>
            )}
            <Button asChild type="button" size="sm" variant="outline">
              <Link href="/pricing#pricing-quote-request">View pricing</Link>
            </Button>
          </div>
        </div>
        {expiredTrial ? null : (
          <DismissControl
            iconOnly
            ariaLabel="Dismiss trial upgrade nudge for 24 hours"
            onDismiss={() => {
              dismissTrialUpgradeNudge24h(activeTrigger);
              setDismissedLocally(true);
              setExpiredModalOpen(false);
            }}
          />
        )}
      </div>

      <Dialog
        open={expiredModalOpen}
        onOpenChange={(open) => {
          if (expiredTrial) {
            setExpiredModalOpen(true);

            return;
          }

          setExpiredModalOpen(open);
        }}
      >
        <DialogContent className="sm:max-w-md" data-testid="trial-expired-upgrade-modal">
          <DialogHeader>
            <DialogTitle>{copy.title}</DialogTitle>
            <DialogDescription>{copy.detail}</DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-col gap-2 sm:flex-row sm:justify-end">
            {expiredTrial ? null : (
              <Button type="button" variant="outline" onClick={() => setExpiredModalOpen(false)}>
                Continue
              </Button>
            )}
            <Button
              type="button"
              data-testid="trial-upgrade-nudge-cta"
              onClick={() => {
                recordTrialUpgradeNudgeClicked(activeTrigger);
                void startTrialBillingCheckout();
              }}
            >
              {copy.ctaLabel}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
