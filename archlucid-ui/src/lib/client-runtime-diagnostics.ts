import { resolveSoftNavigationHardFallbackAssignUrl } from "@/lib/soft-navigation-hard-fallback";

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

const NAV_STUCK_MS = 8_000;
const HEARTBEAT_MS = 2_000;
const STALL_THRESHOLD_MS = 5_000;
const OVERLAY_PROBE_MS = 3_000;
const LONG_TASK_STALL_MS = 5_000;
const OVERLAY_PROBE_MAX_NODES = 150;
const OVERLAY_PROBE_TIME_BUDGET_MS = 12;
const CLIENT_RUNTIME_DIAGNOSTICS_BANNER_TEST_ID = "client-runtime-diagnostics-banner";

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

function isDocumentVisible(): boolean {
  return typeof document !== "undefined" && document.visibilityState === "visible";
}

function formatMainThreadStallDetail(params: {
  readonly thresholdMs: number;
  readonly source: "heartbeat" | "longtask";
  readonly gapMs?: number;
  readonly hiddenSinceLastBeat?: boolean;
  readonly longTaskDurationMs?: number;
  readonly attribution?: string;
}): string {
  const parts = [
    `thresholdMs=${params.thresholdMs}`,
    `source=${params.source}`,
    `visibilityState=${document.visibilityState}`,
  ];

  if (params.gapMs !== undefined) {
    parts.push(`gapMs=${params.gapMs}`);
  }

  if (params.hiddenSinceLastBeat !== undefined) {
    parts.push(`hiddenSinceLastBeat=${params.hiddenSinceLastBeat}`);
  }

  if (params.longTaskDurationMs !== undefined) {
    parts.push(`longTaskDurationMs=${Math.round(params.longTaskDurationMs)}`);
  }

  if (params.attribution !== undefined && params.attribution.length > 0) {
    parts.push(`attribution=${params.attribution}`);
  }

  return parts.join(";");
}

function isOverlayCandidateElement(el: HTMLElement): boolean {
  if (el.getAttribute("data-testid") === CLIENT_RUNTIME_DIAGNOSTICS_BANNER_TEST_ID) {
    return false;
  }

  if (el.getAttribute("aria-hidden") === "true") {
    return false;
  }

  const style = window.getComputedStyle(el);

  if (style.position !== "fixed" && style.position !== "absolute") {
    return false;
  }

  if (style.pointerEvents === "none" || style.visibility === "hidden" || style.display === "none") {
    return false;
  }

  const opacity = Number.parseFloat(style.opacity);

  if (!Number.isNaN(opacity) && opacity < 0.05) {
    return false;
  }

  const rect = el.getBoundingClientRect();

  if (rect.width === 0 || rect.height === 0) {
    return false;
  }

  const coversViewport =
    rect.width >= window.innerWidth * 0.9 && rect.height >= window.innerHeight * 0.9;

  if (!coversViewport) {
    return false;
  }

  const z = Number.parseInt(style.zIndex, 10);

  if (Number.isNaN(z) || z < 40) {
    return false;
  }

  if (el.getAttribute("role") === "dialog" || el.getAttribute("aria-modal") === "true") {
    return false;
  }

  return true;
}

