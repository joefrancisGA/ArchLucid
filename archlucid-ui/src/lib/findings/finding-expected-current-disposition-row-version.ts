export type ExpectedCurrentDispositionRowVersionInput = {
  readonly inspectPayloadRowVersionBase64?: string | null;
  readonly latestHistoryEvent?: { readonly currentDispositionRowVersionBase64?: string | null } | null;
  readonly conflict?: { readonly currentDispositionRowVersionBase64?: string | null } | null;
};

function trimRowVersion(value: string | null | undefined): string | undefined {
  if (value === null || value === undefined) {
    return undefined;
  }

  const trimmed = value.trim();

  if (trimmed.length === 0) {
    return undefined;
  }

  return trimmed;
}

/**
 * Resolve the ADR 0076 expected current-pointer token for a disposition write.
 * Precedence: conflict winner → latest history event → inspect payload seed.
 * `undefined` means no pointer yet (first disposition).
 */
export function resolveExpectedCurrentDispositionRowVersion(
  input: ExpectedCurrentDispositionRowVersionInput,
): string | undefined {
  const fromConflict = trimRowVersion(input.conflict?.currentDispositionRowVersionBase64);

  if (fromConflict !== undefined) {
    return fromConflict;
  }

  const fromHistory = trimRowVersion(input.latestHistoryEvent?.currentDispositionRowVersionBase64);

  if (fromHistory !== undefined) {
    return fromHistory;
  }

  return trimRowVersion(input.inspectPayloadRowVersionBase64);
}
