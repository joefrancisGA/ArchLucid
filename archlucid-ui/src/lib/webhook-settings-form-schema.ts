import { z } from "zod";

export const webhookOutboundEventCatalog = [
  { id: "archlucid.alert.recorded", label: "Alert recorded" },
  { id: "archlucid.alert.acknowledged", label: "Alert acknowledged" },
  { id: "archlucid.alert.resolved", label: "Alert resolved" },
] as const satisfies ReadonlyArray<{ id: string; label: string }>;

export type WebhookSettingsFormValues = z.infer<typeof webhookSettingsFormSchema>;

export const webhookSettingsFormSchema = z.object({
  name: z.string().min(1, "Name is required.").max(200, "Name is too long."),
  webhookUrl: z.string().trim().url("Enter a valid https URL."),
  secret: z
    .string()
    .trim()
    .min(16, "Use a webhook secret at least 16 characters (rotate if you pasted a shorter value)."),
  channelType: z.enum(["TeamsWebhook", "SlackWebhook", "OnCallWebhook"]),
  minimumSeverity: z.enum(["Info", "Warning", "High", "Critical"]),
  eventTypes: z.array(z.string()).min(1, "Select at least one event type."),
});

export const webhookSettingsDefaultValues: WebhookSettingsFormValues = {
  name: "Outbound webhook",
  webhookUrl: "",
  secret: "",
  channelType: "TeamsWebhook",
  minimumSeverity: "High",
  eventTypes: ["archlucid.alert.recorded"],
};
