export type IntegrationPageLoadSliceResult<T> = {
  readonly value: T | null;
  readonly failed: boolean;
  readonly errorMessage: string | null;
};

function reasonMessage(reason: unknown, fallback: string): string {
  if (reason instanceof Error && reason.message.trim().length > 0) {
    return reason.message.trim();
  }

  return fallback;
}

/** Settles one parallel integration page load slice without clearing fulfilled siblings. */
export function settleIntegrationPageLoadSlice<T>(
  outcome: PromiseSettledResult<T>,
  sliceLabel: string,
): IntegrationPageLoadSliceResult<T> {
  if (outcome.status === "fulfilled") {
    return {
      value: outcome.value,
      failed: false,
      errorMessage: null,
    };
  }

  return {
    value: null,
    failed: true,
    errorMessage: reasonMessage(outcome.reason, `Could not load ${sliceLabel}.`),
  };
}

export function buildIntegrationPageLoadError(
  failedEntries: readonly { readonly label: string; readonly message: string }[],
  pageLabel: string,
): string | null {
  if (failedEntries.length === 0) {
    return null;
  }

  if (failedEntries.length === 1) {
    return failedEntries[0]?.message ?? null;
  }

  const labels = failedEntries.map((entry) => entry.label).join(", ");

  return `Some ${pageLabel} data could not be loaded (${labels}).`;
}
