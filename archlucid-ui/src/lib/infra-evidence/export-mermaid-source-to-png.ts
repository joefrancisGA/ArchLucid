import { createArchitectureDiagramMermaidConfig } from "@/lib/architecture/architecture-diagram-mermaid-config";
import { sanitizeArchitectureDiagramSvg } from "@/lib/architecture/architecture-diagram-svg";
import { renderMermaidSvgMarkup } from "@/lib/mermaid/mermaid-safe-render";
import { sanitizeMermaidSvgForCanvasExport } from "@/lib/infra-evidence/sanitize-mermaid-svg-for-canvas-export";

export type ExportMermaidSourceToPngOptions = {
  readonly dark?: boolean;
  readonly renderId?: string;
  readonly backgroundColor?: string;
};

function appendDataFlowRollupMemberLegend(svgMarkup: string): string {
  if (typeof DOMParser === "undefined" || typeof XMLSerializer === "undefined") {
    return svgMarkup;
  }

  const parsed = new DOMParser().parseFromString(svgMarkup, "image/svg+xml");
  const svg = parsed.documentElement;
  if (svg.localName.toLowerCase() !== "svg" || parsed.querySelector("parsererror") !== null) {
    return svgMarkup;
  }

  const viewBox = (svg.getAttribute("viewBox") ?? "").trim().split(/[\s,]+/u).map(Number);
  if (viewBox.length !== 4 || viewBox.some((value) => !Number.isFinite(value))) {
    return svgMarkup;
  }

  const [minX, minY, viewWidth, viewHeight] = viewBox;
  const rollups = [...svg.querySelectorAll("g.node[data-member-names]")];
  if (rollups.length === 0) {
    return svgMarkup;
  }

  const rowHeight = 16;
  const topPadding = 12;
  const rows = rollups.flatMap((rollup, index) => {
    const title = rollup.querySelector("title")?.textContent?.trim() ?? "Rollup";
    const members = (rollup.getAttribute("data-member-names") ?? "").split("|").filter(Boolean);
    return [`[${index + 1}] ${title}`, ...members.map((member) => `  ${member}`)];
  });
  const legendHeight = topPadding * 2 + rows.length * rowHeight;
  const legendGroup = parsed.createElementNS(SVG_NS, "g");
  legendGroup.setAttribute("class", "rollup-member-legend");
  const legendY = minY + viewHeight + 12;
  legendGroup.setAttribute("transform", `translate(${minX},${legendY})`);

  const background = parsed.createElementNS(SVG_NS, "rect");
  background.setAttribute("width", "720");
  background.setAttribute("height", String(legendHeight));
  background.setAttribute("fill", "#ffffff");
  background.setAttribute("stroke", "#e2e8f0");
  legendGroup.appendChild(background);

  rows.forEach((row, index) => {
    const text = parsed.createElementNS(SVG_NS, "text");
    text.setAttribute("x", "10");
    text.setAttribute("y", String(topPadding + 12 + index * rowHeight));
    text.setAttribute("font-size", index === 0 || row.includes(" [") ? "11" : "10");
    text.setAttribute("font-weight", index === 0 || row.includes(" [") ? "700" : "400");
    text.setAttribute("font-family", "system-ui,sans-serif");
    text.setAttribute("fill", "#334155");
    text.textContent = row;
    legendGroup.appendChild(text);
  });

  svg.appendChild(legendGroup);
  svg.setAttribute("viewBox", `${minX} ${minY} ${viewWidth} ${viewHeight + legendHeight + 12}`);
  return new XMLSerializer().serializeToString(svg);
}

