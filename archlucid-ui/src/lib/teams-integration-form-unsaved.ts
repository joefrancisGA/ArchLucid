import type { TeamsIncomingWebhookConnectionResponse } from "@/types/teams-incoming-webhook-connection";

function triggerSetsEqual(left: ReadonlySet<string>, right: ReadonlySet<string>): boolean {
  if (left.size !== right.size) {
    return false;
  }

  for (const eventType of left) {
    if (!right.has(eventType)) {
      return false;
    }
  }

  return true;
}

/** True when the Teams connection form differs from the last loaded server snapshot. */
export function teamsIntegrationHasUnsavedEdits(
  conn: TeamsIncomingWebhookConnectionResponse | null,
  catalog: readonly string[],
  secretName: string,
  label: string,
  enabledTriggers: ReadonlySet<string>,
): boolean {
  const trimmedSecret = secretName.trim();
  const trimmedLabel = label.trim();

  if (conn === null || conn.isConfigured !== true) {
    return trimmedSecret.length > 0 || trimmedLabel.length > 0 || enabledTriggers.size > 0;
  }

  const savedTriggers = new Set(conn.enabledTriggers ?? catalog);

  return (
    trimmedSecret !== (conn.keyVaultSecretName ?? "").trim()
    || trimmedLabel !== (conn.label ?? "").trim()
    || !triggerSetsEqual(enabledTriggers, savedTriggers)
  );
}
