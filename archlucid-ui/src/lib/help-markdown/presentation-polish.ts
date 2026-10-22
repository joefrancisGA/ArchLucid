import { capitalizeInlineGuidanceBody, parseLeadingInlineGuidanceLabel } from "@/lib/inline-guidance-labels";

export function emphasizeInlineGuidanceLabels(markdown: string): string {
  let inFence = false;

  return markdown
    .split("\n")
    .map((line) => {
      const trimmedFence = line.trimStart();

      if (trimmedFence.startsWith("```")) {
        inFence = !inFence;
        return line;
      }

      if (inFence) {
        return line;
      }

      const prefixMatch = /^(\s*(?:[-*]|\d+\.)\s+|>\s*)/.exec(line);
      const prefix = prefixMatch?.[1] ?? "";
      const rest = prefixMatch !== undefined && prefixMatch !== null ? line.slice(prefix.length) : line;
      const restTrimmed = rest.trimStart();

      if (restTrimmed.startsWith("**")) {
        return line;
      }

      const parsed = parseLeadingInlineGuidanceLabel(restTrimmed);

      if (parsed === null) {
        return line;
      }

      const restLeadingWhitespace = rest.slice(0, rest.length - restTrimmed.length);

      const body = capitalizeInlineGuidanceBody(parsed.label, parsed.body);

      return `${prefix}${restLeadingWhitespace}**${parsed.label}** ${body}`;
    })
    .join("\n");
}

/** Markdown horizontal rules used as section dividers — not rendered in in-app help. */
const MARKDOWN_HORIZONTAL_RULE_LINE = /^(\*{3,}|-{3,}|_{3,})\s*$/;

/**
 * Removes `---` / `***` / `___` thematic-break lines from help markdown (preserves fenced code blocks).
 */
export function stripMarkdownHorizontalRules(markdown: string): string {
  let inFence = false;

  const lines = markdown.split("\n").filter((line) => {
    const trimmedStart = line.trimStart();

    if (trimmedStart.startsWith("```")) {
      inFence = !inFence;
      return true;
    }

    if (inFence) {
      return true;
    }

    return !MARKDOWN_HORIZONTAL_RULE_LINE.test(line.trim());
  });

  return lines.join("\n").replace(/\n{3,}/g, "\n\n").trimEnd();
}

