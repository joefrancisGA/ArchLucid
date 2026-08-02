import type { EnterpriseStatusKind } from "@/lib/design-tokens";
import { ADVISORY_SCANS_SCHEDULES_HREF } from "@/lib/advisory-scans-route";
import { DIGESTS_BROWSE_SEND_TEST_LABEL } from "@/lib/digests-browse-copy";
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

export type DigestSetupChecklistItem = {
  readonly id: string;
  readonly label: string;
  readonly href: string;
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
    return { kind: "draft", label: "Setup needed" };
  }

  return { kind: "needs-attention", label: "Action needed" };
}

/** Suggested primary setup step from the current health snapshot. */
export function resolveDigestNextBestAction(snap: WeeklyDigestHealthDto): DigestSetupGapAction | null {
  if (snap.enabledAdvisoryScheduleCount === 0) {
    return {
      title: "Configure schedule",
      impact: "Enable an advisory scan schedule to generate digests on a cadence.",
      actionLabel: "Configure schedule",
      href: ADVISORY_SCANS_SCHEDULES_HREF,
    };
  }

  if (snap.enabledDigestSubscriptionCount === 0) {
    return {
      title: "Add recipients or subscriptions",
      impact: "Add digest subscriptions so generated digests have outbound recipients.",
      actionLabel: "Add subscriptions",
      href: "/digests?tab=subscriptions",
    };
  }

  if (!snap.executiveEmailDigestEnabled && snap.executiveDigestRecipientCount === 0) {
    return {
      title: "Configure executive recipients",
      impact: "Optional sponsor rollup emails are configured on the Schedule tab.",
      actionLabel: "Configure schedule",
      href: "/digests?tab=schedule",
    };
  }

  if (
    snap.latestArchitectureDigestGeneratedUtc === null ||
    snap.latestArchitectureDigestGeneratedUtc === undefined ||
    snap.latestArchitectureDigestGeneratedUtc.trim() === ""
  ) {
    return {
      title: "Send test digest",
      impact: "Generate the first digest to verify delivery and preview content.",
      actionLabel: DIGESTS_BROWSE_SEND_TEST_LABEL,
      href: ADVISORY_SCANS_SCHEDULES_HREF,
    };
  }

  return null;
}

export function buildDigestSetupChecklistItems(
  snap: WeeklyDigestHealthDto,
  hasGeneratedDigests: boolean,
): readonly DigestSetupChecklistItem[] {
  const hasSchedule: boolean = snap.enabledAdvisoryScheduleCount > 0;
  const hasRecipients: boolean = snap.enabledDigestSubscriptionCount > 0;
  const hasTestDigest: boolean =
    snap.latestArchitectureDigestGeneratedUtc !== null &&
    snap.latestArchitectureDigestGeneratedUtc !== undefined &&
    snap.latestArchitectureDigestGeneratedUtc.trim() !== "";

  return [
    {
      id: "schedule",
      label: "Configure schedule",
      href: ADVISORY_SCANS_SCHEDULES_HREF,
      complete: hasSchedule,
      detail: hasSchedule ? "Advisory scan schedule enabled." : "Enable a cadence for digest generation.",
    },
    {
      id: "recipients",
      label: "Add recipients or subscriptions",
      href: "/digests?tab=subscriptions",
      complete: hasRecipients,
      detail: hasRecipients ? "Active digest subscriptions configured." : "Add outbound recipients for delivery.",
    },
    {
      id: "test",
      label: DIGESTS_BROWSE_SEND_TEST_LABEL,
      href: ADVISORY_SCANS_SCHEDULES_HREF,
      complete: hasTestDigest,
      detail: hasTestDigest ? "At least one digest has been generated." : "Verify delivery with a test digest.",
    },
    {
      id: "history",
      label: "Review generated history",
      href: "/digests?tab=browse",
      complete: hasGeneratedDigests,
      detail: hasGeneratedDigests ? "Digest history is available below." : "Generated digests will appear in this list.",
    },
  ];
}

export function digestSetupShowsRecipientClarification(snap: WeeklyDigestHealthDto): boolean {
  const hasSubscriptionGap: boolean = snap.setupGaps.some((gap) => /digest subscriptions/i.test(gap));
  const hasExecutiveGap: boolean = snap.setupGaps.some((gap) => /executive email digest/i.test(gap));

  return hasSubscriptionGap && hasExecutiveGap;
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
