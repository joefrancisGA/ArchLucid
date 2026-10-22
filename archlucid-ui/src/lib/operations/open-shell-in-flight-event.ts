/** Opens the operator-shell In progress popover from another surface. */
export const ARCHLUCID_OPEN_SHELL_IN_FLIGHT_EVENT = "archlucid:open-shell-in-flight-operations";

/** Asks the header In progress control to open so queued work is visible. */
export function requestOpenShellInFlightOperations(): void {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(new Event(ARCHLUCID_OPEN_SHELL_IN_FLIGHT_EVENT));
}
