import { isTabsKeyboardMove, resolveNextTabIndex, type TabsKeyboardMove } from "@/components/ui/tabs-keyboard";

export function collectFilterChipFocusables(container: HTMLElement): readonly HTMLElement[] {
  return Array.from(container.querySelectorAll<HTMLElement>("a[href], button:not([disabled])"));
}

export function focusFilterChipAtIndex(container: HTMLElement, index: number): void {
  const focusables = collectFilterChipFocusables(container);

  if (index < 0 || index >= focusables.length) {
    return;
  }

  focusables[index]?.focus();
}

/** Arrow-key roving focus for `role="group"` filter chip rows (TB-667 follow-on). */
export function handleFilterChipGroupKeyDown(
  event: React.KeyboardEvent<HTMLElement>,
  container: HTMLElement,
): void {
  if (!isTabsKeyboardMove(event.key)) {
    return;
  }

  const focusables = collectFilterChipFocusables(container);

  if (focusables.length === 0) {
    return;
  }

  const currentIndex = focusables.findIndex((element) => element === document.activeElement);
  const startIndex = currentIndex >= 0 ? currentIndex : 0;
  const nextIndex = resolveNextTabIndex(
    startIndex,
    focusables.length,
    event.key as TabsKeyboardMove,
    "horizontal",
  );

  if (nextIndex === null) {
    return;
  }

  event.preventDefault();
  focusFilterChipAtIndex(container, nextIndex);
}