/** Finds a full-viewport fixed layer that still receives pointer events (stuck tour/dialog). */
export function findBlockingOverlayElement(root: ParentNode = document): Element | null {
  const body = root instanceof Document ? root.body : root instanceof HTMLElement ? root : null;

  if (body === null) {
    return null;
  }

  const startMs = performance.now();
  const candidates = body.querySelectorAll("*");
  let examined = 0;

  for (const node of candidates) {
    if (examined >= OVERLAY_PROBE_MAX_NODES) {
      break;
    }

    if (performance.now() - startMs > OVERLAY_PROBE_TIME_BUDGET_MS) {
      break;
    }

    examined += 1;

    if (!(node instanceof HTMLElement)) {
      continue;
    }

    if (!isOverlayCandidateElement(node)) {
      continue;
    }

    return node;
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
 * On navigation-stuck, recovers with a full navigation when soft-nav never commits.
 */
export function installClientRuntimeDiagnostics(
  report: ClientDiagnosticsReporter,
  options: InstallClientRuntimeDiagnosticsOptions = {},
): ClientRuntimeDiagnosticsHandle {
  const hardNavigateOnStuck = options.hardNavigateOnStuck !== false;
  let disposed = false;
  let pendingNavHref: string | null = null;
  let pendingNavTimer: ReturnType<typeof setTimeout> | null = null;
  let lastHeartbeatMs = Date.now();
  let stallReported = false;
  let hiddenSinceLastBeat = false;
  let longTaskObserverActive = false;
  const reportedOverlayKeys = new Set<string>();

  const reportMainThreadStall = (params: {
    readonly message: string;
    readonly source: "heartbeat" | "longtask";
    readonly gapMs?: number;
    readonly hiddenSinceLastBeat?: boolean;
    readonly longTaskDurationMs?: number;
    readonly attribution?: string;
  }): void => {
    if (stallReported) {
      return;
    }

    stallReported = true;
    report({
      kind: "main-thread-stall",
      message: params.message,
      detail: formatMainThreadStallDetail({
        thresholdMs: STALL_THRESHOLD_MS,
        source: params.source,
        gapMs: params.gapMs,
        hiddenSinceLastBeat: params.hiddenSinceLastBeat,
        longTaskDurationMs: params.longTaskDurationMs,
        attribution: params.attribution,
      }),
    });
  };

  const clearPendingNav = (): void => {
    pendingNavHref = null;

    if (pendingNavTimer !== null) {
      clearTimeout(pendingNavTimer);
      pendingNavTimer = null;
    }
  };

  const onVisibilityChange = (): void => {
    if (disposed) {
      return;
    }

    if (!isDocumentVisible()) {
      hiddenSinceLastBeat = true;

      return;
    }

    lastHeartbeatMs = Date.now();
    hiddenSinceLastBeat = false;
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

      const assignUrl = hardNavigateOnStuck
        ? resolveSoftNavigationHardFallbackAssignUrl(
            stuckHref,
            window.location.pathname,
            window.location.search,
            window.location.origin,
          )
        : null;

      report({
        kind: "navigation-stuck",
        message: `Client navigation did not complete within ${NAV_STUCK_MS}ms`,
        href: stuckHref,
        detail:
          assignUrl !== null
            ? `pathnameStill=${window.location.pathname};hardFallback=${assignUrl}`
            : `pathnameStill=${window.location.pathname}`,
      });

      if (assignUrl !== null) {
        window.location.assign(assignUrl);
      }
    }, NAV_STUCK_MS);
  };

  const heartbeatTimer = setInterval(() => {
    if (disposed) {
      return;
    }

    if (!isDocumentVisible()) {
      hiddenSinceLastBeat = true;

      return;
    }

    const now = Date.now();
    const gap = now - lastHeartbeatMs;
    lastHeartbeatMs = now;

    if (longTaskObserverActive) {
      hiddenSinceLastBeat = false;

      return;
    }

    if (gap >= STALL_THRESHOLD_MS) {
      reportMainThreadStall({
        message: `Main thread heartbeat delayed by ${gap}ms`,
        source: "heartbeat",
        gapMs: gap,
        hiddenSinceLastBeat,
      });
    }

    hiddenSinceLastBeat = false;
  }, HEARTBEAT_MS);

  const overlayTimer = setInterval(() => {
    if (disposed || !isDocumentVisible()) {
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

  let longTaskObserver: PerformanceObserver | null = null;

  try {
    if (typeof PerformanceObserver !== "undefined") {
      longTaskObserver = new PerformanceObserver((list) => {
        if (disposed || !isDocumentVisible()) {
          return;
        }

        for (const entry of list.getEntries()) {
          if (entry.duration < LONG_TASK_STALL_MS) {
            continue;
          }

          const longTaskEntry = entry as PerformanceEntry & {
            attribution?: ReadonlyArray<{ name?: string; containerType?: string; containerSrc?: string }>;
          };
          const attribution = longTaskEntry.attribution
            ?.map((item) => item.name ?? item.containerType ?? item.containerSrc)
            .filter((value): value is string => typeof value === "string" && value.length > 0)
            .join("|");

          reportMainThreadStall({
            message: `Main thread long task ${Math.round(entry.duration)}ms`,
            source: "longtask",
            longTaskDurationMs: entry.duration,
            attribution,
          });
        }
      });
      longTaskObserver.observe({ entryTypes: ["longtask"] });
      longTaskObserverActive = true;
    }
  } catch {
    longTaskObserverActive = false;
  }

  window.addEventListener("error", onError);
  window.addEventListener("unhandledrejection", onRejection);
  document.addEventListener("click", onClickCapture, true);
  document.addEventListener("visibilitychange", onVisibilityChange);

  return {
    onLocationCommitted: clearPendingNav,
    dispose: () => {
      disposed = true;
      clearPendingNav();
      clearInterval(heartbeatTimer);
      clearInterval(overlayTimer);
      longTaskObserver?.disconnect();
      window.removeEventListener("error", onError);
      window.removeEventListener("unhandledrejection", onRejection);
      document.removeEventListener("click", onClickCapture, true);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    },
  };
}
