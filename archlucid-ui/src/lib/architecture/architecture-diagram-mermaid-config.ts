/** Shared Mermaid init for operator architecture and inventory diagrams. */
export function createArchitectureDiagramMermaidConfig(dark: boolean): {
  startOnLoad: false;
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
      // White node fill so resource names stay readable against the canvas.
      primaryColor: dark ? "#334155" : "#ffffff",
      clusterBkg: dark ? "#1e293b" : "#f8fafc",
      clusterBorder: dark ? "#94a3b8" : "#64748b",
      primaryBorderColor: dark ? "#cbd5e1" : "#334155",
      lineColor: dark ? "#cbd5e1" : "#334155",
      primaryTextColor: dark ? "#f8fafc" : "#0f172a",
      secondaryTextColor: dark ? "#e2e8f0" : "#1e293b",
    },
  };
}
