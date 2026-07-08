"use client";

import { cn } from "@/lib/utils";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

import Link from "next/link";
import { useCallback, useEffect, useState, type ReactElement } from "react";

import { OperatorLoadingNotice } from "@/components/OperatorShellMessage";
import { Button } from "@/components/ui/button";
import { StatusTag } from "@/components/ui/status-tag";
import { INTEGRATIONS_READINESS_PATH } from "@/lib/integrations-nav-paths";
import {
  digestsHaveExistingConfiguration,
  formatDigestInstant,
  mapDigestSetupGaps,
  resolveDigestOverallStatus,
  type DigestSetupGapAction,
} from "@/lib/digest-setup-gap-actions";
import { fetchWeeklyDigestHealth } from "@/lib/api";
import type { WeeklyDigestHealthDto } from "@/types/operate-rhythm";

export type WeeklyDigestHealthBannerProps = {
  /** Optional refresh token from the hub so Browse Refresh also reloads health. */
  readonly refreshToken?: number;
  /** Notifies the hub when health loads so primary CTAs can adapt. */
  readonly onHealthLoaded?: (snap: WeeklyDigestHealthDto | null) => void;
  /**
   * `full` — metrics + all setup gaps (Browse / Schedule).
   * `subscriptions` — compact strip with subscription-relevant gaps only.
   */
  readonly variant?: "full" | "subscriptions";
};

type HealthMetricProps = {
  readonly label: string;
  readonly value: string;
};

function HealthMetric(props: HealthMetricProps): ReactElement {
  return (
    <div className="min-w-[7.5rem]">
      <p className={cn("m-0 text-neutral-500 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>{props.label}</p>
      <p className={cn("m-0 mt-0.5 font-medium text-neutral-900 dark:text-neutral-100", OPERATOR_TYPOGRAPHY.body)}>
        {props.value}
      </p>
    </div>
  );
}

function isSubscriptionRelevantGap(gap: DigestSetupGapAction): boolean {
  return (
    gap.href.includes("tab=subscriptions") ||
    /subscription|recipient/i.test(gap.title) ||
    /subscription|recipient/i.test(gap.impact)
  );
}

/** Compact digest status summary with actionable setup gaps for the Digests hub. */
export function WeeklyDigestHealthBanner(props: WeeklyDigestHealthBannerProps): ReactElement {
  const { refreshToken = 0, onHealthLoaded, variant = "full" } = props;
  const [snap, setSnap] = useState<WeeklyDigestHealthDto | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async (): Promise<void> => {
    setLoading(true);

    try {
      const row: WeeklyDigestHealthDto = await fetchWeeklyDigestHealth();
      setSnap(row);
      onHealthLoaded?.(row);
    } catch {
      setSnap(null);
      onHealthLoaded?.(null);
    } finally {
      setLoading(false);
    }
  }, [onHealthLoaded]);

  useEffect(() => {
    void load();
  }, [load, refreshToken]);

  if (loading && snap === null) {
    return (
      <OperatorLoadingNotice>
        <strong>Loading digest health.</strong>
      </OperatorLoadingNotice>
    );
  }

  if (snap === null) {
    return (
      <div
        className={cn(
          "mb-4 rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-700 dark:bg-neutral-950",
          OPERATOR_TYPOGRAPHY.body,
        )}
        data-testid="weekly-digest-health-banner"
      >
        <p className="m-0 text-neutral-600 dark:text-neutral-400">Digest health is temporarily unavailable.</p>
      </div>
    );
  }

  const overall = resolveDigestOverallStatus(snap);
  const allGaps: DigestSetupGapAction[] = mapDigestSetupGaps(snap.setupGaps.slice(0, 4));
  const gaps: DigestSetupGapAction[] =
    variant === "subscriptions" ? allGaps.filter(isSubscriptionRelevantGap).slice(0, 2) : allGaps;
  const configured: boolean = digestsHaveExistingConfiguration(snap);
  const executiveRecipients: string =
    snap.executiveDigestRecipientCount > 0
      ? String(snap.executiveDigestRecipientCount)
      : configured
        ? "0"
        : "—";
  const compact: boolean = variant === "subscriptions";

  return (
    <div
      className={cn(
        "mb-4 rounded-lg border border-neutral-200 bg-white dark:border-neutral-700 dark:bg-neutral-950",
        compact ? "px-3 py-2" : "p-4",
        OPERATOR_TYPOGRAPHY.body,
      )}
      data-testid="weekly-digest-health-banner"
      data-variant={variant}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className={cn("m-0 font-semibold text-neutral-900 dark:text-neutral-100", OPERATOR_TYPOGRAPHY.cardTitle)}>
            {compact ? "Subscription delivery" : "Digest status"}
          </h3>
          <StatusTag kind={overall.kind} label={overall.label} data-testid="digest-overall-status" />
          {compact ? (
            <span className={cn("text-neutral-500 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
              Active: {snap.enabledDigestSubscriptionCount}
              {" · "}
              Last delivery:{" "}
              {formatDigestInstant(
                snap.latestDigestSubscriptionDeliveryUtc ?? snap.latestArchitectureDigestGeneratedUtc,
              )}
            </span>
          ) : null}
        </div>
        <p className={cn("m-0 text-neutral-500 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
          Related:{" "}
          <Link
            className="text-al-link underline-offset-2 hover:underline"
            href="/advisory?tab=schedules"
          >
            Advisory schedules
          </Link>
          {" · "}
          <Link className="text-al-link underline-offset-2 hover:underline" href={INTEGRATIONS_READINESS_PATH}>
            Integration readiness
          </Link>
        </p>
      </div>

      {!compact ? (
        <div className="mt-3 flex flex-wrap gap-x-6 gap-y-3" data-testid="digest-health-metrics">
          <HealthMetric label="Enabled schedules" value={String(snap.enabledAdvisoryScheduleCount)} />
          <HealthMetric label="Active subscriptions" value={String(snap.enabledDigestSubscriptionCount)} />
          <HealthMetric label="Executive recipients" value={executiveRecipients} />
          <HealthMetric
            label="Last sent"
            value={formatDigestInstant(
              snap.latestDigestSubscriptionDeliveryUtc ?? snap.latestArchitectureDigestGeneratedUtc,
            )}
          />
          <HealthMetric label="Next scheduled send" value={formatDigestInstant(snap.earliestNextAdvisoryRunUtc)} />
        </div>
      ) : null}

      {gaps.length > 0 ? (
        <ul
          className={cn("m-0 list-none space-y-2 p-0", compact ? "mt-2" : "mt-4 space-y-3")}
          data-testid="digest-setup-gaps"
        >
          {gaps.map((gap) => (
            <li
              key={`${gap.title}-${gap.href}`}
              className="flex flex-wrap items-start justify-between gap-3 rounded-md border border-neutral-200 px-3 py-2 dark:border-neutral-700"
            >
              <div className="min-w-0 flex-1">
                <p className={cn("m-0 font-medium text-neutral-900 dark:text-neutral-100", OPERATOR_TYPOGRAPHY.body)}>
                  {gap.title}
                </p>
                <p className={cn("m-0 mt-0.5 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
                  {gap.impact}
                </p>
              </div>
              <Button asChild size="sm" variant="outline">
                <Link href={gap.href}>{gap.actionLabel}</Link>
              </Button>
            </li>
          ))}
        </ul>
      ) : !compact ? (
        <p className={cn("m-0 mt-3 text-emerald-800 dark:text-emerald-200", OPERATOR_TYPOGRAPHY.helper)}>
          Digests are configured for this scope.
        </p>
      ) : null}
    </div>
  );
}
