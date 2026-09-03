import {
  CLIENT_RUNTIME_DIAGNOSTICS_BANNER_TEST_ID,
  type ClientDiagnosticsReporter,
} from "./client-runtime-diagnostics-types";

export const OVERLAY_PROBE_MS = 3_000;
export const OVERLAY_PROBE_MAX_NODES = 150;
export const OVERLAY_PROBE_TIME_BUDGET_MS = 12;

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

export type OverlayProbe = {
  readonly dispose: () => void;
};

export function installOverlayProbe(report: ClientDiagnosticsReporter): OverlayProbe {
  let disposed = false;
  const reportedOverlayKeys = new Set<string>();

  const overlayTimer = setInterval(() => {
    if (disposed || document.visibilityState !== "visible") {
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

  return {
    dispose: () => {
      disposed = true;
      clearInterval(overlayTimer);
    },
  };
}
