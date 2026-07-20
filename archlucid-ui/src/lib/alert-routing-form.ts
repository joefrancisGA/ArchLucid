import { labelForAlertRoutingFindingType } from "@/lib/alert-routing-finding-type-labels";

export const ALERT_ROUTING_SEVERITY_ORDER = ["Info", "Warning", "High", "Critical"] as const;

export type AlertRoutingChannelType = "Email" | "TeamsWebhook" | "SlackWebhook" | "OnCallWebhook";

export type AlertRoutingFieldErrors = {
  name?: string;
  destination?: string;
};

const EMAIL_ADDRESS_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function severitiesAtOrAboveMinimum(minimumSeverity: string): string[] {
  const normalized = minimumSeverity.trim().toLowerCase();
  const startIndex = ALERT_ROUTING_SEVERITY_ORDER.findIndex(
    (severity) => severity.toLowerCase() === normalized,
  );

  if (startIndex < 0) {
    return [minimumSeverity];
  }

  return [...ALERT_ROUTING_SEVERITY_ORDER.slice(startIndex)];
}

export function formatMinimumSeverityPreview(minimumSeverity: string): string {
  const included = severitiesAtOrAboveMinimum(minimumSeverity);

  if (included.length === 0) {
    return "Choose a minimum severity to preview which alerts will be delivered.";
  }

  if (included.length === 1) {
    return `This destination will receive ${included[0]} alerts only.`;
  }

  if (included.length === 2) {
    return `This destination will receive ${included[0]} and ${included[1]} alerts.`;
  }

  const last = included[included.length - 1];
  const rest = included.slice(0, -1).join(", ");

  return `This destination will receive ${rest}, and ${last} alerts.`;
}

export function destinationFieldLabel(channelType: string): string {
  switch (channelType) {
    case "Email":
      return "Email recipients";
    case "TeamsWebhook":
      return "Microsoft Teams webhook URL";
    case "SlackWebhook":
      return "Slack webhook URL";
    case "OnCallWebhook":
      return "On-call webhook URL";
    default:
      return "Destination";
  }
}

export function destinationFieldPlaceholder(channelType: string): string {
  switch (channelType) {
    case "Email":
      return "security@example.com, ops@example.com";
    case "TeamsWebhook":
    case "SlackWebhook":
    case "OnCallWebhook":
      return "https://";
    default:
      return "";
  }
}

export function destinationFieldHelper(channelType: string): string {
  switch (channelType) {
    case "Email":
      return "Separate multiple addresses with commas. Webhook URLs are not used for email delivery.";
    case "TeamsWebhook":
      return "Paste the incoming webhook URL from your Teams channel. Must use HTTPS.";
    case "SlackWebhook":
      return "Paste the incoming webhook URL from your Slack app. Must use HTTPS.";
    case "OnCallWebhook":
      return "Paste the HTTPS endpoint for your on-call or paging integration.";
    default:
      return "";
  }
}

export function validateAlertRoutingDestination(channelType: string, destination: string): string | null {
  const trimmed = destination.trim();

  if (trimmed.length === 0) {
    return "Enter a destination for this notification channel.";
  }

  if (channelType === "Email") {
    const addresses = trimmed
      .split(/[,;]/)
      .map((entry) => entry.trim())
      .filter((entry) => entry.length > 0);

    if (addresses.length === 0) {
      return "Enter at least one email address.";
    }

    for (const address of addresses) {
      if (!EMAIL_ADDRESS_RE.test(address)) {
        return `Enter a valid email address (${address}).`;
      }
    }

    return null;
  }

  try {
    const url = new URL(trimmed);

    if (url.protocol !== "https:") {
      return "Webhook destinations must use HTTPS.";
    }
  } catch {
    return "Enter a valid HTTPS webhook URL.";
  }

  return null;
}

export function validateAlertRoutingName(name: string): string | null {
  if (name.trim().length === 0) {
    return "Enter a name for this notification destination.";
  }

  return null;
}

export function formatAlertRoutingFiltersSummary(input: {
  minimumSeverity: string;
  severities: string[];
  findingTypes: string[];
  tags: string[];
}): string {
  const parts: string[] = [];

  if (input.severities.length > 0) {
    parts.push(`Exact severities: ${input.severities.join(", ")}`);
  } else {
    parts.push(`Minimum severity: ${input.minimumSeverity}`);
  }

  if (input.findingTypes.length > 0) {
    parts.push(
      `Categories: ${input.findingTypes.map((entry) => labelForAlertRoutingFindingType(entry)).join(", ")}`,
    );
  }

  if (input.tags.length > 0) {
    parts.push(`Review labels: ${input.tags.join(", ")}`);
  }

  return parts.join(" · ");
}

export function channelDisplayLabel(channelType: string): string {
  switch (channelType) {
    case "Email":
      return "Email";
    case "TeamsWebhook":
      return "Microsoft Teams";
    case "SlackWebhook":
      return "Slack";
    case "OnCallWebhook":
      return "On-call webhook";
    default:
      return channelType;
  }
}

export function isWebhookChannelType(channelType: string): boolean {
  return channelType === "TeamsWebhook" || channelType === "SlackWebhook" || channelType === "OnCallWebhook";
}
