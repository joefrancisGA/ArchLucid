export type SecureNowCollectionMissingInput = {
  readonly hasConfiguredProvider: boolean;
  readonly azureSubscriptionIdsPresent: boolean;
  readonly hasSuccessfulPull: boolean;
};

/** One buyer-safe reason when SecureNow has no current capture. */
export function resolveSecureNowCollectionMissingDetail(
  input: SecureNowCollectionMissingInput,
): string {
  if (!input.hasConfiguredProvider) {
    return "Reader role on the subscription in scope is not configured yet.";
  }

  if (!input.azureSubscriptionIdsPresent) {
    return "Subscription scope is not selected on the Azure connection.";
  }

  if (!input.hasSuccessfulPull) {
    return "The latest capture failed or has not finished.";
  }

  return "Collection status is missing for this scope.";
}

export function shouldShowSecureNowCollectionMissingBlock(
  input: SecureNowCollectionMissingInput,
): boolean {
  return !input.hasSuccessfulPull;
}
