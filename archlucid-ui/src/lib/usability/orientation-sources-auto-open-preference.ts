const ORIENTATION_SOURCES_AUTO_OPEN_DISMISS_PREFIX = "archlucid.orientation-sources-auto-open.dismiss.v1";

export function orientationSourcesAutoOpenDismissStorageKey(surfaceId: string): string {
  return `${ORIENTATION_SOURCES_AUTO_OPEN_DISMISS_PREFIX}.${surfaceId.trim()}`;
}

export function readOrientationSourcesAutoOpenDismissed(surfaceId: string): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  try {
    return window.localStorage.getItem(orientationSourcesAutoOpenDismissStorageKey(surfaceId)) === "1";
  } catch {
    return true;
  }
}

export function writeOrientationSourcesAutoOpenDismissed(surfaceId: string): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(orientationSourcesAutoOpenDismissStorageKey(surfaceId), "1");
  } catch {
    // Private mode — treat as dismissed for this session only.
  }
}

export function resolveOrientationSourcesInitialOpen(input: {
  readonly urlParamOpen: boolean;
  readonly userDismissed: boolean;
  readonly workspacePreCommit: boolean;
}): boolean {
  if (input.urlParamOpen) {
    return true;
  }

  if (input.userDismissed) {
    return false;
  }

  return input.workspacePreCommit;
}
