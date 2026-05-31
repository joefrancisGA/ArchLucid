"use client";

import { X } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { AUTH_MODE } from "@/lib/auth-config";
import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";
import { isJwtAuthMode } from "@/lib/oidc/config";
import { isLikelySignedIn } from "@/lib/oidc/session";
import { mergeRegistrationScopeForProxy } from "@/lib/proxy-fetch-registration-scope";
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
  const [hydrated, setHydrated] = useState(false);
  const [payload, setPayload] = useState<TeamExpansionNudgeStatusPayload | null>(null);
  const [activeTrigger, setActiveTrigger] = useState<TeamExpansionNudgeTrigger | null>(null);
  const [visible, setVisible] = useState(false);
  const [dismissedLocally, setDismissedLocally] = useState(false);

  const refresh = useCallback(async () => {
    if (AUTH_MODE !== "development-bypass" && isJwtAuthMode() && !isLikelySignedIn()) {
      setPayload(null);
      setActiveTrigger(null);
      setVisible(false);

      return;
    }

    try {
      const res = await fetch(
        "/api/proxy/v1/tenant/usage-status",
        mergeRegistrationScopeForProxy({ headers: { Accept: "application/json" } }),
      );

      if (!res.ok) {
        setPayload(null);
        setActiveTrigger(null);
        setVisible(false);

        return;
      }

      const json = (await res.json()) as TeamExpansionNudgeStatusPayload;
      const trigger = resolveTeamExpansionNudgeTrigger(json);

      setPayload(json);
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
    } catch {
      setPayload(null);
      setActiveTrigger(null);
      setVisible(false);
    }
  }, []);

  useEffect(() => {
    setHydrated(true);
    void refresh();
  }, [refresh]);

  if (!hydrated || !visible || dismissedLocally || activeTrigger === null || payload === null) {
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
      className="rounded-md border border-neutral-200 bg-al-surface-raised dark:border-neutral-800 mb-4 flex flex-wrap items-start justify-between gap-3 p-3 text-sm shadow-sm"
    >
      <div className="min-w-0">
        <p className="m-0 font-semibold">{copy.title}</p>
        <p className="mt-1 text-xs text-sky-900 dark:text-sky-200">{copy.detail}</p>
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
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-8 w-8 shrink-0 text-sky-900 hover:bg-sky-100 dark:text-sky-100 dark:hover:bg-sky-900/60"
        aria-label="Dismiss Team expansion nudge for 24 hours"
        onClick={() => {
          dismissTeamExpansionNudge24h(activeTrigger);
          setDismissedLocally(true);
        }}
      >
        <X className="h-4 w-4" aria-hidden />
      </Button>
    </div>
  );
}
