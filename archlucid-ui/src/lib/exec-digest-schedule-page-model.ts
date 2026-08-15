import { INTEGRATIONS_READINESS_PATH } from "@/lib/integrations-nav-paths";
import type { EnterpriseStatusKind } from "@/lib/design-tokens";
import type { WeeklyDigestHealthDto } from "@/types/operate-rhythm";
import type { ExecDigestPreferencesResponse } from "@/types/exec-digest-preferences";

import {
  computeExecDigestNextSendInstant,
  formatExecDigestCadenceLabel,
  formatExecDigestConfiguredCadenceSentence,
  formatExecDigestNextOccurrenceLabel,
  parseExecDigestRecipientEmails,
  type ExecDigestScheduleFormState,
} from "./exec-digest-schedule-form";
import { formatDigestInstant } from "./digest-setup-gap-actions";
import { formatIanaTimeZoneOptionLabel } from "./iana-time-zone-select";

export type ExecDigestStatusKind = "off" | "active" | "paused" | "setup-incomplete";

export type ExecDigestStatusPresentation = {
  readonly kind: ExecDigestStatusKind;
  readonly label: string;
  readonly statusTagKind: EnterpriseStatusKind;
  readonly summary: string;
};

export type ExecDigestDeliveryReadinessOverall =
  | "ready"
  | "setup-incomplete"
  | "paused"
  | "delivery-issue";

export type ExecDigestOutboundEmailStatus = "available" | "unavailable" | "not-verified";

export type ExecDigestDeliveryReadinessItem = {
  readonly id: string;
  readonly label: string;
  readonly value: string;
  readonly blocking: boolean;
  readonly actionLabel?: string;
  readonly actionHref?: string;
};

export type ExecDigestDeliveryReadinessModel = {
  readonly overall: ExecDigestDeliveryReadinessOverall;
  readonly overallLabel: string;
  readonly overallStatusTagKind: EnterpriseStatusKind;
  readonly nextAction: string | null;
  readonly items: readonly ExecDigestDeliveryReadinessItem[];
};

export type ExecDigestSavedScheduleSummary = {
  readonly statusLabel: string;
  readonly configuredCadence: string;
  readonly deliveryStatus: string;
  readonly timeZone: string;
  readonly nextScheduledSend: string;
  readonly directRecipientCount: number;
  readonly subscriptionDestinationCount: number;
  readonly lastScheduleUpdate: string;
  readonly recipientSummary: string;
};

const GROUP_MAILBOX_PATTERN = /@.*\.(onmicrosoft|google|groups)\./i;

export function resolveExecDigestOutboundEmailStatus(
  health: WeeklyDigestHealthDto | null,
): ExecDigestOutboundEmailStatus {
  if (health === null) {
    return "not-verified";
  }

  const hasOutboundIssue = health.setupGaps.some((gap) =>
    /outbound email|email channel|integration/i.test(gap),
  );

  if (hasOutboundIssue) {
    return "unavailable";
  }

  return "available";
}

export function formatExecDigestOutboundEmailStatusLabel(status: ExecDigestOutboundEmailStatus): string {
  switch (status) {
    case "available":
      return "Available";
    case "unavailable":
      return "Unavailable";
    case "not-verified":
      return "Not verified";
    default: {
      const exhaustive: never = status;
      return exhaustive;
    }
  }
}

export function formatExecDigestNextSendLabel(
  form: ExecDigestScheduleFormState,
  isConfigured: boolean,
): string {
  if (!form.emailEnabled) {
    if (!isConfigured) {
      return "Not scheduled until delivery is enabled";
    }

    return "Not scheduled while delivery is paused";
  }

  const next = computeExecDigestNextSendInstant(form);

  if (next === null) {
    return `${formatExecDigestCadenceLabel(form)} (${formatIanaTimeZoneOptionLabel(form.ianaTimeZoneId)})`;
  }

  return formatExecDigestNextOccurrenceLabel(next, form.ianaTimeZoneId);
}

export function findDuplicateExecDigestRecipientEmails(input: string): readonly string[] {
  const addresses: string[] = parseExecDigestRecipientEmails(input);
  const seen = new Set<string>();
  const duplicates = new Set<string>();

  for (const address of addresses) {
    const key = address.toLowerCase();

    if (seen.has(key)) {
      duplicates.add(address);
    }
    else {
      seen.add(key);
    }
  }

  return [...duplicates];
}

export function findUnsupportedExecDigestGroupMailboxes(input: string): readonly string[] {
  return parseExecDigestRecipientEmails(input).filter((address) => GROUP_MAILBOX_PATTERN.test(address));
}

