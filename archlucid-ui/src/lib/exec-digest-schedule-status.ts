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

const GROUP_MAILBOX_PATTERN = /@.*\.(onmicrosoft|google|groups)\./i;

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
