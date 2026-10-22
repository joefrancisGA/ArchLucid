/** Keeps a busy affordance visible long enough to register (anti-flicker, not fake progress). */

export const DEFAULT_MINIMUM_VISIBLE_BUSY_MS = 400;

export async function awaitMinimumVisibleDuration(
  startedAtMs: number,
  minimumMs: number = DEFAULT_MINIMUM_VISIBLE_BUSY_MS,
): Promise<void> {
  const elapsed = Date.now() - startedAtMs;
  const remaining = minimumMs - elapsed;

  if (remaining <= 0) {
    return;
  }

  await new Promise<void>((resolve) => {
    window.setTimeout(resolve, remaining);
  });
}
