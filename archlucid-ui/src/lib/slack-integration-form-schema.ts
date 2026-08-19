import { z } from "zod";

import { isSlackIncomingWebhookHostname } from "@/lib/integration-webhook-hostname";
/** Slack alert-routing event types stored in subscription metadata (matches backend catalog). */
export const slackIntegrationEventCatalog = [
  {
    id: "archlucid.alert.recorded",
    label: "Alert created",
    description: "Sent when a new governance alert is recorded.",
  },
  {
    id: "archlucid.alert.acknowledged",
    label: "Alert acknowledged",
    description: "Sent when an authorized user acknowledges an alert.",
  },
  {
    id: "archlucid.alert.resolved",
    label: "Alert resolved",
    description: "Sent when an alert is marked resolved.",
  },
] as const satisfies ReadonlyArray<{ id: string; label: string; description: string }>;

export type SlackIntegrationFormValues = z.infer<typeof slackIntegrationFormSchema>;

const slackWebhookUrlSchema = z
  .string()
  .trim()
  .superRefine((value, ctx) => {
    if (value.length === 0) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Enter a Slack incoming webhook URL." });

      return;
    }

    let parsed: URL;

    try {
      parsed = new URL(value);
    } catch {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Enter a valid HTTPS URL." });

      return;
    }

    if (parsed.protocol !== "https:") {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Webhook URL must use HTTPS." });

      return;
    }

    if (!isSlackIncomingWebhookHostname(parsed.hostname) || !parsed.pathname.startsWith("/services/")) {      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Use a Slack incoming webhook URL from hooks.slack.com.",
      });
    }
  });

export const slackIntegrationFormSchema = z.object({
  name: z.string().trim().min(1, "Enter a destination name.").max(200, "Destination name is too long."),
  webhookUrl: slackWebhookUrlSchema,
  secret: z
    .string()
    .trim()
    .superRefine((value, ctx) => {
      if (value.length === 0) {
        return;
      }

      if (value.length < 16) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "If you provide a signing secret, use at least 16 characters.",
        });
      }
    }),
  minimumSeverity: z.enum(["Info", "Warning", "High", "Critical"], {
    message: "Select a minimum alert severity.",
  }),
  eventTypes: z.array(z.string()).min(1, "Select at least one notification type."),
});

export const slackIntegrationDefaultValues: SlackIntegrationFormValues = {
  name: "",
  webhookUrl: "",
  secret: "",
  minimumSeverity: "High",
  eventTypes: ["archlucid.alert.recorded"],
};

export function labelForSlackIntegrationEventId(eventId: string): string {
  const match = slackIntegrationEventCatalog.find((row) => row.id === eventId);

  return match?.label ?? eventId;
}
