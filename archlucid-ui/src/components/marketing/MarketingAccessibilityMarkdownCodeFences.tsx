import type { ReactNode } from "react";

import { HelpMarkdownCodeBlock } from "@/components/help/HelpMarkdownCodeBlock";
import { MermaidDiagram } from "@/components/help/MermaidDiagram";
import { isMermaidDiagramSource } from "@/lib/help/help-mermaid";

export function isMarkdownCodeFenceLine(line: string): boolean {
  return line.trimStart().startsWith("```");
}

export function parseMarkdownCodeFenceBlock(
  lines: readonly string[],
  startIndex: number,
): { readonly language: string; readonly code: string; readonly nextIndex: number } {
  const fence = (lines[startIndex] ?? "").trim();
  const language = fence.length > 3 ? fence.slice(3).trim() : "";
  const codeLines: string[] = [];
  let index = startIndex + 1;

  while (index < lines.length) {
    const codeLine = lines[index] ?? "";

    if (codeLine.trimStart().startsWith("```")) {
      return {
        language,
        code: codeLines.join("\n").replace(/\n$/, ""),
        nextIndex: index + 1,
      };
    }

    codeLines.push(codeLine);
    index++;
  }

  return {
    language,
    code: codeLines.join("\n").replace(/\n$/, ""),
    nextIndex: index,
  };
}

export function renderMarketingAccessibilityMarkdownCodeFence(input: {
  readonly key: number;
  readonly language: string;
  readonly code: string;
}): ReactNode | null {
  if (input.code.length === 0) {
    return null;
  }

  if (isMermaidDiagramSource(input.code, input.language)) {
    return <MermaidDiagram key={`mermaid-${input.key}`} source={input.code} accessibleName="Help topic diagram" />;
  }

  return <HelpMarkdownCodeBlock key={`code-${input.key}`} code={input.code} language={input.language} />;
}
