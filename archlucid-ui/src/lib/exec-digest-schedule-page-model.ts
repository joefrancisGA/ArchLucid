import { INTEGRATIONS_READINESS_PATH } from "@/lib/integrations-nav-paths";
import type { EnterpriseStatusKind } from "@/lib/design-tokens";
import type { WeeklyDigestHealthDto } from "@/types/operate-rhythm";
import type { ExecDigestPreferencesResponse } from "@/types/exec-digest-preferences";

import {
  formatExecDigestCadenceLabel,
  parseExecDigestRecipientEmails,
  type ExecDigestScheduleFormState,
} from "./exec-digest-schedule-form";
import { formatDigestInstant } from "./digest-setup-gap-actions";
import { formatIanaTimeZoneOptionLabel } from "./iana-time-zone-select";

export type ExecDigestStatusKind = "off" | "active" | "paused" | "setup-required";

export type ExecDigestStatusPresentation = {
  readonly kind: ExecDigestStatusKind;
  readonly label: string;
  readonly statusTagKind: EnterpriseStatusKind;
  readonly summary: string;
};

export type ExecDigestDeliveryReadinessItem = {
  readonly id: string;
  readonly label: string;
  readonly value: string;
  readonly blocking: boolean;
  readonly actionLabel?: string;
  readonly actionHref?: string;
};

export type ExecDigestSavedScheduleSummary = {
  readonly statusLabel: string;
  readonly cadence: string;
  readonly timeZone: string;
  readonly nextScheduledSend: string;
  readonly directRecipientCount: number;
  readonly subscriptionRecipientCount: number;
  readonly lastSuccessfulDelivery: string;
  readonly lastFailedDelivery: string;
};

const GROUP_MAILBOX_PATTERN = /@.*\.(onmicrosoft|google|groups)\./i;

export function formatExecDigestNextSendLabel(form: ExecDigestScheduleFormState): string {
  if (!form.emailEnabled) {
    return "Not scheduled";
  }

  return `${formatExecDigestCadenceLabel(form)} (${formatIanaTimeZoneOptionLabel(form.ianaTimeZoneId)})`;
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
        summary: "No scheduled emails will be sent.",
      };
    }

    return {
      kind: "off",
      label: "Off",
      statusTagKind: "draft",
      summary: "No scheduled emails will be sent.",
    };
  }

  if (recipientCount === 0 || (!saved.isConfigured && unsavedChanges)) {
    return {
      kind: "setup-required",
      label: "Setup required",
      statusTagKind: "needs-attention",
      summary: "Add at least one recipient and save to activate delivery.",
    };
  }

  return {
    kind: "active",
    label: "Active",
    statusTagKind: "ready",
    summary: "Scheduled emails will be sent to configured executive recipients.",
  };
}

export function buildExecDigestSavedScheduleSummary(
  saved: ExecDigestPreferencesResponse,
  health: WeeklyDigestHealthDto | null,
): ExecDigestSavedScheduleSummary {
  const form = {
    emailEnabled: saved.emailEnabled,
    recipients: saved.recipientEmails.join("; "),
    ianaTimeZoneId: saved.ianaTimeZoneId,
    dayOfWeek: saved.dayOfWeek,
    hourOfDay: saved.hourOfDay,
  };

  return {
    statusLabel: saved.emailEnabled ? "Active" : saved.isConfigured ? "Paused" : "Off",
    cadence: saved.emailEnabled ? formatExecDigestCadenceLabel(form) : "—",
    timeZone: formatIanaTimeZoneOptionLabel(saved.ianaTimeZoneId),
    nextScheduledSend: saved.emailEnabled ? formatExecDigestNextSendLabel(form) : "Not scheduled",
    directRecipientCount: saved.recipientEmails.length,
    subscriptionRecipientCount: health?.enabledDigestSubscriptionCount ?? 0,
    lastSuccessfulDelivery: formatDigestInstant(health?.latestDigestSubscriptionDeliveryUtc),
    lastFailedDelivery: "—",
  };
}

export function buildExecDigestDeliveryReadiness(
  saved: ExecDigestPreferencesResponse,
  form: ExecDigestScheduleFormState,
  health: WeeklyDigestHealthDto | null,
  unsavedChanges: boolean,
): readonly ExecDigestDeliveryReadinessItem[] {
  const status = resolveExecDigestStatus(saved, form, unsavedChanges);
  const recipientInput: string = unsavedChanges ? form.recipients : saved.recipientEmails.join("; ");
  const recipientCount: number = parseExecDigestRecipientEmails(recipientInput).length;
  const outboundReady: boolean =
    health === null
      ? true
      : !health.setupGaps.some((gap) => /outbound email|email channel|integration/i.test(gap));

  const items: ExecDigestDeliveryReadinessItem[] = [
    {
      id: "digest-status",
      label: "Digest status",
      value: status.label,
      blocking: status.kind === "setup-required",
    },
    {
      id: "recipient-readiness",
      label: "Recipient readiness",
      value:
        recipientCount === 0
          ? "None"
          : `${recipientCount} direct recipient${recipientCount === 1 ? "" : "s"}`,
      blocking: status.kind !== "off" && recipientCount === 0,
      actionLabel: recipientCount === 0 ? "Add recipients" : undefined,
    },
    {
      id: "outbound-email",
      label: "Outbound email readiness",
      value: outboundReady ? "Ready" : "Unavailable",
      blocking: !outboundReady,
      actionLabel: outboundReady ? undefined : "Check integration readiness",
      actionHref: outboundReady ? undefined : INTEGRATIONS_READINESS_PATH,
    },
    {
      id: "next-send",
      label: "Next scheduled send",
      value: formatExecDigestNextSendLabel(form),
      blocking: false,
    },
  ];

  return items.filter((item) => item.blocking || item.id === "next-send" || item.id === "digest-status");
}

export const EXEC_DIGEST_DIRECT_RECIPIENTS_HELPER =
  "Direct recipients receive the executive rollup email configured on this page. Architecture digest subscriptions on the Subscriptions tab are separate." as const;

export const EXEC_DIGEST_PREVIEW_HELPER =
  "Preview opens the latest generated digest and does not reflect unsaved schedule changes." as const;

export const EXEC_DIGEST_TEST_GENERATION_HELPER =
  "Generates a new architecture digest from an advisory scan and delivers it to subscription recipients. This may consume AI budget and does not change the executive schedule saved here." as const;
