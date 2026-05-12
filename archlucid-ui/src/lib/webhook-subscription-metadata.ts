/** Keys we treat as webhook shared secrets — never echoed in plaintext in the UI. */
const webhookSecretKeys: ReadonlyArray<string> = ["webhookSharedSecret", "sharedSecret", "hmacSharedSecret"];

/**
 * Persisted opaque JSON (`AlertRoutingSubscription.metadataJson`).
 * Signing/delivery backends may evolve; storing here keeps webhook settings forward-compatible.
 */
export type WebhookSubscriptionMetadata = {
  eventTypes?: string[];
  webhookSharedSecret?: string;
};

export function stripWebhookSecretsForDisplay(metadataJson: string): Record<string, unknown> {
  let parsed: unknown;

  try {
    parsed = JSON.parse(metadataJson) as unknown;
  } catch {
    return {};
  }

  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed))
    return {};

  const cleaned: Record<string, unknown> = { ...(parsed as Record<string, unknown>) };

  for (const secretKey of webhookSecretKeys)
    delete cleaned[secretKey];

  return cleaned;
}

export function hasWebhookSecretConfigured(metadataJson: string): boolean {
  let parsed: unknown;

  try {
    parsed = JSON.parse(metadataJson) as unknown;
  } catch {
    return false;
  }

  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed))
    return false;

  const row = parsed as Record<string, unknown>;

  for (const secretKey of webhookSecretKeys) {
    const candidate = row[secretKey];

    if (typeof candidate === "string" && candidate.trim().length > 0)
      return true;
  }

  return false;
}

export function summarizeMaskedWebhookSubscription(metadataJson: string): {
  secretStatus: string;
  eventTypes: string[];
  displayMetadataJson: string;
} {
  const safe = stripWebhookSecretsForDisplay(metadataJson);

  const filteredTypesRaw = safe.eventTypes;
  delete safe.eventTypes;
  delete safe.subscriptionEventKinds;

  const filteredTypes =
    Array.isArray(filteredTypesRaw) && filteredTypesRaw.length > 0
      ? [
          ...new Set(
            filteredTypesRaw.filter(
              (e): e is string => typeof e === "string" && e.trim().length > 0,
            ).map((e) => e.trim()),
          ),
        ]
      : [];

  const secretStatus =
    hasWebhookSecretConfigured(metadataJson) === true
      ? "Stored — copy is not shown in the UI for security."
      : "Not configured for this subscription.";

  const displayPayload = Object.keys(safe).length === 0 ? "—" : JSON.stringify(safe, null, 2);

  return {
    secretStatus,
    eventTypes: filteredTypes,
    displayMetadataJson: displayPayload,
  };
}

export function buildWebhookSubscriptionMetadata(secret: string, eventTypes: string[]): string {
  const payload: WebhookSubscriptionMetadata & Record<string, unknown> = {
    eventTypes: [...new Set(eventTypes.map((e) => e.trim()).filter((e) => e.length > 0))],
    webhookSharedSecret: secret.trim(),
  };

  return JSON.stringify(payload);
}
