/** Resolves copy for explainability trace string lists using missingTraceFields when present. */
export function resolveFindingExplainabilityTraceListDisplay(input: {
  readonly values: readonly string[] | null | undefined;
  readonly fieldKey: string;
  readonly missingTraceFields: readonly string[] | null | undefined;
  readonly notStoredLabel: string;
  readonly storedEmptyLabel: string;
}): { readonly kind: "items"; readonly items: readonly string[] } | { readonly kind: "message"; readonly message: string } {
  const items = input.values?.filter((value) => value.trim().length > 0) ?? [];

  if (items.length > 0) {
    return { kind: "items", items };
  }

  const missingKeys =
    input.missingTraceFields?.map((field) => field.trim()).filter((field) => field.length > 0) ?? null;

  if (missingKeys === null || missingKeys === undefined) {
    return { kind: "message", message: input.notStoredLabel };
  }

  if (missingKeys.includes(input.fieldKey)) {
    return { kind: "message", message: input.storedEmptyLabel };
  }

  return { kind: "message", message: input.notStoredLabel };
}