export function resolveExecDigestStatus(
  saved: ExecDigestPreferencesResponse,
  form: ExecDigestScheduleFormState,
  unsavedChanges: boolean,
): ExecDigestStatusPresentation {
  const effectiveEnabled: boolean = unsavedChanges ? form.emailEnabled : saved.emailEnabled;
  const recipientInput: string = unsavedChanges ? form.recipients : saved.recipientEmails.join("; ");
  const recipientCount: number = parseExecDigestRecipientEmails(recipientInput).length;

  if (!effectiveEnabled) {
    if (saved.isConfigured) {
      return {
        kind: "paused",
        label: "Paused",
        statusTagKind: "draft",
        summary: "Delivery is paused. The configured schedule is retained but no sponsor digest emails will be sent.",
      };
    }

    return {
      kind: "off",
      label: "Setup incomplete",
      statusTagKind: "needs-attention",
      summary: "Add recipients and enable scheduled delivery when you are ready to send the weekly sponsor digest.",
    };
  }

  if (recipientCount === 0) {
    return {
      kind: "setup-incomplete",
      label: "Setup incomplete",
      statusTagKind: "needs-attention",
      summary: "Add at least one direct recipient before enabling scheduled delivery.",
    };
  }

  return {
    kind: "active",
    label: "Active",
    statusTagKind: "ready",
    summary: "Scheduled sponsor digest emails will be sent to the direct recipients configured here.",
  };
}

export function buildExecDigestRecipientSummary(
  directCount: number,
  subscriptionDestinationCount: number,
): string {
  return `${directCount} direct, ${subscriptionDestinationCount} subscription`;
}

export function buildExecDigestSavedScheduleSummary(
  saved: ExecDigestPreferencesResponse,
  health: WeeklyDigestHealthDto | null,
): ExecDigestSavedScheduleSummary {
  const form: ExecDigestScheduleFormState = {
    emailEnabled: saved.emailEnabled,
    recipients: saved.recipientEmails.join("; "),
    ianaTimeZoneId: saved.ianaTimeZoneId,
    dayOfWeek: saved.dayOfWeek,
    hourOfDay: saved.hourOfDay,
  };
  const subscriptionDestinationCount = health?.enabledDigestSubscriptionCount ?? 0;
  const deliveryStatus = saved.emailEnabled
    ? "Ready"
    : saved.isConfigured
      ? "Paused"
      : "Setup incomplete";

  return {
    statusLabel: deliveryStatus,
    configuredCadence: formatExecDigestConfiguredCadenceSentence(form),
    deliveryStatus,
    timeZone: formatIanaTimeZoneOptionLabel(saved.ianaTimeZoneId),
    nextScheduledSend: formatExecDigestNextSendLabel(form, saved.isConfigured),
    directRecipientCount: saved.recipientEmails.length,
    subscriptionDestinationCount,
    lastScheduleUpdate: formatDigestInstant(saved.updatedUtc),
    recipientSummary: buildExecDigestRecipientSummary(
      saved.recipientEmails.length,
      subscriptionDestinationCount,
    ),
  };
}

