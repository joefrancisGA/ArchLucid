import { z } from "zod";

export const webhookOutboundEventCatalog = [
  {
    id: "archlucid.alert.recorded",
    label: "Alert recorded",
    description: "Send when a new alert is created.",
  },
  {
    id: "archlucid.alert.acknowledged",
    label: "Alert acknowledged",
    description: "Send when an operator acknowledges an alert.",
  },
  {
    id: "archlucid.alert.resolved",
    label: "Alert resolved",
    description: "Send when an alert is resolved.",
  },
] as const satisfies ReadonlyArray<{ id: string; label: string; description: string }>;

export type WebhookSettingsFormValues = z.infer<typeof webhookSettingsFormSchema>;

const httpsWebhookUrlSchema = z
  .string()
  .trim()
  .superRefine((value, ctx) => {
    if (value.length === 0) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Destination URL is required." });

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
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Destination URL must use HTTPS." });
    }
  });

export const webhookSettingsFormSchema = z.object({
  name: z.string().min(1, "Subscription name is required.").max(200, "Subscription name is too long."),
  webhookUrl: httpsWebhookUrlSchema,
  secret: z
    .string()
    .trim()
    .min(16, "Signing secret must be at least 16 characters."),
  channelType: z.enum(["TeamsWebhook", "SlackWebhook", "OnCallWebhook"]),
  minimumSeverity: z.enum(["Info", "Warning", "High", "Critical"]),
  eventTypes: z.array(z.string()).min(1, "Select at least one event."),
});

export const webhookSettingsDefaultValues: WebhookSettingsFormValues = {
  name: "",
  webhookUrl: "",
  secret: "",
  channelType: "OnCallWebhook",
  minimumSeverity: "High",
  eventTypes: ["archlucid.alert.recorded"],
};

export const WEBHOOK_CHANNEL_TYPE_LABELS: Record<WebhookSettingsFormValues["channelType"], string> = {
  TeamsWebhook: "Microsoft Teams Incoming Webhook",
  SlackWebhook: "Slack Incoming Webhook",
  OnCallWebhook: "Custom / On-call webhook",
};

export function labelForWebhookEventId(eventId: string): string {
  const match = webhookOutboundEventCatalog.find((row) => row.id === eventId);

  return match?.label ?? eventId;
}
