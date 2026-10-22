export type ArtifactViewKind = "markdown" | "json" | "mermaid" | "plain";

export type PreparedArtifactBody = {
  viewKind: ArtifactViewKind;
  /** Human-oriented body (pretty JSON when applicable). */
  readableText: string;
  /** Original UTF-8 text from the API (for raw disclosure). */
  rawText: string;
  /** True when JSON pretty-print failed; readableText falls back to raw. */
  jsonPrettyFailed: boolean;
};

/**
 * Maps API format + type to how the shell should present body text (no markdown renderer dependency).
 */
export function classifyArtifactView(format: string, artifactType: string): ArtifactViewKind {
  const f = format.trim().toLowerCase();

  if (f === "markdown" || f === "md") {
    return "markdown";
  }

  if (f === "mermaid" || f === "mmd") {
    return "mermaid";
  }

  if (f === "json" || artifactType === "DiagramAst") {
    return "json";
  }

  return "plain";
}

/**
 * Produces readable vs raw UTF-8 text for review panels (deterministic, no HTML injection).
 */
export function prepareArtifactBodyText(
  utf8Text: string,
  format: string,
  artifactType: string,
): PreparedArtifactBody {
  const rawText = utf8Text;
  const viewKind = classifyArtifactView(format, artifactType);

  if (viewKind !== "json") {
    return {
      viewKind,
      readableText: utf8Text,
      rawText,
      jsonPrettyFailed: false,
    };
  }

  try {
    const parsed: unknown = JSON.parse(utf8Text);

    return {
      viewKind,
      readableText: `${JSON.stringify(parsed, null, 2)}\n`,
      rawText,
      jsonPrettyFailed: false,
    };
  } catch {
    return {
      viewKind,
      readableText: utf8Text,
      rawText,
      jsonPrettyFailed: true,
    };
  }
}
