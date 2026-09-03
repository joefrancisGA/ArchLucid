import { installMainThreadStallProbe } from "./client-runtime-diagnostics-long-task-stalls";
import { installOverlayProbe } from "./client-runtime-diagnostics-overlay-probing";
import { installSoftNavStuckProbe } from "./client-runtime-diagnostics-soft-nav-stuck";
import type {
  ClientDiagnosticsReporter,
  ClientRuntimeDiagnosticsHandle,
  InstallClientRuntimeDiagnosticsOptions,
} from "./client-runtime-diagnostics-types";

/**
 * Installs window + navigation + overlay + main-thread probes.
 * On navigation-stuck, recovers with a full navigation when soft-nav never commits.
 */
export function installClientRuntimeDiagnostics(
  report: ClientDiagnosticsReporter,
  options: InstallClientRuntimeDiagnosticsOptions = {},
): ClientRuntimeDiagnosticsHandle {
  const hardNavigateOnStuck = options.hardNavigateOnStuck !== false;
  let disposed = false;

  const onError = (event: ErrorEvent): void => {
    if (disposed) {
      return;
    }

    const message = event.message?.trim() || "window.onerror";
    const detail = [event.filename, event.lineno, event.colno]
      .filter((part) => part !== undefined && part !== 0)
      .join(":");

    report({
      kind: "error",
      message,
      detail: detail.length > 0 ? detail : event.error instanceof Error ? event.error.stack : undefined,
    });
  };

  const onRejection = (event: PromiseRejectionEvent): void => {
    if (disposed) {
      return;
    }

    const reason = event.reason;
    const message =
      reason instanceof Error
        ? reason.message
        : typeof reason === "string"
          ? reason
          : "unhandledrejection";
    const detail = reason instanceof Error ? reason.stack : undefined;

    report({
      kind: "rejection",
      message,
      detail,
    });
  };

  const softNavProbe = installSoftNavStuckProbe(report, hardNavigateOnStuck);
  const overlayProbe = installOverlayProbe(report);
  const stallProbe = installMainThreadStallProbe(report);

  window.addEventListener("error", onError);
  window.addEventListener("unhandledrejection", onRejection);

  return {
    onLocationCommitted: softNavProbe.onLocationCommitted,
    dispose: () => {
      disposed = true;
      softNavProbe.dispose();
      overlayProbe.dispose();
      stallProbe.dispose();
      window.removeEventListener("error", onError);
      window.removeEventListener("unhandledrejection", onRejection);
    },
  };
}
