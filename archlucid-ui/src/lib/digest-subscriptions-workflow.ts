import { isConnectorReady } from "@/lib/connector-operations-present";
import { ADVISORY_SCANS_SCHEDULES_HREF } from "@/lib/advisory-scans-route";
import { DIGEST_TYPE_OPTIONS } from "@/lib/digest-subscription-form";
import { formatDigestInstant } from "@/lib/digest-setup-gap-actions";
import type { DigestSubscription } from "@/types/digest-subscriptions";
import type { TenantIntegrationsOperationsDto, WeeklyDigestHealthDto } from "@/types/operate-rhythm";

export const DIGEST_SUBSCRIPTIONS_PAGE_TITLE = "Delivery destinations" as const;

export const DIGEST_SUBSCRIPTIONS_PAGE_SUBTITLE =
  "Send architecture digests to email or webhook destinations your team already uses." as const;

export const DIGEST_SUBSCRIPTIONS_SENSITIVE_CONTENT_NOTE =
  "Digests include summary text and links back to ArchLucid. They do not attach raw evidence files unless your workspace enables that separately." as const;

export const DIGEST_SUBSCRIPTIONS_SENSITIVE_CONTENT_HELP_HREF = "/help/data-handling" as const;

export const DIGEST_SUBSCRIPTIONS_SEND_TEST_HREF = ADVISORY_SCANS_SCHEDULES_HREF;

export type DigestSubscriptionReadinessRow = {
  readonly id: string;
  readonly label: string;
  readonly value: string;
  readonly detail: string;
  readonly href: string | null;
};

export type DigestSubscriptionReadinessSummary = {
  readonly rows: readonly DigestSubscriptionReadinessRow[];
  readonly blockingIssue: string | null;
  readonly nextActionLabel: string | null;
  readonly nextActionHref: string | null;
};

export function shouldShowDigestTypeSelector(): boolean {
  return DIGEST_TYPE_OPTIONS.length > 1;
}

export function activationCheckboxLabel(enabled: boolean): string {
  if (enabled) {
    return "Enable delivery after saving";
  }

  return "Save as paused";
}

export function suggestedSubscriptionName(channelType: string): string {
  switch (channelType) {
    case "Email":
      return "Architecture digest — email";
    case "TeamsWebhook":
      return "Architecture digest — Microsoft Teams";
    case "SlackWebhook":
      return "Architecture digest — Slack";
    default:
      return "Architecture digest";
  }
}

export function channelIntegrationSetupHref(channelType: string): string | null {
  switch (channelType) {
    case "TeamsWebhook":
      return "/integrations/teams";
    case "SlackWebhook":
      return "/integrations/slack";
    default:
      return null;
  }
}

export function channelIntegrationConnectorKey(channelType: string): "teams" | "slack" | null {
  switch (channelType) {
    case "TeamsWebhook":
      return "teams";
    case "SlackWebhook":
      return "slack";
    default:
      return null;
  }
}

export function resolveConnectorReadyForChannel(
  operations: TenantIntegrationsOperationsDto | null,
  channelType: string,
): boolean | null {
  const connectorKey = channelIntegrationConnectorKey(channelType);

  if (connectorKey === null || operations === null) {
    return null;
  }

  const connector = operations.connectors.find((row) => row.connectorKey === connectorKey);

  if (connector === undefined) {
    return null;
  }

  return isConnectorReady(connector);
}

export function parseDigestTypeFromMetadata(metadataJson: string): string {
  try {
    const parsed: { digestType?: string } = JSON.parse(metadataJson) as { digestType?: string };

    if (typeof parsed.digestType === "string" && parsed.digestType.trim().length > 0) {
      return parsed.digestType.trim();
    }
  } catch {
    // metadataJson may be empty or legacy — fall back to the default digest type.
  }

  return DIGEST_TYPE_OPTIONS[0].value;
}

