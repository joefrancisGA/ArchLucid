/** Move roving focus across `[data-help-drawer-row]` buttons inside a list container. */
export function focusHelpDrawerRow(listRoot: HTMLElement | null, direction: "first" | "next" | "prev"): void {
  if (listRoot === null) {
    return;
  }

  const rows = Array.from(listRoot.querySelectorAll<HTMLButtonElement>("[data-help-drawer-row]"));

  if (rows.length === 0) {
    return;
  }

  if (direction === "first") {
    rows[0]?.focus();
    return;
  }

  const activeIndex = rows.findIndex((row) => row === document.activeElement);

  if (activeIndex < 0) {
    rows[0]?.focus();
    return;
  }

  const nextIndex = direction === "next" ? Math.min(activeIndex + 1, rows.length - 1) : Math.max(activeIndex - 1, 0);

  rows[nextIndex]?.focus();
}
