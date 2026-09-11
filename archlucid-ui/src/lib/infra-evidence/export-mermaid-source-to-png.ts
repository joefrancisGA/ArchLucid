import DOMPurify from "dompurify";

import { createArchitectureDiagramMermaidConfig } from "@/lib/architecture/architecture-diagram-mermaid-config";
import { sanitizeMermaidRenderId } from "@/lib/help/help-mermaid";
import { sanitizeMermaidSvgForCanvasExport } from "@/lib/infra-evidence/sanitize-mermaid-svg-for-canvas-export";

export type ExportMermaidSourceToPngOptions = {
  readonly dark?: boolean;
  readonly renderId?: string;
  readonly backgroundColor?: string;
};

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

function sanitizeSvgMarkupForCanvasExport(svgMarkup: string): string {
  const purified = DOMPurify.sanitize(svgMarkup, {
    USE_PROFILES: { svg: true, svgFilters: true },
    FORBID_TAGS: ["script", "foreignObject"],
  });

  return sanitizeMermaidSvgForCanvasExport(purified);
}

async function svgMarkupToPngBlob(svgMarkup: string, backgroundColor: string): Promise<Blob> {
  const sanitizedSvgMarkup = sanitizeSvgMarkupForCanvasExport(svgMarkup);
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

  return svgMarkupToPngBlob(trimmed, backgroundColor);
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

  const mermaidModule = await import("mermaid");
  const mermaid = mermaidModule.default;
  const dark = options.dark ?? false;
  const renderId = sanitizeMermaidRenderId(options.renderId ?? "infra-evidence-mermaid-export");
  const backgroundColor = options.backgroundColor ?? (dark ? "#0a0a0a" : "#ffffff");

  mermaid.initialize(createArchitectureDiagramMermaidConfig(dark));

  const result = await mermaid.render(renderId, trimmed);

  return svgMarkupToPngBlob(result.svg, backgroundColor);
}
