/** Light-mode inventory/architecture node fill — option E (pale honey) on a white canvas. */
export const ARCHITECTURE_DIAGRAM_MERMAID_LIGHT_NODE = {
  fill: "#E6CF8A",
  border: "#7A6535",
} as const;

/** Shared Mermaid init for operator architecture and inventory diagrams. */
export function createArchitectureDiagramMermaidConfig(dark: boolean): {
  startOnLoad: false;
  suppressErrorRendering: true;
  theme: "dark" | "neutral";
  securityLevel: "strict";
  fontFamily: string;
  flowchart: {
    htmlLabels: false;
    curve: "basis";
    padding: number;
    nodeSpacing: number;
    rankSpacing: number;
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
      curve: "basis",
      padding: 18,
      nodeSpacing: 48,
      rankSpacing: 56,
      useMaxWidth: false,
    },
    themeVariables: {
      fontSize: "15px",
      // Transparent SVG plate — node fill comes from pale honey on the white viewport canvas.
      background: "transparent",
      primaryColor: dark ? "#334155" : ARCHITECTURE_DIAGRAM_MERMAID_LIGHT_NODE.fill,
      mainBkg: dark ? "#334155" : ARCHITECTURE_DIAGRAM_MERMAID_LIGHT_NODE.fill,
      clusterBkg: dark ? "#1e293b" : "#e2e8f0",
      clusterBorder: dark ? "#94a3b8" : "#475569",
      primaryBorderColor: dark ? "#cbd5e1" : ARCHITECTURE_DIAGRAM_MERMAID_LIGHT_NODE.border,
      lineColor: dark ? "#cbd5e1" : ARCHITECTURE_DIAGRAM_MERMAID_LIGHT_NODE.border,
      primaryTextColor: dark ? "#f8fafc" : "#0f172a",
      secondaryTextColor: dark ? "#e2e8f0" : "#1e293b",
    },
  };
}
