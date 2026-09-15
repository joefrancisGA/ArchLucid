/** Light-mode inventory/architecture node fill — rich honey on a white canvas. */
export const ARCHITECTURE_DIAGRAM_MERMAID_LIGHT_NODE = {
  fill: "#D4A84B",
  border: "#6B5424",
  text: "#0f172a",
} as const;

/** Dark-mode inventory/architecture node fill — slate on a dark canvas. */
export const ARCHITECTURE_DIAGRAM_MERMAID_DARK_NODE = {
  fill: "#334155",
  border: "#cbd5e1",
  text: "#f8fafc",
} as const;

/** Horizontal gap between dagre-ranked nodes (Mermaid flowchart.nodeSpacing). */
export const ARCHITECTURE_DIAGRAM_MERMAID_NODE_SPACING = 16;

/** Vertical gap between dagre ranks (Mermaid flowchart.rankSpacing). */
export const ARCHITECTURE_DIAGRAM_MERMAID_RANK_SPACING = 20;

/** Padding around the whole flowchart plate (Mermaid flowchart.padding). */
export const ARCHITECTURE_DIAGRAM_MERMAID_PADDING = 6;

/** Uniform node box width for inventory/architecture Mermaid canvases (flowchart.wrappingWidth). */
export const ARCHITECTURE_DIAGRAM_MERMAID_WRAPPING_WIDTH = 400;

/** Shared Mermaid init for operator architecture and inventory diagrams. */
export function createArchitectureDiagramMermaidConfig(dark: boolean): {
  startOnLoad: false;
  suppressErrorRendering: true;
  theme: "dark" | "neutral";
  securityLevel: "strict";
  fontFamily: string;
  flowchart: {
    htmlLabels: false;
    curve: "linear";
    padding: number;
    nodeSpacing: number;
    rankSpacing: number;
    wrappingWidth: number;
    useMaxWidth: false;
  };
  themeVariables: Record<string, string>;
} {
  return {
    startOnLoad: false,
    suppressErrorRendering: true,
    theme: dark ? "dark" : "neutral",
    securityLevel: "strict",
    fontFamily: "ui-sans-serif, system-ui, sans-serif",
    flowchart: {
      htmlLabels: false,
      // IDL-07 briefly loosened gaps for the zero-edge grid; IDT-01 re-tightens for sparse forests.
      // linear keeps connectors short. Do not set flowchart.ranker — Mermaid 11's dagre adapter
      // does not forward it for flowcharts (a no-op that later agents kept "tuning").
      curve: "linear",
      padding: ARCHITECTURE_DIAGRAM_MERMAID_PADDING,
      nodeSpacing: ARCHITECTURE_DIAGRAM_MERMAID_NODE_SPACING,
      rankSpacing: ARCHITECTURE_DIAGRAM_MERMAID_RANK_SPACING,
      wrappingWidth: ARCHITECTURE_DIAGRAM_MERMAID_WRAPPING_WIDTH,
      useMaxWidth: false,
    },
    themeVariables: {
      fontSize: "15px",
      // Transparent SVG plate — node fill comes from honey on the white viewport canvas.
      background: "transparent",
      primaryColor: dark ? "#334155" : ARCHITECTURE_DIAGRAM_MERMAID_LIGHT_NODE.fill,
      mainBkg: dark ? "#334155" : ARCHITECTURE_DIAGRAM_MERMAID_LIGHT_NODE.fill,
      clusterBkg: dark ? "transparent" : "transparent",
      clusterBorder: dark ? "#94a3b8" : "#475569",
      primaryBorderColor: dark ? "#cbd5e1" : ARCHITECTURE_DIAGRAM_MERMAID_LIGHT_NODE.border,
      lineColor: dark ? "#cbd5e1" : ARCHITECTURE_DIAGRAM_MERMAID_LIGHT_NODE.border,
      primaryTextColor: dark ? "#f8fafc" : "#0f172a",
      secondaryTextColor: dark ? "#e2e8f0" : "#1e293b",
    },
  };
}
