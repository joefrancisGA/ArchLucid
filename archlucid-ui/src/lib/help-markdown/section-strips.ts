/** How one help topic drops whole markdown sections before the copy is rendered in-app. */
export type HelpMarkdownSectionStripOptions = {
  /**
   * Heading levels whose titles are tested against the omit list. Defaults to H2 only, because most
   * source docs keep contributor material in top-level sections.
   */
  readonly headingLevels?: readonly number[];
  /** Lines kept even inside an omitted section, matched by substring (buyer links that must survive). */
  readonly keepLinesContaining?: readonly string[];
  /** Lines dropped everywhere, matched by prefix, regardless of the section they sit in. */
  readonly dropLinesStartingWith?: readonly string[];
  /** Collapses runs of blank lines left by the removal and trims the tail. */
  readonly collapseBlankLines?: boolean;
};

const DEFAULT_HEADING_LEVELS: readonly number[] = [2];

/** Lower-cased heading text without its trailing `{#anchor}`, or null when the line is not that heading. */
function readHeadingTitle(line: string, level: number): string | null {
  const marker = `${"#".repeat(level)} `;

  if (!line.startsWith(marker) || line.startsWith(`${"#".repeat(level + 1)}`)) {
    return null;
  }

  return line
    .slice(marker.length)
    .replace(/\s*\{#[^}]+\}\s*$/, "")
    .trim()
    .toLowerCase();
}

function matchesOmittedTitle(title: string, omittedTitlePrefixes: readonly string[]): boolean {
  return omittedTitlePrefixes.some((prefix) => title.startsWith(prefix));
}

/**
 * Removes every markdown section whose heading title starts with one of `omittedTitlePrefixes`.
 *
 * Titles are compared lower-cased and without their trailing `{#anchor}`, so a source doc can add or
 * rename an anchor without silently reinstating contributor-only copy in buyer help.
 */
export function stripMarkdownSectionsByTitlePrefix(
  markdown: string,
  omittedTitlePrefixes: readonly string[],
  options?: HelpMarkdownSectionStripOptions,
): string {
  const headingLevels = options?.headingLevels ?? DEFAULT_HEADING_LEVELS;
  const kept: string[] = [];
  let omitSection = false;

  for (const line of markdown.split("\n")) {
    if (options?.dropLinesStartingWith?.some((prefix) => line.startsWith(prefix)) === true) {
      continue;
    }

    for (const level of headingLevels) {
      const title = readHeadingTitle(line, level);

      if (title !== null) {
        omitSection = matchesOmittedTitle(title, omittedTitlePrefixes);
        break;
      }
    }

    const keptDespiteOmit =
      omitSection && options?.keepLinesContaining?.some((needle) => line.includes(needle)) === true;

    if (!omitSection || keptDespiteOmit) {
      kept.push(line);
    }
  }

  const joined = kept.join("\n");

  if (options?.collapseBlankLines !== true) {
    return joined;
  }

  return joined.replace(/\n{3,}/g, "\n\n").trimEnd();
}
