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
      // Transparent diagram plate so white nodes read against the slate canvas, not a matching white SVG backdrop.
      background: "transparent",
      // White node fill so resource names stay readable against the canvas.
      primaryColor: dark ? "#334155" : "#ffffff",
      mainBkg: dark ? "#334155" : "#ffffff",
      clusterBkg: dark ? "#1e293b" : "#e2e8f0",
      clusterBorder: dark ? "#94a3b8" : "#475569",
      primaryBorderColor: dark ? "#cbd5e1" : "#1e293b",
      lineColor: dark ? "#cbd5e1" : "#1e293b",
      primaryTextColor: dark ? "#f8fafc" : "#0f172a",
      secondaryTextColor: dark ? "#e2e8f0" : "#1e293b",
    },
  };
}
