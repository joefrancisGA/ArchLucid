"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { DismissControl } from "@/components/usability/DismissControl";
import { useTenantTrialStatusQuery } from "@/hooks/use-tenant-trial-status-query";
import { useTenantUsageStatusQuery } from "@/hooks/use-tenant-usage-status-query";
import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import {
  dismissTeamExpansionNudge24h,
  isTeamExpansionNudgeDismissed,
  markTeamExpansionNudgeShownThisSession,
  wasTeamExpansionNudgeShownThisSession,
} from "@/lib/team-expansion-nudge-dismiss";
import { recordTeamExpansionNudgeClicked, recordTeamExpansionNudgeShown } from "@/lib/team-expansion-nudge-telemetry";
import {
  buildTeamExpansionNudgePricingHref,
  resolveTeamExpansionNudgeTrigger,
  type TeamExpansionNudgeStatusPayload,
  type TeamExpansionNudgeTrigger,
} from "@/lib/team-expansion-nudge-trigger";
import { shouldFetchTenantUsageStatusForTeamExpansionNudge } from "@/lib/team-expansion-nudge-usage-fetch";

function nudgeCopy(
  trigger: TeamExpansionNudgeTrigger,
  payload: TeamExpansionNudgeStatusPayload,
): { title: string; detail: string; ctaLabel: string } {
  if (trigger === "workspaces") {
    const used = payload.workspacesUsed ?? 0;
    const limit = payload.workspacesLimit;

    return {
      title: "You're approaching your Team workspace limit",
      detail:
        typeof limit === "number"
          ? `${used} of ${limit} workspace${limit === 1 ? "" : "s"} in use — expand to Professional for more capacity.`
          : `${used} workspace${used === 1 ? "" : "s"} in use — expand to Professional for more capacity.`,
      ctaLabel: "Request a quote",
    };
  }

  const used = payload.seatsUsed ?? 0;
  const limit = payload.seatsLimit;

  return {
    title: "You're approaching your Team seat limit",
    detail:
      typeof limit === "number"
        ? `${used} of ${limit} seats in use — request a quote to expand to Professional.`
        : `${used} seats in use — request a quote to expand to Professional.`,
    ctaLabel: "Request a quote",
  };
}

/**
 * Usage-based expansion nudge for paid Team tenants (Improvement #5). Shown when seat or workspace usage crosses
 * documented thresholds; trials remain owned by {@link TrialUsageUpgradeNudge}.
 */
export function TeamExpansionNudge() {
  const { data: trialPayload, isFetched: trialFetched } = useTenantTrialStatusQuery();
  const usageQueryEnabled = shouldFetchTenantUsageStatusForTeamExpansionNudge(trialPayload, trialFetched);
  const { data: payload, isFetched } = useTenantUsageStatusQuery({ enabled: usageQueryEnabled });
  const [activeTrigger, setActiveTrigger] = useState<TeamExpansionNudgeTrigger | null>(null);
  const [visible, setVisible] = useState(false);
  const [dismissedLocally, setDismissedLocally] = useState(false);
  const evaluatedPayloadRef = useRef<TeamExpansionNudgeStatusPayload | null | undefined>(undefined);

  useEffect(() => {
    if (!isFetched) {
      return;
    }

    if (evaluatedPayloadRef.current === payload) {
      return;
    }

    evaluatedPayloadRef.current = payload;

    const trigger = resolveTeamExpansionNudgeTrigger(payload ?? null);

    setActiveTrigger(trigger);

    if (
      trigger === null ||
      isTeamExpansionNudgeDismissed(trigger) ||
      wasTeamExpansionNudgeShownThisSession(trigger)
    ) {
      setVisible(false);

      return;
    }

    setVisible(true);
    markTeamExpansionNudgeShownThisSession(trigger);
    recordTeamExpansionNudgeShown(trigger);
  }, [isFetched, payload]);

  if (!visible || dismissedLocally || activeTrigger === null || payload == null) {
    return null;
  }

  if (isBuyerPolishedOperatorShellEnv()) {
    return null;
  }

  const copy = nudgeCopy(activeTrigger, payload);
  const pricingHref = buildTeamExpansionNudgePricingHref(activeTrigger);

  return (
    <div
      role="region"
      aria-label="Team expansion nudge"
      data-testid="team-expansion-nudge"
      data-trigger={activeTrigger}
      className={cn(
        "mb-4 flex flex-wrap items-start justify-between gap-3 rounded-md border border-neutral-200 bg-al-surface-raised p-3 shadow-sm dark:border-neutral-800",
        OPERATOR_TYPOGRAPHY.body,
      )}
    >
      <div className="min-w-0">
        <p className="m-0 font-semibold">{copy.title}</p>
        <p className={cn("mt-1 text-sky-900 dark:text-sky-200", OPERATOR_TYPOGRAPHY.helper)}>{copy.detail}</p>
        <div className="mt-2 flex flex-wrap gap-2">
          <Button asChild type="button" size="sm" className="bg-teal-800 text-white hover:bg-teal-900 dark:bg-teal-700">
            <Link
              href={pricingHref}
              onClick={() => {
                recordTeamExpansionNudgeClicked(activeTrigger);
              }}
            >
              {copy.ctaLabel}
            </Link>
          </Button>
        </div>
      </div>
      <DismissControl
        iconOnly
        ariaLabel="Dismiss Team expansion nudge for 24 hours"
        onDismiss={() => {
          dismissTeamExpansionNudge24h(activeTrigger);
          setDismissedLocally(true);
        }}
      />
    </div>
  );
}
