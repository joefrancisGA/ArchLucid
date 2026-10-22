/**
 * Continue-last resolvers sort API list payloads with `.slice().sort()`.
 * Query mocks and malformed responses may pass non-arrays — guard before calling `.slice`.
 */
export function asReadonlyArray<T>(value: unknown): readonly T[] | null {
  if (!Array.isArray(value)) {
    return null;
  }

  return value as readonly T[];
}

export function asNonemptyReadonlyArray<T>(value: unknown): readonly T[] | null {
  const normalized = asReadonlyArray<T>(value);

  if (normalized === null || normalized.length === 0) {
    return null;
  }

  return normalized;
}
