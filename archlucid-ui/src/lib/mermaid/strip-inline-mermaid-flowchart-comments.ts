import { findUnquotedMermaidCommentIndex } from "@/lib/mermaid/find-unquoted-mermaid-comment-index";

function stripInlineMermaidFlowchartCommentLine(line: string): string {
  const trimmedStart = line.trimStart();

  if (trimmedStart.startsWith("%%")) {
    return line;
  }

  const commentIndex = findUnquotedMermaidCommentIndex(line);

  if (commentIndex < 0) {
    return line;
  }

  return line.slice(0, commentIndex).trimEnd();
}

/**
 * Drops trailing `%%` comments that share a line with a flowchart statement.
 * Mermaid only strips comments that start a line; inline comments parse as NODE_STRING.
 */
export function stripInlineMermaidFlowchartComments(source: string): string {
  return source.split(/\r?\n/u).map(stripInlineMermaidFlowchartCommentLine).join("\n");
}
