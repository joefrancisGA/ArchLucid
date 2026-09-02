const ATTACHED_FILES_MARKERS = [
  "\n\nAttached files:",
  "\n\nAttached architecture evidence:",
  "\r\n\r\nAttached files:",
  "\r\n\r\nAttached architecture evidence:",
] as const;

const ATTACHED_FILES_HEADINGS = ["Attached files:", "Attached architecture evidence:"] as const;

/**
 * File names recorded in the generated first-pilot intake brief.
 *
 * Customer intake stores those names when the operator attaches files but does not type a long
 * architecture brief. The Evidence tab previously hid the whole generated brief, so the files
 * disappeared from inventory even though intake recorded them.
 */
export function extractAttachedIntakeFileNames(description: string | null | undefined): readonly string[] {
  const text = (description ?? "").trim();

  if (text.length === 0) {
    return [];
  }

  const section = sliceAttachedFilesSection(text);

  if (section === null) {
    return [];
  }

  const names: string[] = [];
  let started = false;

  for (const rawLine of section.split(/\r?\n/)) {
    const line = rawLine.trim();

    if (line.length === 0) {
      if (started) {
        break;
      }

      continue;
    }

    if (ATTACHED_FILES_HEADINGS.includes(line as (typeof ATTACHED_FILES_HEADINGS)[number])) {
      if (started) {
        break;
      }

      continue;
    }

    if (line.startsWith("- ")) {
      started = true;

      const name = line.slice(2).trim();

      if (name.length > 0) {
        names.push(name);
      }

      continue;
    }

    if (started) {
      break;
    }
  }

  return names;
}

/** Appends or replaces the attached-files block on an intake brief. */
export function appendIntakeAttachedFileNames(
  brief: string,
  fileNames: readonly string[],
): string {
  const trimmedNames = fileNames.map((name) => name.trim()).filter((name) => name.length > 0);

  if (trimmedNames.length === 0) {
    return brief.trimEnd();
  }

  let base = brief;

  if (ATTACHED_FILES_HEADINGS.some((heading) => base.startsWith(heading))) {
    base = "";
  }

  for (const marker of ATTACHED_FILES_MARKERS) {
    const markerIndex = base.indexOf(marker);

    if (markerIndex >= 0) {
      base = base.slice(0, markerIndex);
    }
  }

  const fileLines = trimmedNames.map((name) => `- ${name}`).join("\n");
  const trimmedBase = base.trimEnd();

  return trimmedBase.length === 0
    ? `Attached files:\n${fileLines}`
    : `${trimmedBase}\n\nAttached files:\n${fileLines}`;

function sliceAttachedFilesSection(text: string): string | null {
  for (const marker of ATTACHED_FILES_MARKERS) {
    const markerIndex = text.indexOf(marker);

    if (markerIndex >= 0) {
      return text.slice(markerIndex + marker.length);
    }
  }

  for (const heading of ATTACHED_FILES_HEADINGS) {
    if (text.startsWith(heading)) {
      return text.slice(heading.length);
    }
  }

  return null;
}
