import { resolveSoftNavigationHardFallbackAssignUrl } from "@/lib/soft-navigation-hard-fallback";

import type { ClientDiagnosticsReporter } from "./client-runtime-diagnostics-types";

export const NAV_STUCK_MS = 8_000;

export type SoftNavStuckProbe = {
  readonly onLocationCommitted: () => void;
  readonly dispose: () => void;
};

export function installSoftNavStuckProbe(
  report: ClientDiagnosticsReporter,
  hardNavigateOnStuck: boolean,
): SoftNavStuckProbe {
  let disposed = false;
  let pendingNavHref: string | null = null;
  let pendingNavTimer: ReturnType<typeof setTimeout> | null = null;

  const clearPendingNav = (): void => {
    pendingNavHref = null;

    if (pendingNavTimer !== null) {
      clearTimeout(pendingNavTimer);
      pendingNavTimer = null;
    }
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

  document.addEventListener("click", onClickCapture, true);

  return {
    onLocationCommitted: clearPendingNav,
    dispose: () => {
      disposed = true;
      clearPendingNav();
      document.removeEventListener("click", onClickCapture, true);
    },
  };
}

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
