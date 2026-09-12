import DOMPurify from "dompurify";

const SVG_NS = "http://www.w3.org/2000/svg";

function collapseLabelWhitespace(raw: string): string {
  return raw.replace(/\s+/g, " ").trim();
}

function readFiniteAttribute(element: Element, name: string, fallback: number): number {
  const parsed = Number.parseFloat(element.getAttribute(name) ?? "");

  if (!Number.isFinite(parsed)) {
    return fallback;
  }

  return parsed;
}

function paintAttributeMissingOrNone(value: string | null): boolean {
  return value === null || value.length === 0 || value === "none";
}

function paintUnfilledSvgText(svg: Element): void {
  const texts = svg.querySelectorAll("text, tspan");

  for (const text of texts) {
    const fill = text.getAttribute("fill");

    if (paintAttributeMissingOrNone(fill)) {
      text.setAttribute("fill", "currentColor");
    }
  }
}

function paintUnfilledMermaidShapes(svg: Element): void {
  const nodeShapes = svg.querySelectorAll("g.node rect, g.node polygon, g.node circle, g.cluster rect");

  for (const shape of nodeShapes) {
    if (paintAttributeMissingOrNone(shape.getAttribute("stroke"))) {
      shape.setAttribute("stroke", "currentColor");

      if (paintAttributeMissingOrNone(shape.getAttribute("stroke-width"))) {
        shape.setAttribute("stroke-width", "1.5");
      }
    }

    if (shape.getAttribute("fill") === "none") {
      shape.setAttribute("fill", "currentColor");
      shape.setAttribute("fill-opacity", "0.12");
    }
  }

  const edgePaths = svg.querySelectorAll("g.edgePaths path, g.edgePath path, path.flowchart-link");

  for (const path of edgePaths) {
    if (paintAttributeMissingOrNone(path.getAttribute("stroke"))) {
      path.setAttribute("stroke", "currentColor");
    }

    if (paintAttributeMissingOrNone(path.getAttribute("fill"))) {
      path.setAttribute("fill", "none");
    }
  }
}

function replaceForeignObjectWithSvgText(foreignObject: Element, document: Document): void {
  const parent = foreignObject.parentNode;
  const label = collapseLabelWhitespace(foreignObject.textContent ?? "");

  if (parent === null) {
    return;
  }

  if (label.length === 0) {
    parent.removeChild(foreignObject);
    return;
  }

  const x = readFiniteAttribute(foreignObject, "x", 0);
  const y = readFiniteAttribute(foreignObject, "y", 0);
  const width = readFiniteAttribute(foreignObject, "width", 0);
  const height = readFiniteAttribute(foreignObject, "height", 0);
  const text = document.createElementNS(SVG_NS, "text");

  // Mermaid sizes the foreignObject around the label; SVG text is anchored at its center.
  text.setAttribute("class", "nodeLabel");
  text.setAttribute("x", String(x + width / 2));
  text.setAttribute("y", String(y + height / 2));
  text.setAttribute("text-anchor", "middle");
  text.setAttribute("dominant-baseline", "middle");
  text.setAttribute("fill", "currentColor");
  text.setAttribute("font-size", "15");
  text.textContent = label;
  parent.replaceChild(text, foreignObject);
}

/**
 * Mermaid 11 still emits HTML labels inside foreignObject even when htmlLabels is false.
 * SVG-only DOMPurify then drops those nodes and leaves empty grey boxes.
 */
export function replaceMermaidForeignObjectLabelsWithSvgText(svgMarkup: string): string {
  if (typeof DOMParser === "undefined" || typeof XMLSerializer === "undefined") {
    return svgMarkup;
  }

  const parser = new DOMParser();
  const parsed = parser.parseFromString(svgMarkup, "image/svg+xml");
  const svg = parsed.documentElement;

  if (svg.localName.toLowerCase() !== "svg") {
    return svgMarkup;
  }

  if (parsed.querySelector("parsererror") !== null) {
    return svgMarkup;
  }

  const foreignObjects = [...svg.querySelectorAll("foreignObject")];

  for (const foreignObject of foreignObjects) {
    replaceForeignObjectWithSvgText(foreignObject, parsed);
  }

  paintUnfilledSvgText(svg);
  paintUnfilledMermaidShapes(svg);
  svg.setAttribute("overflow", "visible");

  return new XMLSerializer().serializeToString(svg);
}

/** Keeps node names visible while still stripping script and leftover foreignObject. */
export function sanitizeArchitectureDiagramSvg(svgMarkup: string): string {
  const withVisibleLabels = replaceMermaidForeignObjectLabelsWithSvgText(svgMarkup);

  return DOMPurify.sanitize(withVisibleLabels, {
    USE_PROFILES: { svg: true, svgFilters: true },
    FORBID_TAGS: ["script", "foreignObject"],
  });
}
