/** True when Playwright lost the page world because a navigation tore down the document. */
export function isDestroyedPlaywrightExecutionContext(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);

  return /execution context was destroyed|most likely because of a navigation/i.test(message);
}
