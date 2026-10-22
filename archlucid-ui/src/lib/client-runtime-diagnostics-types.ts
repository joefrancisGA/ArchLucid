export type ClientDiagnosticsFinding = {
  readonly kind: "error" | "rejection" | "navigation-stuck" | "blocking-overlay" | "main-thread-stall";
  readonly message: string;
  readonly detail?: string;
  readonly href?: string;
};

export type ClientDiagnosticsReporter = (finding: ClientDiagnosticsFinding) => void;

export type InstallClientRuntimeDiagnosticsOptions = {
  /**
   * When soft-nav never commits, perform a same-origin full navigation after reporting.
   * Default true — App Router can wedge on Overview with zero RSC traffic; banner-only is not enough.
   */
  readonly hardNavigateOnStuck?: boolean;
};

export type ClientRuntimeDiagnosticsHandle = {
  readonly dispose: () => void;
  /** Call when App Router commits a new pathname so soft-nav watches clear. */
  readonly onLocationCommitted: () => void;
};

export const CLIENT_RUNTIME_DIAGNOSTICS_BANNER_TEST_ID = "client-runtime-diagnostics-banner";

export function isDocumentVisible(): boolean {
  return typeof document !== "undefined" && document.visibilityState === "visible";
}

export function isInternalHref(href: string, origin: string): boolean {
  if (href.startsWith("/")) {
    return !href.startsWith("//");
  }

  try {
    const url = new URL(href, origin);

    return url.origin === origin;
  } catch {
    return false;
  }
}