export function buildExecDigestDeliveryReadiness(
  saved: ExecDigestPreferencesResponse,
  form: ExecDigestScheduleFormState,
  health: WeeklyDigestHealthDto | null,
  unsavedChanges: boolean,
): ExecDigestDeliveryReadinessModel {
  const status = resolveExecDigestStatus(saved, form, unsavedChanges);
  const recipientInput: string = unsavedChanges ? form.recipients : saved.recipientEmails.join("; ");
  const recipientCount: number = parseExecDigestRecipientEmails(recipientInput).length;
  const outboundStatus = resolveExecDigestOutboundEmailStatus(health);
  const outboundLabel = formatExecDigestOutboundEmailStatusLabel(outboundStatus);
  const outboundReady = outboundStatus === "available";
  const scheduleValid =
    form.dayOfWeek >= 0 &&
    form.dayOfWeek <= 6 &&
    form.hourOfDay >= 0 &&
    form.hourOfDay <= 23 &&
    form.ianaTimeZoneId.trim().length > 0;

  const items: ExecDigestDeliveryReadinessItem[] = [
    {
      id: "delivery-enabled",
      label: "Scheduled delivery",
      value:
        status.kind === "active"
          ? "Enabled"
          : status.kind === "paused"
            ? "Paused"
            : "Not enabled",
      blocking: status.kind === "setup-incomplete" || status.kind === "off",
    },
    {
      id: "recipient-readiness",
      label: "Direct recipients",
      value:
        recipientCount === 0
          ? "None configured"
          : `${recipientCount} recipient${recipientCount === 1 ? "" : "s"}`,
      blocking: recipientCount === 0 && (form.emailEnabled || status.kind === "active"),
      actionLabel: recipientCount === 0 ? "Add recipients" : undefined,
    },
    {
      id: "schedule-valid",
      label: "Schedule",
      value: scheduleValid
        ? formatExecDigestConfiguredCadenceSentence(form)
        : "Incomplete",
      blocking: !scheduleValid,
    },
    {
      id: "outbound-email",
      label: "Email delivery",
      value: outboundLabel,
      blocking: outboundStatus === "unavailable",
      actionLabel: outboundReady ? undefined : "Check delivery setup",
      actionHref: outboundReady ? undefined : INTEGRATIONS_READINESS_PATH,
    },
    {
      id: "next-send",
      label: "Next send",
      value: formatExecDigestNextSendLabel(form, saved.isConfigured),
      blocking: false,
    },
  ];

  const hasDeliveryIssue = items.some((item) => item.id === "outbound-email" && item.blocking);
  const hasSetupGap =
    status.kind === "setup-incomplete" ||
    status.kind === "off" ||
    items.some((item) => item.blocking && item.id !== "outbound-email");

  let overall: ExecDigestDeliveryReadinessOverall;
  let overallLabel: string;
  let overallStatusTagKind: EnterpriseStatusKind;
  let nextAction: string | null = null;

  if (hasDeliveryIssue) {
    overall = "delivery-issue";
    overallLabel = "Delivery issue";
    overallStatusTagKind = "blocked";
    nextAction = "Check email delivery setup before enabling scheduled delivery.";
  }
  else if (status.kind === "paused") {
    overall = "paused";
    overallLabel = "Paused";
    overallStatusTagKind = "draft";
    nextAction =
      recipientCount === 0
        ? "Add at least one recipient before enabling scheduled delivery."
        : "Enable scheduled delivery when you are ready to send.";
  }
  else if (hasSetupGap) {
    overall = "setup-incomplete";
    overallLabel = "Setup incomplete";
    overallStatusTagKind = "needs-attention";
    nextAction =
      recipientCount === 0
        ? "Add at least one recipient before enabling scheduled delivery."
        : "Enable scheduled delivery after reviewing the cadence and recipients.";
  }
  else if (health === null) {
    overall = "setup-incomplete";
    overallLabel = "Verifying delivery";
    overallStatusTagKind = "draft";
    nextAction = "Checking email delivery readiness before confirming scheduled delivery.";
  }
  else {
    overall = "ready";
    overallLabel = "Ready";
    overallStatusTagKind = "ready";
    nextAction = null;
  }

  return {
    overall,
    overallLabel,
    overallStatusTagKind,
    nextAction,
    items,
  };
}

/** Hub relationship copy — accurate to separate sponsor vs architecture digest pipelines. */
export const EXEC_DIGEST_PRODUCT_INTRO =
  "An sponsor digest is a weekly rollup of architecture and review activity for sponsor recipients you configure here. Architecture digests generated from advisory scans are delivered separately to destinations on the Subscriptions tab." as const;

export const EXEC_DIGEST_DIRECT_RECIPIENTS_HELPER =
  "Direct recipients receive this sponsor digest email. They do not need to be workspace users. Enter one address per line, or separate addresses with commas or semicolons. Duplicate addresses are rejected before save." as const;

export const EXEC_DIGEST_SUBSCRIPTIONS_HELPER =
  "Subscription destinations receive architecture digests after advisory scans run. They use a different schedule and content than the sponsor digest on this page." as const;

export const EXEC_DIGEST_PREVIEW_HELPER =
  "Preview opens the latest architecture digest in Browse. It is not an sponsor-digest compose preview and does not use unsaved schedule changes." as const;

export const EXEC_DIGEST_PREVIEW_UNAVAILABLE =
  "A preview will be available after the first architecture digest is generated." as const;

export const EXEC_DIGEST_TEST_GENERATION_HELPER =
  "This opens advisory scan schedules so you can generate an architecture digest for subscription destinations. It may consume AI budget, does not email sponsor recipients on this page, and does not change the sponsor schedule saved here." as const;

export const EXEC_DIGEST_SAMPLE_BLOCKED =
  "Scheduling is unavailable in the sample workspace. Start an evaluation or sign in to configure sponsor digest delivery for your organization." as const;

export const EXEC_DIGEST_READ_ONLY =
  "You can review the sponsor digest schedule. Changing recipients, cadence, or delivery requires a role that can manage digests." as const;

export const DIGESTS_SCHEDULE_TAB_RESPONSIBILITY =
  "Sponsor sponsor rollup email — separate from advisory scan cadence (Advisory schedules)." as const;

export const DIGESTS_BROWSE_TAB_RESPONSIBILITY =
  "Read generated architecture digest history." as const;

export const DIGESTS_BROWSE_TAB_GET_STARTED_RESPONSIBILITY =
  "Complete setup steps before digest history appears on this tab." as const;

export const DIGESTS_SUBSCRIPTIONS_TAB_RESPONSIBILITY =
  "Manage who receives architecture digest delivery." as const;
