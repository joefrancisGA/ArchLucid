/** Returns true when a row click/keyboard event originated from nested controls, not the row shell. */
export function shouldIgnoreRunsListRowActivation(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) {
    return false;
  }

  if (target.closest("a") !== null) {
    return true;
  }

  if (target.closest('input[type="checkbox"]') !== null) {
    return true;
  }

  if (target.closest("button") !== null) {
    return true;
  }

  if (target.closest("summary") !== null) {
    return true;
  }

  return false;
}
