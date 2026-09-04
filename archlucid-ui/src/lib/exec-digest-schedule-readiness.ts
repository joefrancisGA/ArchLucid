import { INTEGRATIONS_READINESS_PATH } from "@/lib/integrations-nav-paths";
import type { EnterpriseStatusKind } from "@/lib/design-tokens";
import type { WeeklyDigestHealthDto } from "@/types/operate-rhythm";
import type { ExecDigestPreferencesResponse } from "@/types/exec-digest-preferences";

import {
  formatExecDigestConfiguredCadenceSentence,
  parseExecDigestRecipientEmails,
  type ExecDigestScheduleFormState,
} from "./exec-digest-schedule-form";
import {
  formatExecDigestNextSendLabel,
  resolveExecDigestStatus,
} from "./exec-digest-schedule-status";

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
