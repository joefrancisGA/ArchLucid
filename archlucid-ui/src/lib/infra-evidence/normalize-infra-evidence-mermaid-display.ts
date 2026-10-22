import { normalizeSecureNowResourceNameForDisplay } from "@/lib/infra-evidence/format-azure-resource-display";
import { findUnquotedMermaidCommentIndex } from "@/lib/mermaid/find-unquoted-mermaid-comment-index";

const QUOTED_SQUARE_LABEL = /(\[\s*)(["'])([^"']+)(["'])(\s*\])/gu;
const QUOTED_ROUND_LABEL = /(\(\s*)(["'])([^"']+)(["'])(\s*\))/gu;
const QUOTED_HEXAGON_LABEL = /(\{\{\s*)(["'])([^"']+)(["'])(\s*\}\})/gu;
const EDGE_LABEL = /(\|)([^|]+)(\|)/gu;

function normalizeMermaidLabelText(label: string): string {
  const trimmed = label.trim();

  if (trimmed.length === 0) {
    return trimmed;
  }

  const parentheticalSuffix = /\s\([^)]+\)\s*$/u.exec(trimmed);

  if (parentheticalSuffix == null) {
    return normalizeSecureNowResourceNameForDisplay(trimmed);
  }

  const resourceName = trimmed.slice(0, parentheticalSuffix.index).trim();
  const suffix = parentheticalSuffix[0];

  if (resourceName.length === 0) {
    return normalizeSecureNowResourceNameForDisplay(trimmed);
  }

  return `${normalizeSecureNowResourceNameForDisplay(resourceName)}${suffix.toLowerCase()}`;
}

function replaceQuotedLabels(
  segment: string,
  pattern: RegExp,
): string {
  return segment.replace(pattern, (match, open, quoteOpen, label, quoteClose, close) => {
    const normalizedLabel = normalizeMermaidLabelText(label);

    return `${open}${quoteOpen}${normalizedLabel}${quoteClose}${close}`;
  });
}

function normalizeMermaidCodeSegment(segment: string): string {
  let normalized = replaceQuotedLabels(segment, QUOTED_SQUARE_LABEL);
  normalized = replaceQuotedLabels(normalized, QUOTED_ROUND_LABEL);
  normalized = replaceQuotedLabels(normalized, QUOTED_HEXAGON_LABEL);

  normalized = normalized.replace(EDGE_LABEL, (match, openPipe, label, closePipe) => {
    const normalizedLabel = normalizeSecureNowResourceNameForDisplay(label);

    return `${openPipe}${normalizedLabel}${closePipe}`;
  });

  return normalized;
}

function normalizeMermaidLineForDisplay(line: string): string {
  const commentIndex = findUnquotedMermaidCommentIndex(line);

  if (commentIndex < 0) {
    return normalizeMermaidCodeSegment(line);
  }

  const code = line.slice(0, commentIndex);
  const comment = line.slice(commentIndex);

  return `${normalizeMermaidCodeSegment(code)}${comment}`;
}

/** Lowercases inventory resource names embedded in Mermaid node labels for SecureNow display. */
export function normalizeInfraEvidenceMermaidSourceForDisplay(source: string): string {
  if (source.trim().length === 0) {
    return source;
  }

  return source
    .split("\n")
    .map((line) => normalizeMermaidLineForDisplay(line))
    .join("\n");
}

/** Lowercases text nodes in server-rendered inventory diagram SVG for SecureNow display. */
export function normalizeInfraEvidenceLayoutSvgForDisplay(svg: string): string {
  const trimmed = svg.trim();

  if (trimmed.length === 0) {
    return svg;
  }

  if (typeof DOMParser === "undefined") {
    return svg;
  }

  const parsed = new DOMParser().parseFromString(trimmed, "image/svg+xml");

  if (parsed.querySelector("parsererror") !== null) {
    return svg;
  }

  const textElements = parsed.querySelectorAll("text");

  for (const text of textElements) {
    const tspans = [...text.querySelectorAll("tspan")];

    if (tspans.length > 0) {
      for (const tspan of tspans) {
        const current = tspan.textContent ?? "";

        if (current.trim().length === 0) {
          continue;
        }

        tspan.textContent = normalizeMermaidLabelText(current);
      }

      continue;
    }

    const current = text.textContent ?? "";

    if (current.trim().length === 0) {
      continue;
    }

    text.textContent = normalizeMermaidLabelText(current);
  }

  const serialized = new XMLSerializer().serializeToString(parsed.documentElement);

  return serialized.startsWith("<svg") ? serialized : svg;
}
