/** Index of the first `%%` that is not inside a double-quoted Mermaid label, or -1. */
export function findUnquotedMermaidCommentIndex(line: string): number {
  let inQuote = false;

  for (let index = 0; index < line.length; index += 1) {
    const character = line[index];

    if (character === '"') {
      inQuote = !inQuote;
      continue;
    }

    if (!inQuote && character === "%" && line[index + 1] === "%") {
      return index;
    }
  }

  return -1;
}
