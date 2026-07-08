import type { EnterpriseStatusKind } from "@/lib/design-tokens";
import type { WeeklyDigestHealthDto } from "@/types/operate-rhythm";

/** Actionable setup gap for the digests health card. */
export type DigestSetupGapAction = {
  readonly title: string;
  readonly impact: string;
  readonly actionLabel: string;
  readonly href: string;
};

const ADVISORY_SCHEDULE_GAP =
  "No enabled advisory scan schedule — weekly architecture digests will not be generated on a cadence.";
const SUBSCRIPTION_GAP =
  "No digest subscriptions — generated digests have no outbound recipients in this scope.";
const EXEC_EMAIL_GAP =
  "Executive email digest is not fully configured — sponsor emails will not receive the separate executive rollup.";

/**
 * Maps a backend setup-gap string to title, impact, and a next-action link.
 * Unknown gaps fall back to a generic configure action on the Schedule tab.
 */
export function mapDigestSetupGap(gap: string): DigestSetupGapAction {
  const trimmed: string = gap.trim();

  if (trimmed === ADVISORY_SCHEDULE_GAP || /advisory scan schedule/i.test(trimmed)) {
    return {
      title: "No advisory scan schedule",
      impact: "Weekly digests will not be generated automatically.",
      actionLabel: "Open schedules",
      href: "/advisory?tab=schedules",
    };
  }

  if (trimmed === SUBSCRIPTION_GAP || /digest subscriptions/i.test(trimmed)) {
    return {
      title: "No active subscriptions",
      impact: "Generated digests have no outbound recipients in this scope.",
      actionLabel: "Create subscription",
      href: "/digests?tab=subscriptions",
    };
  }

  if (trimmed === EXEC_EMAIL_GAP || /executive email digest/i.test(trimmed)) {
    return {
      title: "Executive recipients not configured",
      impact: "Sponsor emails will not receive the executive rollup.",
      actionLabel: "Configure schedule",
      href: "/digests?tab=schedule",
    };
  }

  return {
    title: "Digest setup needs attention",
    impact: trimmed.length > 0 ? trimmed : "Complete digest configuration to enable delivery.",
    actionLabel: "Configure schedule",
    href: "/digests?tab=schedule",
  };
}

export function mapDigestSetupGaps(gaps: readonly string[]): DigestSetupGapAction[] {
  return gaps.map(mapDigestSetupGap);
}

export type DigestOverallStatus = {
  readonly kind: EnterpriseStatusKind;
  readonly label: string;
};

/** Overall digest loop status from the weekly health snapshot. */
export function resolveDigestOverallStatus(snap: WeeklyDigestHealthDto): DigestOverallStatus {
  const healthyLoop: boolean =
    snap.enabledAdvisoryScheduleCount > 0 &&
    snap.enabledDigestSubscriptionCount > 0 &&
    snap.executiveEmailDigestEnabled;

  if (healthyLoop) {
    return { kind: "ready", label: "Ready" };
  }

  if (
    snap.enabledAdvisoryScheduleCount === 0 &&
    snap.enabledDigestSubscriptionCount === 0 &&
    !snap.executiveEmailDigestEnabled
  ) {
    return { kind: "blocked", label: "Not configured" };
  }

  return { kind: "needs-attention", label: "Action needed" };
}

/** True when schedules, subscriptions, or executive email already have some configuration. */
export function digestsHaveExistingConfiguration(snap: WeeklyDigestHealthDto): boolean {
  return (
    snap.enabledAdvisoryScheduleCount > 0 ||
    snap.digestSubscriptionCount > 0 ||
    snap.executiveEmailDigestIsConfigured ||
    snap.executiveEmailDigestEnabled
  );
}

/** Formats an optional UTC instant for operator surfaces; returns em dash when missing. */
export function formatDigestInstant(value: string | null | undefined): string {
  if (value === null || value === undefined || value.trim() === "") {
    return "—";
  }

  const parsed: Date = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return "—";
  }

  return parsed.toLocaleString();
}
