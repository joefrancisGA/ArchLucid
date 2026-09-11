const EXTERNAL_URL_PATTERN = /^https?:\/\//i;

function readSvgHref(element: Element): string | null {
  const href = element.getAttribute("href");

  if (href !== null && href.trim().length > 0) {
    return href.trim();
  }

  const xlinkHref = element.getAttributeNS("http://www.w3.org/1999/xlink", "href");

  if (xlinkHref !== null && xlinkHref.trim().length > 0) {
    return xlinkHref.trim();
  }

  return null;
}

function removeElementsWithExternalHref(svg: Element, selector: string): void {
  for (const element of svg.querySelectorAll(selector)) {
    const href = readSvgHref(element);

    if (href !== null && EXTERNAL_URL_PATTERN.test(href)) {
      element.remove();
    }
  }
}

function stripExternalUrlsFromStyleText(styleText: string): string {
  return styleText
    .replace(/@import[^;]+;/gi, "")
    .replace(/url\(\s*['"]?https?:\/\/[^)'"]+['"]?\s*\)/gi, "none");
}

/**
 * Removes SVG constructs that taint an HTML canvas during browser PNG export.
 * Mermaid may emit foreignObject labels, external images, or @import font rules.
 */
export function sanitizeMermaidSvgForCanvasExport(svgMarkup: string): string {
  if (typeof DOMParser === "undefined" || typeof XMLSerializer === "undefined") {
    return svgMarkup;
  }

  const parser = new DOMParser();
  const parsed = parser.parseFromString(svgMarkup, "image/svg+xml");
  const svg = parsed.documentElement;

  if (svg.localName.toLowerCase() !== "svg" || parsed.querySelector("parsererror") !== null) {
    return svgMarkup;
  }

  for (const foreignObject of svg.querySelectorAll("foreignObject")) {
    foreignObject.remove();
  }

  removeElementsWithExternalHref(svg, "image");
  removeElementsWithExternalHref(svg, "feImage");
  removeElementsWithExternalHref(svg, "use");
  removeElementsWithExternalHref(svg, "link");

  for (const style of svg.querySelectorAll("style")) {
    if (style.textContent !== null) {
      style.textContent = stripExternalUrlsFromStyleText(style.textContent);
    }
  }

  return new XMLSerializer().serializeToString(svg);
}
