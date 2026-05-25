const GUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export type Tier2FieldValidationErrors = {
  tenantId?: string;
  clientId?: string;
  subscriptionIds?: string;
};

export function isAzureGuid(value: string): boolean {
  return GUID_PATTERN.test(value.trim());
}

export function parseTier2SubscriptionIds(raw: string): string[] {
  return raw
    .split(",")
    .map((part) => part.trim())
    .filter((part) => part.length > 0);
}

export function parseFirstTier2SubscriptionId(raw: string): string | null {
  const parts = parseTier2SubscriptionIds(raw);

  if (parts.length === 0) {
    return null;
  }

  return parts[0] ?? null;
}

/** Mirrors Tier2ConnectionService.ParseSubscriptionIds validation on the API. */
export function validateTier2ConnectionFields(
  tenantId: string,
  clientId: string,
  subscriptionIds: string,
): Tier2FieldValidationErrors {
  const errors: Tier2FieldValidationErrors = {};

  if (!isAzureGuid(tenantId)) {
    errors.tenantId = "Enter a valid Azure AD tenant GUID.";
  }

  if (!isAzureGuid(clientId)) {
    errors.clientId = "Enter a valid application (client) ID GUID.";
  }

  const parts = parseTier2SubscriptionIds(subscriptionIds);

  if (parts.length === 0) {
    errors.subscriptionIds = "Enter at least one subscription ID.";
  } else {
    for (const part of parts) {
      if (!isAzureGuid(part)) {
        errors.subscriptionIds = `Subscription ID '${part}' must be a GUID.`;
        break;
      }
    }
  }

  return errors;
}

export function hasTier2FieldValidationErrors(errors: Tier2FieldValidationErrors): boolean {
  return Object.keys(errors).length > 0;
}