function readSvgExportDimensions(svgMarkup: string): { width: number; height: number } {
  if (typeof DOMParser === "undefined") {
    return { width: 1200, height: 800 };
  }

  const parser = new DOMParser();
  const parsed = parser.parseFromString(svgMarkup, "image/svg+xml");
  const svg = parsed.documentElement;

  if (svg.localName.toLowerCase() !== "svg" || parsed.querySelector("parsererror") !== null) {
    return { width: 1200, height: 800 };
  }

  const viewBox = svg.getAttribute("viewBox");

  if (viewBox !== null && viewBox.trim().length > 0) {
    const parts = viewBox.trim().split(/[\s,]+/).map((part) => Number.parseFloat(part));

    if (parts.length === 4 && parts.every((value) => Number.isFinite(value) && value >= 0)) {
      const width = Math.max(1, Math.ceil(parts[2] ?? 0));
      const height = Math.max(1, Math.ceil(parts[3] ?? 0));

      return { width, height };
    }
  }

  const width = Number.parseFloat(svg.getAttribute("width") ?? "");
  const height = Number.parseFloat(svg.getAttribute("height") ?? "");

  if (Number.isFinite(width) && Number.isFinite(height) && width > 0 && height > 0) {
    return { width: Math.ceil(width), height: Math.ceil(height) };
  }

  return { width: 1200, height: 800 };
}

function sanitizeSvgMarkupForCanvasExport(svgMarkup: string, dark: boolean): string {
  const withPalette = sanitizeArchitectureDiagramSvg(svgMarkup, { dark });

  return sanitizeMermaidSvgForCanvasExport(appendDataFlowRollupMemberLegend(withPalette));
}

async function svgMarkupToPngBlob(
  svgMarkup: string,
  backgroundColor: string,
  dark: boolean,
): Promise<Blob> {
  const sanitizedSvgMarkup = sanitizeSvgMarkupForCanvasExport(svgMarkup, dark);
  const { width, height } = readSvgExportDimensions(sanitizedSvgMarkup);
  const dataUrl = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(sanitizedSvgMarkup)}`;

  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Failed to load Mermaid SVG for PNG export."));
    img.src = dataUrl;
  });

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");

  if (context === null) {
    throw new Error("Canvas 2D context is unavailable for PNG export.");
  }

  context.fillStyle = backgroundColor;
  context.fillRect(0, 0, width, height);
  context.drawImage(image, 0, 0, width, height);

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((value) => {
      if (value === null) {
        reject(new Error("Browser PNG encoding failed."));
        return;
      }

      resolve(value);
    }, "image/png");
  });

  return blob;
}

/** Converts already-rendered Mermaid SVG markup into a PNG blob. */
export async function exportSanitizedMermaidSvgMarkupToPngBlob(
  svgMarkup: string,
  options: Pick<ExportMermaidSourceToPngOptions, "backgroundColor" | "dark"> = {},
): Promise<Blob> {
  const trimmed = svgMarkup.trim();

  if (trimmed.length === 0) {
    throw new Error("Mermaid SVG markup is empty.");
  }

  const dark = options.dark ?? false;
  const backgroundColor = options.backgroundColor ?? (dark ? "#0a0a0a" : "#ffffff");

  return svgMarkupToPngBlob(trimmed, backgroundColor, dark);
}

/** Renders Mermaid source in the browser and returns a PNG blob (used when server mmdc is unavailable). */
export async function exportMermaidSourceToPngBlob(
  mermaidSource: string,
  options: ExportMermaidSourceToPngOptions = {},
): Promise<Blob> {
  const trimmed = mermaidSource.trim();

  if (trimmed.length === 0) {
    throw new Error("Mermaid source is empty.");
  }

  const dark = options.dark ?? false;
  const backgroundColor = options.backgroundColor ?? (dark ? "#0a0a0a" : "#ffffff");
  const svg = await renderMermaidSvgMarkup(trimmed, {
    renderIdBase: options.renderId ?? "infra-evidence-mermaid-export",
    initialize: (mermaid) => {
      mermaid.initialize(createArchitectureDiagramMermaidConfig(dark));
    },
  });

  return svgMarkupToPngBlob(svg, backgroundColor, dark);
}
