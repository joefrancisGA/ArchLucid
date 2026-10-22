export type TabsOrientation = "horizontal" | "vertical";

export type TabsKeyboardMove =
  | "ArrowLeft"
  | "ArrowRight"
  | "ArrowUp"
  | "ArrowDown"
  | "Home"
  | "End";

/**
 * Resolves the next tab index for WAI-ARIA tabs keyboard navigation (automatic activation).
 * Returns null when the key should not change tab focus.
 */
export function resolveNextTabIndex(
  currentIndex: number,
  tabCount: number,
  key: TabsKeyboardMove,
  orientation: TabsOrientation,
): number | null {
  if (tabCount <= 0) {
    return null;
  }

  const clampedIndex = Math.min(Math.max(currentIndex, 0), tabCount - 1);

  if (key === "Home") {
    return 0;
  }

  if (key === "End") {
    return tabCount - 1;
  }

  const previousKey = orientation === "horizontal" ? "ArrowLeft" : "ArrowUp";
  const nextKey = orientation === "horizontal" ? "ArrowRight" : "ArrowDown";

  if (key === previousKey) {
    return clampedIndex === 0 ? tabCount - 1 : clampedIndex - 1;
  }

  if (key === nextKey) {
    return clampedIndex === tabCount - 1 ? 0 : clampedIndex + 1;
  }

  return null;
}

export function isTabsKeyboardMove(key: string): key is TabsKeyboardMove {
  return (
    key === "ArrowLeft"
    || key === "ArrowRight"
    || key === "ArrowUp"
    || key === "ArrowDown"
    || key === "Home"
    || key === "End"
  );
}
