import type { CSSProperties } from "react";

export const SCOPE_PANEL_GAP_PX = 4;
export const SCOPE_PANEL_MIN_EDGE_PX = 16;

export type ScopePanelMode = "loading" | "selector" | "sample-info" | "current-scope-info" | "error";

export function computeScopePanelStyle(trigger: HTMLElement): CSSProperties {
  const rect = trigger.getBoundingClientRect();
  const maxWidth = Math.min(352, window.innerWidth - SCOPE_PANEL_MIN_EDGE_PX * 2);
  const width = maxWidth;
  const left = Math.max(SCOPE_PANEL_MIN_EDGE_PX, rect.right - width);

  return {
    position: "fixed",
    zIndex: 100,
    top: rect.bottom + SCOPE_PANEL_GAP_PX,
    left,
    width,
    maxWidth: "min(22rem, calc(100vw - 2rem))",
  };
}
