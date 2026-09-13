import {
  ARCHITECTURE_DIAGRAM_MERMAID_WRAPPING_WIDTH,
} from "@/lib/architecture/architecture-diagram-mermaid-config";

/** Matches mermaid `themeVariables.fontSize` for architecture and inventory diagrams. */
export const ARCHITECTURE_DIAGRAM_LABEL_FONT_SIZE_PX = 15;

/**
 * Average glyph width as a fraction of font size for ui-sans-serif.
 * 0.58em keeps wrapped lines inside a 240px wrappingWidth box with padding.
 */
export const ARCHITECTURE_DIAGRAM_LABEL_GLYPH_WIDTH_RATIO = 0.58;

export const ARCHITECTURE_DIAGRAM_LABEL_LINE_HEIGHT_RATIO = 1.25;

/** Inset so glyphs sit inside the stroke instead of on the node border. */
export const ARCHITECTURE_DIAGRAM_LABEL_HORIZONTAL_PADDING_PX = 16;

export function architectureDiagramLabelLineHeightPx(
  fontSizePx: number = ARCHITECTURE_DIAGRAM_LABEL_FONT_SIZE_PX,
): number {
  return fontSizePx * ARCHITECTURE_DIAGRAM_LABEL_LINE_HEIGHT_RATIO;
}

export function estimateArchitectureDiagramLabelWidthPx(
  text: string,
  fontSizePx: number = ARCHITECTURE_DIAGRAM_LABEL_FONT_SIZE_PX,
): number {
  return text.length * fontSizePx * ARCHITECTURE_DIAGRAM_LABEL_GLYPH_WIDTH_RATIO;
}

export function wrapWidthInsideNodeRectPx(rectWidthPx: number): number {
  return Math.max(48, rectWidthPx - ARCHITECTURE_DIAGRAM_LABEL_HORIZONTAL_PADDING_PX);
}

export function maxArchitectureDiagramLabelCharsForWidth(
  maxWidthPx: number,
  fontSizePx: number = ARCHITECTURE_DIAGRAM_LABEL_FONT_SIZE_PX,
): number {
  const usableWidth = Math.max(1, maxWidthPx);
  const glyphWidth = fontSizePx * ARCHITECTURE_DIAGRAM_LABEL_GLYPH_WIDTH_RATIO;

  return Math.max(8, Math.floor(usableWidth / glyphWidth));
}

function hardSplitToken(token: string, maxChars: number): string[] {
  const chunks: string[] = [];
  let remaining = token;

  while (remaining.length > maxChars) {
    chunks.push(remaining.slice(0, maxChars));
    remaining = remaining.slice(maxChars);
  }

  if (remaining.length > 0) {
    chunks.push(remaining);
  }

  return chunks.length > 0 ? chunks : [token];
}

/** Breaks long Azure resource ids at hyphens before hard-slicing. */
function splitOversizedToken(token: string, maxChars: number): string[] {
  if (token.length <= maxChars) {
    return [token];
  }

  if (!token.includes("-")) {
    return hardSplitToken(token, maxChars);
  }

  const parts = token.split("-");
  const chunks: string[] = [];
  let current = "";

  for (let index = 0; index < parts.length; index++) {
    const part = parts[index];

    if (part === undefined) {
      continue;
    }

    const suffix = index === 0 ? part : `-${part}`;
    const candidate = `${current}${suffix}`;

    if (candidate.length <= maxChars) {
      current = candidate;
      continue;
    }

    if (current.length > 0) {
      chunks.push(current);
    }

    if (suffix.length <= maxChars) {
      current = suffix;
      continue;
    }

    chunks.push(...hardSplitToken(suffix, maxChars));
    current = "";
  }

  if (current.length > 0) {
    chunks.push(current);
  }

  return chunks.length > 0 ? chunks : hardSplitToken(token, maxChars);
}

/**
 * Word-wraps a diagram label to a pixel budget. Does not ellipsize: architecture
 * and inventory names are the content, so every character stays visible.
 */
export function wrapArchitectureDiagramLabelToWidth(
  text: string,
  maxWidthPx: number,
  fontSizePx: number = ARCHITECTURE_DIAGRAM_LABEL_FONT_SIZE_PX,
): string[] {
  const normalized = text.replace(/[ \t]+/g, " ").trim();

  if (normalized.length === 0) {
    return [];
  }

  const maxChars = maxArchitectureDiagramLabelCharsForWidth(maxWidthPx, fontSizePx);
  const words = normalized.split(" ").filter((word) => word.length > 0);
  const lines: string[] = [];
  let current = "";

  for (const word of words) {
    const pieces = splitOversizedToken(word, maxChars);

    for (const piece of pieces) {
      const glue = current.length === 0 || piece.startsWith("-") ? "" : " ";
      const candidate = `${current}${glue}${piece}`;

      if (candidate.length <= maxChars) {
        current = candidate;
        continue;
      }

      if (current.length > 0) {
        lines.push(current);
      }

      current = piece;
    }
  }

  if (current.length > 0) {
    lines.push(current);
  }

  return lines.length > 0 ? lines : [normalized];
}

/** Mermaid quoted labels use a literal `\n` sequence for line breaks when htmlLabels is false. */
export function joinArchitectureDiagramMermaidLabelLines(lines: readonly string[]): string {
  return lines.join("\\n");
}

export function wrapArchitectureDiagramLabelForMermaidSource(raw: string): string {
  const wrapWidth = wrapWidthInsideNodeRectPx(ARCHITECTURE_DIAGRAM_MERMAID_WRAPPING_WIDTH);
  const lines = wrapArchitectureDiagramLabelToWidth(raw, wrapWidth);

  if (lines.length === 0) {
    return raw;
  }

  return joinArchitectureDiagramMermaidLabelLines(lines);
}
