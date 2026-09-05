import type { TransparencyTrail } from "@/types/feasibility-verdict";

import { isTransparencyTrailComplete } from "@/lib/feasibility/transparency-trail-completeness";

export const TRANSPARENCY_TRAIL_EXPORT_INCOMPLETE_BANNER =
  "> **Career export blocked (ADR 0073):** This sealed record does not include a complete transparency trail (asserted, inferred, skipped). Do not treat this artifact as a defensible stamp.";

export type TransparencyTrailExportSection = {
  readonly asserted: TransparencyTrail["asserted"];
  readonly inferred: TransparencyTrail["inferred"];
  readonly skipped: TransparencyTrail["skipped"];
};

export function buildTransparencyTrailExportSection(
  trail: TransparencyTrail | null | undefined,
): TransparencyTrailExportSection | null {
  if (trail === null || trail === undefined) {
    return null;
  }

  return {
    asserted: trail.asserted,
    inferred: trail.inferred,
    skipped: trail.skipped,
  };
}

export function formatTransparencyTrailMarkdownSection(
  trail: TransparencyTrail | null | undefined,
): string {
  if (!isTransparencyTrailComplete(trail)) {
    return `${TRANSPARENCY_TRAIL_EXPORT_INCOMPLETE_BANNER}\n`;
  }

  const section = buildTransparencyTrailExportSection(trail);

  if (section === null) {
    return `${TRANSPARENCY_TRAIL_EXPORT_INCOMPLETE_BANNER}\n`;
  }

  const lines: string[] = [];

  lines.push("## Transparency trail");
  lines.push("");
  lines.push("What was asserted, inferred, and skipped for this review.");
  lines.push("");

  lines.push(`### Asserted (${section.asserted.length})`);
  lines.push("");

  if (section.asserted.length > 0) {
    for (const entry of section.asserted) {
      lines.push(`- ${entry.key}: ${entry.value}`);
    }
  } else {
    lines.push("_None recorded._");
  }

  lines.push("");
  lines.push(`### Inferred (${section.inferred.length})`);
  lines.push("");

  if (section.inferred.length > 0) {
    for (const entry of section.inferred) {
      lines.push(`- ${entry.key}: ${entry.value} (confidence ${entry.confidence})`);
    }
  } else {
    lines.push("_None recorded._");
  }

  const mustSkipped = section.skipped.filter((entry) => entry.tier === "Must");
  const shouldSkipped = section.skipped.filter((entry) => entry.tier !== "Must");

  if (mustSkipped.length > 0) {
    lines.push("");
    lines.push(`### Skipped MUST questions (${mustSkipped.length})`);
    lines.push("");

    for (const entry of mustSkipped) {
      lines.push(`- ${entry.questionKey}`);
    }
  }

  if (shouldSkipped.length > 0) {
    lines.push("");
    lines.push(`### Skipped SHOULD questions (${shouldSkipped.length})`);
    lines.push("");

    for (const entry of shouldSkipped) {
      lines.push(`- ${entry.questionKey}`);
    }
  }

  lines.push("");

  return lines.join("\n");
}
