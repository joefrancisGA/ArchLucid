/**
 * When non-null, overrides {@link isBuyerPolishedOperatorShellEnv} in vitest mocks.
 * Use `false` for engineering-shell assertions; `true` for buyer-polished copy.
 */
export const buyerPolishedShellVitestOverride = { value: null as boolean | null };

/** Extends `@/lib/demo-ui-env` with an optional buyer-polished shell override for tests. */
export async function extendBuyerPolishedShellVitestMock(
  importOriginal: () => Promise<typeof import("@/lib/demo-ui-env")>,
): Promise<typeof import("@/lib/demo-ui-env")> {
  const actual = await importOriginal();

  return {
    ...actual,
    isBuyerPolishedOperatorShellEnv: () => {
      if (buyerPolishedShellVitestOverride.value !== null) {
        return buyerPolishedShellVitestOverride.value;
      }

      return actual.isBuyerPolishedOperatorShellEnv();
    },
    isBuyerVocabularyPassActive: () => {
      if (buyerPolishedShellVitestOverride.value !== null) {
        return buyerPolishedShellVitestOverride.value;
      }

      return actual.isBuyerVocabularyPassActive();
    },
  };
}