export function isDuplicateEmailDestination(
  existing: readonly DigestSubscription[],
  destination: string,
  excludeSubscriptionId?: string,
): boolean {
  const normalized: string = destination.trim().toLowerCase();

  if (normalized.length === 0) {
    return false;
  }

  return existing.some(
    (row) =>
      row.subscriptionId !== excludeSubscriptionId &&
      row.isEnabled &&
      row.channelType.trim().toLowerCase() === "email" &&
      row.destination.trim().toLowerCase() === normalized,
  );
}

export function maskDigestDestination(destination: string, canRevealDetails: boolean): string {
  const trimmed: string = destination.trim();

  if (trimmed.length === 0) {
    return "—";
  }

  if (canRevealDetails) {
    return trimmed;
  }

  if (trimmed.includes("@")) {
    const atIndex: number = trimmed.indexOf("@");
    const local: string = trimmed.slice(0, atIndex);
    const domain: string = trimmed.slice(atIndex + 1);
    const maskedLocal: string = local.length <= 1 ? "*" : `${local[0]}…`;

    return `${maskedLocal}@${domain}`;
  }

  if (trimmed.length <= 12) {
    return "••••••••";
  }

  return `${trimmed.slice(0, 8)}…${trimmed.slice(-4)}`;
}

export function buildDigestSubscriptionReadinessSummary(
  healthSnap: WeeklyDigestHealthDto | null,
  subscriptions: readonly DigestSubscription[],
): DigestSubscriptionReadinessSummary {
  const activeDestinations: number = subscriptions.filter((row) => row.isEnabled).length;
  const scheduleEnabled: boolean = (healthSnap?.enabledAdvisoryScheduleCount ?? 0) > 0;
  const scheduleStatus: string = scheduleEnabled ? "Active" : "Not configured";
  const scheduleDetail: string = scheduleEnabled
    ? `Next advisory run ${formatDigestInstant(healthSnap?.earliestNextAdvisoryRunUtc)}`
    : "Enable an advisory scan schedule to generate digests on a cadence.";
  const lastDelivery: string = formatDigestInstant(healthSnap?.latestDigestSubscriptionDeliveryUtc);
  const nextScheduled: string = scheduleEnabled
    ? formatDigestInstant(healthSnap?.earliestNextAdvisoryRunUtc)
    : "—";

  const rows: DigestSubscriptionReadinessRow[] = [
    {
      id: "destinations",
      label: "Active destinations",
      value: activeDestinations > 0 ? `${activeDestinations} active` : "None configured",
      detail:
        activeDestinations > 0
          ? `${subscriptions.length} delivery destination${subscriptions.length === 1 ? "" : "s"} in this workspace.`
          : "Add at least one delivery destination to receive generated digests.",
      href: null,
    },
    {
      id: "schedule",
      label: "Digest schedule",
      value: scheduleStatus,
      detail: scheduleDetail,
      href: scheduleEnabled ? null : ADVISORY_SCANS_SCHEDULES_HREF,
    },
    {
      id: "last-delivery",
      label: "Last delivery",
      value: lastDelivery,
      detail: "Most recent subscription delivery attempt in this scope.",
      href: null,
    },
    {
      id: "next-delivery",
      label: "Next scheduled generation",
      value: nextScheduled,
      detail: "Delivery destinations receive the next generated digest once the schedule runs.",
      href: null,
    },
  ];

  let blockingIssue: string | null = null;
  let nextActionLabel: string | null = null;
  let nextActionHref: string | null = null;

  if (!scheduleEnabled) {
    blockingIssue = "No advisory scan schedule is enabled — digests will not be generated automatically.";
    nextActionLabel = "Configure schedule";
    nextActionHref = ADVISORY_SCANS_SCHEDULES_HREF;
  } else if (activeDestinations === 0) {
    blockingIssue = "No active delivery destinations — generated digests have no outbound recipients.";
    nextActionLabel = "Add delivery destination";
    nextActionHref = null;
  }

  return {
    rows,
    blockingIssue,
    nextActionLabel,
    nextActionHref,
  };
}
