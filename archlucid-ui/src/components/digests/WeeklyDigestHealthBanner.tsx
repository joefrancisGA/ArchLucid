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
  digestSetupShowsRecipientClarification,
  formatDigestInstant,
  mapDigestSetupGaps,
  resolveDigestNextBestAction,
  resolveDigestOverallStatus,
  type DigestSetupGapAction,
} from "@/lib/digest-setup-gap-actions";
import {
  DIGESTS_BROWSE_NEXT_BEST_ACTION_PREFIX,
  DIGESTS_BROWSE_RELATED_ADVISORY_LABEL,
  DIGESTS_BROWSE_RELATED_INTEGRATIONS_LABEL,
  DIGESTS_BROWSE_RECIPIENTS_HELPER,
  DIGESTS_BROWSE_SETUP_MESSAGE,
} from "@/lib/digests-browse-copy";
import { EXEC_DIGEST_DAY_NAMES, formatExecDigestSendTimeLabel } from "@/lib/exec-digest-schedule-form";
import { formatIanaTimeZoneOptionLabel } from "@/lib/iana-time-zone-select";
import { fetchWeeklyDigestHealth } from "@/lib/api";
import type { WeeklyDigestHealthDto } from "@/types/operate-rhythm";

export type WeeklyDigestHealthBannerProps = {
  /** Optional refresh token from the hub so Browse Refresh also reloads health. */
  readonly refreshToken?: number;
  /** Notifies the hub when health loads so primary CTAs can adapt. */
  readonly onHealthLoaded?: (snap: WeeklyDigestHealthDto | null) => void;
  /**
   * `full` — metrics + all setup gaps (Browse).
   * `subscriptions` — compact strip with subscription-relevant gaps only.
   * `schedule` — compact strip with executive schedule gaps only.
   */
  readonly variant?: "full" | "subscriptions" | "schedule";
  /** When true, loads health for parent state but renders no banner chrome. */
  readonly loadOnly?: boolean;
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

function isScheduleRelevantGap(gap: DigestSetupGapAction): boolean {
  return (
    gap.href.includes("tab=schedule") ||
    /executive|schedule|recipient/i.test(gap.title) ||
    /executive|schedule|recipient|rollup/i.test(gap.impact)
  );
}

function formatExecutiveScheduleSummary(snap: WeeklyDigestHealthDto): string {
  if (!snap.executiveEmailDigestEnabled) {
    return "Executive digest disabled";
  }

  const dayName: string = EXEC_DIGEST_DAY_NAMES[snap.executiveDigestDayOfWeek] ?? "—";
  const timeLabel: string = formatExecDigestSendTimeLabel(snap.executiveDigestHourOfDay);
  const zoneLabel: string = formatIanaTimeZoneOptionLabel(snap.executiveDigestIanaTimeZoneId);

  return `${dayName} at ${timeLabel} ${zoneLabel}`;
}

/** Compact digest status summary with actionable setup gaps for the Digests hub. */
export function WeeklyDigestHealthBanner(props: WeeklyDigestHealthBannerProps): ReactElement | null {
  const { refreshToken = 0, onHealthLoaded, variant = "full", loadOnly = false } = props;
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

  if (loadOnly) {
    return null;
  }

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
  const setupNeeded: boolean = overall.label === "Setup needed";
  const allGaps: DigestSetupGapAction[] = mapDigestSetupGaps(snap.setupGaps.slice(0, 4));
  const gaps: DigestSetupGapAction[] =
    variant === "subscriptions"
      ? allGaps.filter(isSubscriptionRelevantGap).slice(0, 2)
      : variant === "schedule"
        ? allGaps.filter(isScheduleRelevantGap).slice(0, 2)
        : allGaps;
  const configured: boolean = digestsHaveExistingConfiguration(snap);
  const nextBestAction = variant === "full" ? resolveDigestNextBestAction(snap) : null;
  const showRecipientClarification =
    variant === "full" && digestSetupShowsRecipientClarification(snap);
  const executiveRecipients: string =
    snap.executiveDigestRecipientCount > 0
      ? String(snap.executiveDigestRecipientCount)
      : configured
        ? "0"
        : "—";
  const compact: boolean = variant === "subscriptions" || variant === "schedule";
  const compactTitle: string =
    variant === "subscriptions"
      ? "Subscription delivery"
      : variant === "schedule"
        ? "Executive schedule"
        : "Digest status";

  return (
    <div
      className={cn(
        "mb-4 rounded-lg border border-neutral-200 bg-white dark:border-neutral-700 dark:bg-neutral-950",
        compact ? "px-3 py-2" : setupNeeded ? "p-3" : "p-4",
        OPERATOR_TYPOGRAPHY.body,
      )}
      data-testid="weekly-digest-health-banner"
      data-variant={variant}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className={cn("m-0 font-semibold text-neutral-900 dark:text-neutral-100", OPERATOR_TYPOGRAPHY.cardTitle)}>
            {compactTitle}
          </h3>
          <StatusTag kind={overall.kind} label={overall.label} data-testid="digest-overall-status" />
          {variant === "subscriptions" ? (
            <span className={cn("text-neutral-500 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
              Active: {snap.enabledDigestSubscriptionCount}
              {" · "}
              Last delivery:{" "}
              {formatDigestInstant(
                snap.latestDigestSubscriptionDeliveryUtc ?? snap.latestArchitectureDigestGeneratedUtc,
              )}
            </span>
          ) : null}
          {variant === "schedule" ? (
            <span className={cn("text-neutral-500 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
              Recipients: {executiveRecipients}
              {" · "}
              Cadence: {formatExecutiveScheduleSummary(snap)}
            </span>
          ) : null}
        </div>
        {variant === "full" ? (
          <div className="flex flex-wrap gap-2" data-testid="digests-browse-related-actions">
            <Button asChild size="sm" variant="outline">
              <Link href="/governance/advisory-scans?tab=schedules">{DIGESTS_BROWSE_RELATED_ADVISORY_LABEL}</Link>
            </Button>
            <Button asChild size="sm" variant="outline">
              <Link href={INTEGRATIONS_READINESS_PATH}>{DIGESTS_BROWSE_RELATED_INTEGRATIONS_LABEL}</Link>
            </Button>
          </div>
        ) : (
          <p className={cn("m-0 text-neutral-500 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
            Related:{" "}
            <Link
              className="text-al-link underline-offset-2 hover:underline"
              href="/governance/advisory-scans?tab=schedules"
            >
              Advisory schedules
            </Link>
            {" · "}
            <Link className="text-al-link underline-offset-2 hover:underline" href={INTEGRATIONS_READINESS_PATH}>
              Integration readiness
            </Link>
          </p>
        )}
      </div>

      {variant === "full" && setupNeeded ? (
        <p className={cn("m-0 mt-2 text-neutral-700 dark:text-neutral-300", OPERATOR_TYPOGRAPHY.body)} data-testid="digests-browse-setup-message">
          {DIGESTS_BROWSE_SETUP_MESSAGE}
        </p>
      ) : null}

      {nextBestAction !== null ? (
        <div
          className="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-md border border-neutral-200 bg-neutral-50 px-3 py-2 dark:border-neutral-700 dark:bg-neutral-900/50"
          data-testid="digests-browse-next-best-action"
        >
          <div>
            <p className={cn("m-0 font-medium text-al-text-primary", OPERATOR_TYPOGRAPHY.helper)}>
              {DIGESTS_BROWSE_NEXT_BEST_ACTION_PREFIX}
            </p>
            <p className={cn("m-0 mt-0.5 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>{nextBestAction.title}</p>
          </div>
          <Button asChild size="sm" variant="primary">
            <Link href={nextBestAction.href}>{nextBestAction.actionLabel}</Link>
          </Button>
        </div>
      ) : null}

      {showRecipientClarification ? (
        <p className={cn("m-0 mt-3 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
          {DIGESTS_BROWSE_RECIPIENTS_HELPER}
        </p>
      ) : null}

      {!compact && !setupNeeded ? (
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
