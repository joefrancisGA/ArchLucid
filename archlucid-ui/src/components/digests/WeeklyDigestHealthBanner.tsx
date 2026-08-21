"use client";

import { cn } from "@/lib/utils";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

import Link from "next/link";
import { useCallback, useEffect, useState, type ReactElement } from "react";

import { OperatorLoadingNotice } from "@/components/operator/OperatorShellMessage";
import { Button } from "@/components/ui/button";
import { StatusTag } from "@/components/ui/status-tag";
import { ADVISORY_SCANS_SCHEDULES_HREF } from "@/lib/advisory-scans-route";
import { INTEGRATIONS_READINESS_PATH } from "@/lib/integrations-nav-paths";
import {
  digestsHaveExistingConfiguration,
  formatDigestInstant,
  resolveDigestOverallStatus,
} from "@/lib/digest-setup-gap-actions";
import {
  DIGESTS_BROWSE_RELATED_ADVISORY_LABEL,
  DIGESTS_BROWSE_RELATED_INTEGRATIONS_LABEL,
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
   * Which facts accompany the status tag.
   * `full` — Browse: schedule / subscription / last-sent counts.
   * `subscriptions` — active destinations + last delivery.
   * `schedule` — sponsor recipients + cadence.
   */
  readonly variant?: "full" | "subscriptions" | "schedule";
  /** When true, loads health for parent state but renders no banner chrome. */
  readonly loadOnly?: boolean;
  /**
   * When true on Browse during setup, the checklist owns metrics and related links —
   * the banner shows only the status tag.
   */
  readonly suppressCompactFacts?: boolean;
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

function formatSponsorScheduleSummary(snap: WeeklyDigestHealthDto): string {
  if (!snap.executiveEmailDigestEnabled) {
    return "Sponsor digest disabled";
  }

  const dayName: string = EXEC_DIGEST_DAY_NAMES[snap.executiveDigestDayOfWeek] ?? " — ";
  const timeLabel: string = formatExecDigestSendTimeLabel(snap.executiveDigestHourOfDay);
  const zoneLabel: string = formatIanaTimeZoneOptionLabel(snap.executiveDigestIanaTimeZoneId);

  return `${dayName} at ${timeLabel} ${zoneLabel}`;
}

/**
 * Digest status strip for the hub — status tag plus the facts for the active tab.
 *
 * Deliberately owns **no** setup guidance. Each tab already tells that story once:
 * Browse via `DigestsBrowseSetupChecklist`, Subscriptions via
 * `DigestSubscriptionsReadinessPanel`, Schedule via its own readiness rail, and the
 * page header via its single primary action. The banner previously repeated a setup
 * sentence, a next-best-action card, and per-gap rows on top of all three.
 */
export function WeeklyDigestHealthBanner(props: WeeklyDigestHealthBannerProps): ReactElement | null {
  const {
    refreshToken = 0,
    onHealthLoaded,
    variant = "full",
    loadOnly = false,
    suppressCompactFacts = false,
  } = props;
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
    if (!loading && snap === null) {
      return (
        <div
          className={cn(
            "mb-4 rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-700 dark:bg-neutral-950",
            OPERATOR_TYPOGRAPHY.body,
          )}
          data-testid="weekly-digest-health-load-failed"
        >
          <p className="m-0 text-neutral-600 dark:text-neutral-400">Digest health is temporarily unavailable.</p>
        </div>
      );
    }

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
  // Compare the status kind, not its label — the label is buyer copy and may be reworded.
  const setupNeeded: boolean = overall.kind === "draft";
  const configured: boolean = digestsHaveExistingConfiguration(snap);
  const executiveRecipients: string =
    snap.executiveDigestRecipientCount > 0
      ? String(snap.executiveDigestRecipientCount)
      : configured
        ? "0"
        : " — ";
  // Full metric grid only earns its space once the loop is actually running.
  const showMetricGrid: boolean = variant === "full" && !setupNeeded;
  const showCompactFacts: boolean =
    variant === "full" && setupNeeded && !suppressCompactFacts;
  // Checklist owns related links on Get started — show facts without card chrome.
  const showBorderlessCompactFacts: boolean =
    variant === "full" && setupNeeded && suppressCompactFacts;
  const compactTitle: string =
    variant === "subscriptions"
      ? "Subscription delivery"
      : variant === "schedule"
        ? "Sponsor schedule"
        : "Digest status";

  const compactFactsLine: ReactElement = (
    <span
      className={cn("text-neutral-500 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}
      data-testid="digest-status-compact-facts"
    >
      Enabled schedules: {snap.enabledAdvisoryScheduleCount}
      {" · "}
      Active subscriptions: {snap.enabledDigestSubscriptionCount}
      {" · "}
      Last sent:{" "}
      {formatDigestInstant(
        snap.latestDigestSubscriptionDeliveryUtc ?? snap.latestArchitectureDigestGeneratedUtc,
      )}
    </span>
  );

  if (showBorderlessCompactFacts) {
    return (
      <div
        className={cn("mb-4", OPERATOR_TYPOGRAPHY.body)}
        data-testid="weekly-digest-health-banner"
        data-variant={variant}
      >
        <div className="flex flex-wrap items-center gap-2">
          <h3
            className={cn("m-0 font-semibold text-neutral-900 dark:text-neutral-100", OPERATOR_TYPOGRAPHY.cardTitle)}
          >
            {compactTitle}
          </h3>
          <StatusTag kind={overall.kind} label={overall.label} data-testid="digest-overall-status" />
          {compactFactsLine}
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "mb-4 rounded-lg border border-neutral-200 bg-white dark:border-neutral-700 dark:bg-neutral-950",
        showMetricGrid ? "p-4" : "px-3 py-2",
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
          {variant === "subscriptions" && !suppressCompactFacts ? (
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
              Cadence: {formatSponsorScheduleSummary(snap)}
            </span>
          ) : null}
          {variant === "full" && showCompactFacts ? compactFactsLine : null}
        </div>
        {showMetricGrid ? (
          <div className="flex flex-wrap gap-2" data-testid="digests-browse-related-actions">
            <Button asChild size="sm" variant="outline">
              <Link href={ADVISORY_SCANS_SCHEDULES_HREF}>{DIGESTS_BROWSE_RELATED_ADVISORY_LABEL}</Link>
            </Button>
            <Button asChild size="sm" variant="outline">
              <Link href={INTEGRATIONS_READINESS_PATH}>{DIGESTS_BROWSE_RELATED_INTEGRATIONS_LABEL}</Link>
            </Button>
          </div>
        ) : showCompactFacts ? (
          <p className={cn("m-0 text-neutral-500 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
            Related:{" "}
            <Link
              className="text-al-link underline-offset-2 hover:underline"
              href={ADVISORY_SCANS_SCHEDULES_HREF}
            >
              Advisory schedules
            </Link>
            {" · "}
            <Link className="text-al-link underline-offset-2 hover:underline" href={INTEGRATIONS_READINESS_PATH}>
              Integration readiness
            </Link>
          </p>
        ) : null}
      </div>

      {showMetricGrid ? (
        <div className="mt-3 flex flex-wrap gap-x-6 gap-y-3" data-testid="digest-health-metrics">
          <HealthMetric label="Enabled schedules" value={String(snap.enabledAdvisoryScheduleCount)} />
          <HealthMetric label="Active subscriptions" value={String(snap.enabledDigestSubscriptionCount)} />
          <HealthMetric label="Sponsor recipients" value={executiveRecipients} />
          <HealthMetric
            label="Last sent"
            value={formatDigestInstant(
              snap.latestDigestSubscriptionDeliveryUtc ?? snap.latestArchitectureDigestGeneratedUtc,
            )}
          />
          <HealthMetric label="Next scheduled send" value={formatDigestInstant(snap.earliestNextAdvisoryRunUtc)} />
        </div>
      ) : null}
    </div>
  );
}
