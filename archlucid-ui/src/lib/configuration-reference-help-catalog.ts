/** Counts configuration-key table rows in prepared CONFIGURATION_REFERENCE markdown. */
export function countConfigurationReferenceHelpCatalogKeys(markdown: string): number {
  const lines = markdown.replace(/\r\n/g, "\n").split("\n");
  let count = 0;

  for (const line of lines) {
    const trimmed = line.trim();

    if (!trimmed.startsWith("|")) {
      continue;
    }

    if (/^\|\s*[-:]+/.test(trimmed)) {
      continue;
    }

    if (/^\|\s*key\s*\|/i.test(trimmed) || /^\|\s*order\s*\|/i.test(trimmed)) {
      continue;
    }

    const cells = trimmed.split("|").map((cell) => cell.trim()).filter((cell) => cell.length > 0);

    if (cells.length >= 2) {
      count += 1;
    }
  }

  return count;
}

/** Filters catalog markdown table rows by a case-insensitive query. */
export function filterConfigurationReferenceHelpCatalogMarkdown(
  markdown: string,
  query: string,
): string {
  const normalizedQuery = query.trim().toLowerCase();

  if (normalizedQuery.length === 0) {
    return markdown;
  }

  const lines = markdown.replace(/\r\n/g, "\n").split("\n");
  const output: string[] = [];
  let inTable = false;
  let tableHeader: string[] = [];
  let tableSeparator: string | null = null;

  for (const line of lines) {
    const trimmed = line.trim();

    if (!trimmed.startsWith("|")) {
      if (inTable) {
        inTable = false;
        tableHeader = [];
        tableSeparator = null;
      }

      output.push(line);
      continue;
    }

    if (/^\|\s*[-:]+/.test(trimmed)) {
      tableSeparator = line;
      continue;
    }

    const isHeader = /^\|\s*key\s*\|/i.test(trimmed) || /^\|\s*order\s*\|/i.test(trimmed);

    if (isHeader) {
      inTable = true;
      tableHeader = [line];
      tableSeparator = null;
      continue;
    }

    if (!inTable) {
      output.push(line);
      continue;
    }

    if (trimmed.toLowerCase().includes(normalizedQuery)) {
      if (tableHeader.length > 0) {
        output.push(...tableHeader);
        tableHeader = [];
      }

      if (tableSeparator !== null) {
        output.push(tableSeparator);
        tableSeparator = null;
      }

      output.push(line);
    }
  }

  return output.join("\n");
}
