type OperatorShellTopBarDeferredChunksModule =
  typeof import("@/components/shell/operator-shell-top-bar-deferred-chunks");

/** Keeps TB-2118 dynamic chunks but sync-resolves account + budget affordances Vitest asserts on. */
export async function buildOperatorShellTopBarDeferredChunksVitestMock(
  importOriginal: () => Promise<OperatorShellTopBarDeferredChunksModule>,
): Promise<Record<string, unknown>> {
  const actual = await importOriginal();
  const accountSettingsMenu = await import("@/components/shell/AccountSettingsMenu");
  const llmBudgetStatusPill = await import("@/components/llm/LlmBudgetStatusPill");

  return {
    ...actual,
    AccountSettingsMenuDeferred: accountSettingsMenu.AccountSettingsMenu,
    LlmBudgetStatusPillDeferred: llmBudgetStatusPill.LlmBudgetStatusPill,
  };
}
