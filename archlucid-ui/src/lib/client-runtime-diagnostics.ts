export type ClientDiagnosticsFinding = {
  readonly kind: "error" | "rejection" | "navigation-stuck" | "blocking-overlay" | "main-thread-stall";
  readonly message: string;
  readonly detail?: string;
  readonly href?: string;
};

export type ClientDiagnosticsReporter = (finding: ClientDiagnosticsFinding) => void;

const NAV_STUCK_MS = 8_000;
const HEARTBEAT_MS = 2_000;
const STALL_THRESHOLD_MS = 5_000;
const OVERLAY_PROBE_MS = 3_000;

function isInternalHref(href: string, origin: string): boolean {
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

/** Finds a full-viewport fixed layer that still receives pointer events (stuck tour/dialog). */
export function findBlockingOverlayElement(root: ParentNode = document): Element | null {
  const candidates = root.querySelectorAll("body *");

  for (const el of candidates) {
    if (!(el instanceof HTMLElement)) {
      continue;
    }

    const style = window.getComputedStyle(el);

    if (style.position !== "fixed" && style.position !== "absolute") {
      continue;
    }

    if (style.pointerEvents === "none" || style.visibility === "hidden" || style.display === "none") {
      continue;
    }

    const opacity = Number.parseFloat(style.opacity);

    if (!Number.isNaN(opacity) && opacity < 0.05) {
      continue;
    }

    const rect = el.getBoundingClientRect();
    const coversViewport =
      rect.width >= window.innerWidth * 0.9 && rect.height >= window.innerHeight * 0.9;

    if (!coversViewport) {
      continue;
    }

    const z = Number.parseInt(style.zIndex, 10);

    if (Number.isNaN(z) || z < 40) {
      continue;
    }

    // Skip known intentional full-screen hosts that expose an Escape/close control.
    if (el.getAttribute("role") === "dialog" || el.getAttribute("aria-modal") === "true") {
      continue;
    }

    return el;
  }

  return null;
}

export type ClientRuntimeDiagnosticsHandle = {
  readonly dispose: () => void;
  /** Call when App Router commits a new pathname so soft-nav watches clear. */
  readonly onLocationCommitted: () => void;
};

/**
 * Installs window + navigation + overlay + main-thread probes.
 */
export function installClientRuntimeDiagnostics(
  report: ClientDiagnosticsReporter,
): ClientRuntimeDiagnosticsHandle {
  let disposed = false;
  let pendingNavHref: string | null = null;
  let pendingNavTimer: ReturnType<typeof setTimeout> | null = null;
  let lastHeartbeatMs = Date.now();
  let stallReported = false;
  const reportedOverlayKeys = new Set<string>();

  const clearPendingNav = (): void => {
    pendingNavHref = null;

    if (pendingNavTimer !== null) {
      clearTimeout(pendingNavTimer);
      pendingNavTimer = null;
    }
  };

  const onError = (event: ErrorEvent): void => {
    if (disposed) {
      return;
    }

    const message = event.message?.trim() || "window.onerror";
    const detail = [event.filename, event.lineno, event.colno].filter((part) => part !== undefined && part !== 0).join(":");

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

  const onClickCapture = (event: MouseEvent): void => {
    if (disposed) {
      return;
    }

    const target = event.target;

    if (!(target instanceof Element)) {
      return;
    }

    const anchor = target.closest("a[href]");

    if (!(anchor instanceof HTMLAnchorElement)) {
      return;
    }

    if (event.defaultPrevented || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
      return;
    }

    if (anchor.target === "_blank" || anchor.hasAttribute("download")) {
      return;
    }

    const href = anchor.getAttribute("href");

    if (href === null || href.length === 0 || href.startsWith("#")) {
      return;
    }

    if (!isInternalHref(href, window.location.origin)) {
      return;
    }

    clearPendingNav();
    pendingNavHref = href;
    pendingNavTimer = setTimeout(() => {
      if (disposed || pendingNavHref === null) {
        return;
      }

      const stuckHref = pendingNavHref;
      clearPendingNav();
      report({
        kind: "navigation-stuck",
        message: `Client navigation did not complete within ${NAV_STUCK_MS}ms`,
        href: stuckHref,
        detail: `pathnameStill=${window.location.pathname}`,
      });
    }, NAV_STUCK_MS);
  };

  const heartbeatTimer = setInterval(() => {
    if (disposed) {
      return;
    }

    const now = Date.now();
    const gap = now - lastHeartbeatMs;
    lastHeartbeatMs = now;

    if (gap >= STALL_THRESHOLD_MS && !stallReported) {
      stallReported = true;
      report({
        kind: "main-thread-stall",
        message: `Main thread heartbeat delayed by ${gap}ms`,
        detail: `thresholdMs=${STALL_THRESHOLD_MS}`,
      });
    }
  }, HEARTBEAT_MS);

  const overlayTimer = setInterval(() => {
    if (disposed) {
      return;
    }

    const blocker = findBlockingOverlayElement();

    if (blocker === null) {
      return;
    }

    const label =
      blocker.getAttribute("data-testid") ??
      blocker.className?.toString().slice(0, 120) ??
      blocker.tagName;
    const key = label;

    if (reportedOverlayKeys.has(key)) {
      return;
    }

    reportedOverlayKeys.add(key);
    report({
      kind: "blocking-overlay",
      message: "Full-viewport overlay is intercepting pointer events",
      detail: label,
    });
  }, OVERLAY_PROBE_MS);

  window.addEventListener("error", onError);
  window.addEventListener("unhandledrejection", onRejection);
  document.addEventListener("click", onClickCapture, true);

  return {
    onLocationCommitted: clearPendingNav,
    dispose: () => {
      disposed = true;
      clearPendingNav();
      clearInterval(heartbeatTimer);
      clearInterval(overlayTimer);
      window.removeEventListener("error", onError);
      window.removeEventListener("unhandledrejection", onRejection);
      document.removeEventListener("click", onClickCapture, true);
    },
  };
}
