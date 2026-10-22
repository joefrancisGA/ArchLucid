/**
 * Shared JSX opening-tag scanning for source-scanning UI guards
 * (**TB-1665** line tabs, **TB-1675** inline links).
 *
 * These guards read `.tsx` sources as text rather than parsing them, so they need a
 * scanner that knows a `>` inside a string literal or a `{...}` expression does not
 * end the tag — e.g. `href={cond ? a : b}` or `packId.length > 0`.
 */

/** Index just past the `>` that closes the opening tag starting at `tagStart`. */
export function findJsxOpeningTagEnd(source: string, tagStart: number): number {
  let braceDepth = 0;
  let quote: string | null = null;

  for (let index = tagStart; index < source.length; index += 1) {
    const char = source[index];

    if (quote !== null) {
      if (char === quote) {
        quote = null;
      }

      continue;
    }

    if (char === '"' || char === "'" || char === "`") {
      quote = char;
      continue;
    }

    if (char === "{") {
      braceDepth += 1;
      continue;
    }

    if (char === "}") {
      braceDepth -= 1;
      continue;
    }

    if (char === ">" && braceDepth === 0) {
      return index + 1;
    }
  }

  return source.length;
}

/** Every opening tag for `elementName`, in source order. */
export function collectJsxOpeningTags(source: string, elementName: string): readonly string[] {
  const tags: string[] = [];
  const pattern = new RegExp(`<${escapeRegExpLiteral(elementName)}\\b`, "g");
  let match = pattern.exec(source);

  while (match !== null) {
    const tagEnd = findJsxOpeningTagEnd(source, match.index);
    tags.push(source.slice(match.index, tagEnd));
    pattern.lastIndex = tagEnd;
    match = pattern.exec(source);
  }

  return tags;
}

/** 1-based line number for a character offset. */
export function lineNumberAtOffset(source: string, offset: number): number {
  let line = 1;

  for (let cursor = 0; cursor < offset && cursor < source.length; cursor += 1) {
    if (source[cursor] === "\n") {
      line += 1;
    }
  }

  return line;
}

export function escapeRegExpLiteral(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
