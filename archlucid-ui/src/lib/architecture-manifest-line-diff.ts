import { diffLines } from "diff";

export type ArchitectureManifestDiffLineKind = "equal" | "add" | "remove";

export type ArchitectureManifestUnifiedLine = {
  readonly kind: ArchitectureManifestDiffLineKind;
  /** `-`, `+`, or space — Git-style unified diff prefix (announced inline for accessibility). */
  readonly prefix: string;
  readonly text: string;
};

/**
 * Splits a diff hunk `value` into logical lines (LF), dropping the synthetic trailing empty segment
 * that `diffLines` includes when a hunk ends with a newline.
 */
export function splitDiffHunkLines(value: string): readonly string[] {
  if (value.length === 0) {
    return [];
  }

  const normalized = value.replace(/\r\n/g, "\n");
  const withoutTrailingNewline = normalized.endsWith("\n") ? normalized.slice(0, -1) : normalized;

  if (withoutTrailingNewline.length === 0) {
    return [""];
  }

  return withoutTrailingNewline.split("\n");
}

/**
 * Builds a Git-style unified line diff suitable for monospace rendering (JSON/YAML/manifest text).
 */
export function buildArchitectureManifestUnifiedLines(
  beforeText: string,
  afterText: string,
): readonly ArchitectureManifestUnifiedLine[] {
  const hunks = diffLines(beforeText, afterText);
  const out: ArchitectureManifestUnifiedLine[] = [];

  for (const part of hunks) {
    const lines = splitDiffHunkLines(part.value);

    for (const line of lines) {
      if (part.added === true) {
        out.push({ kind: "add", prefix: "+", text: line });
        continue;
      }

      if (part.removed === true) {
        out.push({ kind: "remove", prefix: "-", text: line });
        continue;
      }

      out.push({ kind: "equal", prefix: " ", text: line });
    }
  }

  return out;
}
