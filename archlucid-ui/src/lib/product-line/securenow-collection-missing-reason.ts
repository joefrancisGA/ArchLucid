export type SecureNowCollectionMissingInput = {
  readonly hasConfiguredProvider: boolean;
  readonly azureSubscriptionIdsPresent: boolean;
  readonly hasSuccessfulPull: boolean;
};

export const SECURENOW_COLLECTION_MISSING_STATUS_LINE = "Collection status: Missing." as const;

export const SECURENOW_COLLECTION_READER_ROLE_LINE =
  "Connector role: Reader on the subscription in scope." as const;

export function formatSecureNowHomeSubscriptionScopeLine(subscriptionLabel: string | null | undefined): string {
  const trimmed = subscriptionLabel?.trim() ?? "";

  if (trimmed.length === 0) {
    return "Subscription scope: not selected.";
  }

  return `Subscription scope: ${trimmed}.`;
}

/** One buyer-safe reason when SecureNow has no current capture. */
export function resolveSecureNowCollectionMissingDetail(
  input: SecureNowCollectionMissingInput,
): string {
  if (!input.hasConfiguredProvider) {
    return "Next: grant Reader role on one Azure subscription in Cloud connections.";
  }

  if (!input.azureSubscriptionIdsPresent) {
    return "Next: select one Azure subscription for the SecureNow scope.";
  }

  if (!input.hasSuccessfulPull) {
    return "Next: upload an extractor ZIP on Manual upload, or run your scheduled extractor.";
  }

  return "Collection status is missing for this scope.";
}

export function shouldShowSecureNowCollectionMissingBlock(
  input: SecureNowCollectionMissingInput,
): boolean {
  return !input.hasSuccessfulPull;
}

/** Buyer-safe subscription label for the collection-missing block (Azure connection scope). */
export function resolveSecureNowCloudConnectionsSubscriptionScopeLabel(input: {
  readonly azureSubscriptionIdsPresent: boolean;
  readonly azureSubscriptionSummary: string | null | undefined;
}): string | null {
  if (!input.azureSubscriptionIdsPresent) {
    return null;
  }

  const trimmed = input.azureSubscriptionSummary?.trim() ?? "";

  if (trimmed.length === 0 || trimmed === "Connection not recorded") {
    return null;
  }

  return trimmed;
}
