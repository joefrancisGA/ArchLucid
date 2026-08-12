import type { EnterpriseStatusKind } from "@/lib/design-tokens";
import { ADVISORY_SCANS_SCHEDULES_HREF } from "@/lib/advisory-scans-route";
import {
  DIGESTS_SCHEDULE_TAB_PATH,
  DIGESTS_SUBSCRIPTIONS_TAB_PATH,
} from "@/lib/digests-route-paths";
import {
  DIGESTS_BROWSE_GENERATE_FIRST_DETAIL,
  DIGESTS_BROWSE_GENERATE_FIRST_DETAIL_PREREQ,
  DIGESTS_BROWSE_GENERATE_FIRST_DONE_DETAIL,
  DIGESTS_BROWSE_GENERATE_FIRST_LABEL,
  DIGESTS_BROWSE_HISTORY_PENDING_DETAIL,
  DIGESTS_BROWSE_HISTORY_READY_DETAIL,
  DIGESTS_BROWSE_RELATED_ADVISORY_LABEL,
  DIGESTS_BROWSE_SETUP_STATUS_LABEL,
  DIGESTS_CHECKLIST_ACTION_ADD_SUBSCRIPTIONS,
  DIGESTS_CHECKLIST_ACTION_OPEN_ADVISORY,
  DIGESTS_CHECKLIST_ACTION_OPEN_EXECUTIVE,
  DIGESTS_CHECKLIST_ACTION_RUN_SCAN,
  DIGESTS_CHECKLIST_RECIPIENTS_DETAIL_SUFFIX,
  DIGESTS_CHECKLIST_SCHEDULE_DETAIL_PENDING,
  DIGESTS_CHECKLIST_SCHEDULE_LABEL,
} from "@/lib/digests-browse-copy";
import { formatInstantForLocale } from "@/lib/locale-datetime";
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
      href: ADVISORY_SCANS_SCHEDULES_HREF,
    };
  }

  if (trimmed === SUBSCRIPTION_GAP || /digest subscriptions/i.test(trimmed)) {
    return {
      title: "No active subscriptions",
      impact: "Generated digests have no outbound recipients in this scope.",
      actionLabel: "Create subscription",
      href: DIGESTS_SUBSCRIPTIONS_TAB_PATH,
    };
  }

  if (trimmed === EXEC_EMAIL_GAP || /executive email digest/i.test(trimmed)) {
    return {
      title: "Executive recipients not configured",
      impact: "Sponsor emails will not receive the executive rollup.",
      actionLabel: DIGESTS_CHECKLIST_ACTION_OPEN_EXECUTIVE,
      href: DIGESTS_SCHEDULE_TAB_PATH,
    };
  }

  return {
    title: "Digest setup needs attention",
    impact: trimmed.length > 0 ? trimmed : "Complete digest configuration to enable delivery.",
    actionLabel: DIGESTS_CHECKLIST_ACTION_OPEN_EXECUTIVE,
    href: DIGESTS_SCHEDULE_TAB_PATH,
  };
}

export function mapDigestSetupGaps(gaps: readonly string[]): DigestSetupGapAction[] {
  return gaps.map(mapDigestSetupGap);
}

export type DigestOverallStatus = {
  readonly kind: EnterpriseStatusKind;
  readonly label: string;
};

export type DigestSetupChecklistItem = {
  readonly id: string;
  readonly label: string;
  /** `null` when the step has no destination to send the operator to (status-only row). */
  readonly href: string | null;
  readonly actionLabel: string;
  readonly complete: boolean;
  readonly detail: string;
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
    return { kind: "draft", label: DIGESTS_BROWSE_SETUP_STATUS_LABEL };
  }

  return { kind: "needs-attention", label: "Action needed" };
}

/** Suggested primary setup step from the current health snapshot. */
export function resolveDigestNextBestAction(snap: WeeklyDigestHealthDto): DigestSetupGapAction | null {
  if (snap.enabledAdvisoryScheduleCount === 0) {
    return {
      title: DIGESTS_CHECKLIST_SCHEDULE_LABEL,
      impact: "Enable an advisory scan schedule to generate digests on a cadence.",
      actionLabel: DIGESTS_CHECKLIST_ACTION_OPEN_ADVISORY,
      href: ADVISORY_SCANS_SCHEDULES_HREF,
    };
  }

  if (snap.enabledDigestSubscriptionCount === 0) {
    return {
      title: "Add recipients or subscriptions",
      impact: "Add digest subscriptions so generated digests have outbound recipients.",
      actionLabel: DIGESTS_CHECKLIST_ACTION_ADD_SUBSCRIPTIONS,
      href: DIGESTS_SUBSCRIPTIONS_TAB_PATH,
    };
  }

  if (!snap.executiveEmailDigestEnabled && snap.executiveDigestRecipientCount === 0) {
    return {
      title: "Configure executive recipients",
      impact: "Optional sponsor rollup emails are configured on the Executive schedule tab.",
      actionLabel: DIGESTS_CHECKLIST_ACTION_OPEN_EXECUTIVE,
      href: DIGESTS_SCHEDULE_TAB_PATH,
    };
  }

  if (!hasGeneratedDigestHistory(snap)) {
    return {
      title: DIGESTS_BROWSE_GENERATE_FIRST_LABEL,
      impact: DIGESTS_BROWSE_GENERATE_FIRST_DETAIL,
      actionLabel: DIGESTS_CHECKLIST_ACTION_RUN_SCAN,
      href: ADVISORY_SCANS_SCHEDULES_HREF,
    };
  }

  return null;
}

