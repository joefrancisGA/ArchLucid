import DOMPurify from "dompurify";

export type ArchitectureNarrativeRenderDiagnostic = {
  readonly reason: "empty" | "json-payload" | "markdown" | "plain-fallback";
  readonly normalizationApplied: readonly string[];
  readonly sourceLength: number;
};

let lastArchitectureNarrativeRenderDiagnostic: ArchitectureNarrativeRenderDiagnostic | null = null;

export function recordArchitectureNarrativeRenderDiagnostic(
  diagnostic: ArchitectureNarrativeRenderDiagnostic,
): void {
  lastArchitectureNarrativeRenderDiagnostic = diagnostic;
}

export function peekArchitectureNarrativeRenderDiagnostic(): ArchitectureNarrativeRenderDiagnostic | null {
  return lastArchitectureNarrativeRenderDiagnostic;
}

export function resetArchitectureNarrativeRenderDiagnostic(): void {
  lastArchitectureNarrativeRenderDiagnostic = null;
}

export type ArchitectureNarrativePrepareResult = {
  readonly markdown: string;
  readonly normalizationApplied: readonly string[];
  readonly usePlainFallback: boolean;
};

const JSON_PAYLOAD_PATTERN = /^\s*[\[{][\s\S]*[\]}]\s*$/;

export function shouldNormalizeEscapedNewlines(text: string): boolean {
  if (!text.includes("\\n")) {
    return false;
  }

  const normalized = text.replace(/\r\n/g, "\n");
  const realLineCount = normalized.split("\n").length;
  const escapedLineMarkers = (text.match(/\\n/g) ?? []).length;

  return escapedLineMarkers >= 2 && escapedLineMarkers >= realLineCount;
}

export function normalizeEscapedNewlines(text: string): string {
  return text.replace(/\\r\\n/g, "\n").replace(/\\n/g, "\n").replace(/\\t/g, "\t");
}

export function unwrapOuterMarkdownCodeFence(text: string): string {
  const trimmed = text.trim();
  const fullFence = /^```(?:markdown|md)?\s*\n([\s\S]*?)\n```\s*$/i.exec(trimmed);

  if (fullFence?.[1] !== undefined) {
    return fullFence[1].trim();
  }

  return trimmed;
}

export function normalizeRepeatedBlankLines(text: string): string {
  return text.replace(/\n{3,}/g, "\n\n");
}

export function stripDangerousMarkupForPlainTextDisplay(text: string): string {
  // DOMPurify with no allowed tags strips markup without regex replace chains that CodeQL
  // flags as js/incomplete-multi-character-sanitization / js/bad-tag-filter (CodeQL run #3771).
  return DOMPurify.sanitize(text, { ALLOWED_TAGS: [], KEEP_CONTENT: true });
}

export function looksLikeJsonPayload(text: string): boolean {
  const trimmed = text.trim();

  if (!JSON_PAYLOAD_PATTERN.test(trimmed)) {
    return false;
  }

  try {
    JSON.parse(trimmed);

    return true;
  } catch {
    return false;
  }
}

export function countMarkdownH2Sections(text: string): number {
  const lines = text.replace(/\r\n/g, "\n").split("\n");

  return lines.filter((line) => /^##\s+/.test(line) && !/^###\s+/.test(line)).length;
}

export function prepareArchitectureNarrativeForPresentation(source: string): ArchitectureNarrativePrepareResult {
  const normalizationApplied: string[] = [];
  let markdown = source.replace(/\r\n/g, "\n");

  if (shouldNormalizeEscapedNewlines(markdown)) {
    markdown = normalizeEscapedNewlines(markdown);
    normalizationApplied.push("escaped-newlines");
  }

  const unfenced = unwrapOuterMarkdownCodeFence(markdown);

  if (unfenced !== markdown.trim()) {
    markdown = unfenced;
    normalizationApplied.push("outer-code-fence");
  }

  markdown = normalizeRepeatedBlankLines(markdown).trim();

  const usePlainFallback = looksLikeJsonPayload(markdown);

  return {
    markdown,
    normalizationApplied,
    usePlainFallback,
  };
}

export function normalizeArchitectureNarrativeSourceForParsing(source: string): string {
  return prepareArchitectureNarrativeForPresentation(source).markdown;
}
