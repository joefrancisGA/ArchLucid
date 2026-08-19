/**
 * Extracts `{#anchor}`-tagged `##` sections from help markdown for contextual deep links.
 */
export function extractMarkdownSectionsByAnchor(
  markdown: string,
  sectionAnchors: readonly string[],
  includeIntro = false,
): string {
  if (sectionAnchors.length === 0) {
    return markdown;
  }

  const anchorSet = new Set(sectionAnchors.map((anchor) => anchor.trim().toLowerCase()).filter((anchor) => anchor.length > 0));

  if (anchorSet.size === 0) {
    return markdown;
  }

  const lines = markdown.replace(/\r\n/g, "\n").split("\n");
  const introLines: string[] = [];
  const sections: Array<{ anchor: string; lines: string[] }> = [];
  let currentSection: { anchor: string; lines: string[] } | null = null;
  let index = 0;

  while (index < lines.length) {
    const line = lines[index] ?? "";

    if (line.startsWith("## ") && !line.startsWith("###")) {
      if (currentSection !== null) {
        sections.push(currentSection);
      }

      const anchorMatch = line.match(/\{#([^}]+)\}/);
      const anchor = anchorMatch?.[1]?.trim().toLowerCase() ?? "";

      currentSection = { anchor, lines: [line] };
      index++;
      continue;
    }

    if (currentSection === null) {
      introLines.push(line);
    }
    else {
      currentSection.lines.push(line);
    }

    index++;
  }

  if (currentSection !== null) {
    sections.push(currentSection);
  }

  const selectedSections = sections.filter((section) => anchorSet.has(section.anchor));
  const chunks: string[] = [];

  if (includeIntro) {
    const intro = introLines.join("\n").trim();

    if (intro.length > 0) {
      chunks.push(intro);
    }
  }

  for (const section of selectedSections) {
    chunks.push(section.lines.join("\n").trim());
  }

  return chunks.filter((chunk) => chunk.length > 0).join("\n\n---\n\n");
}

/**
 * Returns markdown with `{#anchor}`-tagged `##` sections removed (inverse of extract).
 */
export function omitMarkdownSectionsByAnchor(
  markdown: string,
  sectionAnchors: readonly string[],
): string {
  if (sectionAnchors.length === 0) {
    return markdown;
  }

  const anchorSet = new Set(
    sectionAnchors.map((anchor) => anchor.trim().toLowerCase()).filter((anchor) => anchor.length > 0),
  );

  if (anchorSet.size === 0) {
    return markdown;
  }

  const lines = markdown.replace(/\r\n/g, "\n").split("\n");
  const keptLines: string[] = [];
  let omitting = false;
  let index = 0;

  while (index < lines.length) {
    const line = lines[index] ?? "";

    if (line.startsWith("## ") && !line.startsWith("###")) {
      const anchorMatch = line.match(/\{#([^}]+)\}/);
      const anchor = anchorMatch?.[1]?.trim().toLowerCase() ?? "";
      omitting = anchorSet.has(anchor);

      if (!omitting) {
        keptLines.push(line);
      }

      index++;
      continue;
    }

    if (!omitting) {
      keptLines.push(line);
    }

    index++;
  }

  return keptLines.join("\n").replace(/\n{3,}/g, "\n\n").trim();
}