/** True when at least one architecture digest has been generated for this scope. */
export function hasGeneratedDigestHistory(snap: WeeklyDigestHealthDto): boolean {
  const generatedUtc: string = snap.latestArchitectureDigestGeneratedUtc?.trim() ?? "";

  return generatedUtc.length > 0;
}

function pluralizeCount(count: number, singular: string, plural: string): string {
  return count === 1 ? singular : plural;
}

/** Checklist row detail for advisory scan schedule setup. */
export function formatChecklistScheduleDetail(snap: WeeklyDigestHealthDto): string {
  const count: number = snap.enabledAdvisoryScheduleCount;

  if (count === 0) {
    return DIGESTS_CHECKLIST_SCHEDULE_DETAIL_PENDING;
  }

  return `${count} enabled advisory scan ${pluralizeCount(count, "schedule", "schedules")} · next scheduled send ${formatDigestInstant(snap.earliestNextAdvisoryRunUtc)}`;
}

/** Checklist row detail for digest subscription recipients. */
export function formatChecklistRecipientsDetail(snap: WeeklyDigestHealthDto): string {
  const total: number = snap.enabledDigestSubscriptionCount;
  const email: number = snap.digestSubscriptionsByEmailChannel;
  const teams: number = snap.digestSubscriptionsByTeamsChannel;
  const slack: number = snap.digestSubscriptionsBySlackChannel;
  const channelBreakdown: string = `${email} email · ${teams} Teams · ${slack} Slack`;

  if (total === 0) {
    return `0 active digest subscriptions (0 email · 0 Teams · 0 Slack). ${DIGESTS_CHECKLIST_RECIPIENTS_DETAIL_SUFFIX}`;
  }

  return `${total} active digest ${pluralizeCount(total, "subscription", "subscriptions")} (${channelBreakdown}).`;
}

export function buildDigestSetupChecklistItems(
  snap: WeeklyDigestHealthDto,
  hasGeneratedDigests: boolean,
): readonly DigestSetupChecklistItem[] {
  const hasSchedule: boolean = snap.enabledAdvisoryScheduleCount > 0;
  const hasRecipients: boolean = snap.enabledDigestSubscriptionCount > 0;
  const hasTestDigest: boolean = hasGeneratedDigestHistory(snap);
  const prerequisitesForScan: boolean = hasSchedule && hasRecipients;

  return [
    {
      id: "schedule",
      label: DIGESTS_CHECKLIST_SCHEDULE_LABEL,
      href: ADVISORY_SCANS_SCHEDULES_HREF,
      actionLabel: DIGESTS_CHECKLIST_ACTION_OPEN_ADVISORY,
      complete: hasSchedule,
      detail: formatChecklistScheduleDetail(snap),
    },
    {
      id: "recipients",
      label: "Add recipients or subscriptions",
      href: DIGESTS_SUBSCRIPTIONS_TAB_PATH,
      actionLabel: DIGESTS_CHECKLIST_ACTION_ADD_SUBSCRIPTIONS,
      complete: hasRecipients,
      detail: formatChecklistRecipientsDetail(snap),
    },
    {
      id: "test",
      label: DIGESTS_BROWSE_GENERATE_FIRST_LABEL,
      // Scanning cannot produce a digest before a schedule and recipients exist, so the row stays
      // status-only until then rather than repeating step one's link to Advisory schedules.
      href: prerequisitesForScan ? ADVISORY_SCANS_SCHEDULES_HREF : null,
      actionLabel: DIGESTS_CHECKLIST_ACTION_RUN_SCAN,
      complete: hasTestDigest,
      detail: hasTestDigest
        ? DIGESTS_BROWSE_GENERATE_FIRST_DONE_DETAIL
        : prerequisitesForScan
          ? DIGESTS_BROWSE_GENERATE_FIRST_DETAIL
          : DIGESTS_BROWSE_GENERATE_FIRST_DETAIL_PREREQ,
    },
    {
      // Status-only: the checklist renders on Browse, so linking here would be a self-link.
      id: "history",
      label: "Review generated history",
      href: null,
      actionLabel: "Pending",
      complete: hasGeneratedDigests,
      detail: hasGeneratedDigests
        ? DIGESTS_BROWSE_HISTORY_READY_DETAIL
        : DIGESTS_BROWSE_HISTORY_PENDING_DETAIL,
    },
  ];
}

/**
 * True when a step the operator can still act on is incomplete.
 * The status-only `history` row is excluded — it is an outcome, not a task,
 * so an empty history alone must not make the surface look misconfigured.
 */
export function digestSetupHasIncompleteActionableStep(
  items: readonly DigestSetupChecklistItem[],
): boolean {
  return items.some((item) => item.href !== null && !item.complete);
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
  return formatInstantForLocale(value);
}
