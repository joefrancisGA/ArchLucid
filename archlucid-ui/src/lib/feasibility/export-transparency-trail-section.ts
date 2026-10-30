import {
  formatOpenQuestionsWorkingDocumentMarkdownSection,
  sanitizeTransparencyTrailForCareerExport,
  type OpenQuestionsWorkingDocumentExportEntry,
} from "@/lib/architecture/architecture-open-questions-export-honesty";
import type { TransparencyTrail } from "@/types/feasibility-verdict";

import { formatInferredTrailEntryLabel } from "@/lib/feasibility/format-inferred-trail-entry-label";
import {
  formatAssertedTrailLine,
  formatSkippedTrailQuestionKey,
} from "@/lib/feasibility/format-transparency-trail-entry-display";
import { isTransparencyTrailComplete } from "@/lib/feasibility/transparency-trail-completeness";

export const TRANSPARENCY_TRAIL_EXPORT_INCOMPLETE_BANNER =
  "> **Record export blocked (ADR 0073):** This sealed record does not include a complete transparency trail (asserted, inferred, skipped). Do not treat this artifact as a defensible stamp.";

export type TransparencyTrailExportSection = {
  readonly asserted: TransparencyTrail["asserted"];
  readonly inferred: TransparencyTrail["inferred"];
  readonly skipped: TransparencyTrail["skipped"];
  readonly workingDocumentOpenQuestions: readonly OpenQuestionsWorkingDocumentExportEntry[];
};

export function buildTransparencyTrailExportSection(
  trail: TransparencyTrail | null | undefined,
): TransparencyTrailExportSection | null {
  const sanitized = sanitizeTransparencyTrailForCareerExport(trail);

  if (sanitized === null) {
    return null;
  }

  return {
    asserted: sanitized.asserted,
    inferred: sanitized.inferred,
    skipped: sanitized.skipped,
    workingDocumentOpenQuestions: sanitized.workingDocumentOpenQuestions,
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
      const responder =
        typeof entry.responderLabel === "string" && entry.responderLabel.trim().length > 0
          ? ` — ${entry.responderLabel.trim()}`
          : entry.responderLabel === null || entry.responderLabel === undefined
            ? " — Responder was not stored."
            : typeof entry.responderLabel === "string"
              ? " — Responder was stored empty."
              : "";
      const questionId =
        typeof entry.questionId === "string" && entry.questionId.length > 0
          ? ` — Question id: ${entry.questionId}`
          : entry.questionId === null || entry.questionId === undefined
            ? " — Question id was not stored."
            : "";
      const recordedUtc =
        typeof entry.recordedUtc === "string" && entry.recordedUtc.length > 0
          ? ` — Answer recorded time: ${entry.recordedUtc}`
          : entry.recordedUtc === null || entry.recordedUtc === undefined
            ? " — Answer recorded time was not stored."
            : "";

      lines.push(`- ${formatAssertedTrailLine(entry)}${responder}${questionId}${recordedUtc}`);
    }
  } else {
    lines.push("Asserted entries were stored empty.");
  }

  lines.push("");
  lines.push(`### Inferred (${section.inferred.length})`);
  lines.push("");

  if (section.inferred.length > 0) {
    for (const entry of section.inferred) {
      lines.push(`- ${formatInferredTrailEntryLabel(entry)}`);
    }
  } else {
    lines.push("Inferred entries were stored empty.");
  }

  const mustSkipped = section.skipped.filter((entry) => entry.tier === "Must");
  const shouldSkipped = section.skipped.filter((entry) => entry.tier !== "Must");

  lines.push("");
  lines.push(`### Skipped MUST questions (${mustSkipped.length})`);
  lines.push("");

  if (mustSkipped.length > 0) {
    for (const entry of mustSkipped) {
      lines.push(`- ${formatSkippedTrailQuestionKey(entry.questionKey)}`);
    }
  } else {
    lines.push("Skipped MUST questions were stored empty.");
  }

  lines.push("");
  lines.push(`### Skipped SHOULD questions (${shouldSkipped.length})`);
  lines.push("");

  if (shouldSkipped.length > 0) {
    for (const entry of shouldSkipped) {
      lines.push(`- ${formatSkippedTrailQuestionKey(entry.questionKey)}`);
    }
  } else if (section.skipped.length === 0) {
    lines.push("Skipped questions were not recorded on this transparency trail.");
  } else {
    lines.push("Skipped SHOULD questions were stored empty.");
  }

  const workingDocumentMarkdown = formatOpenQuestionsWorkingDocumentMarkdownSection(
    section.workingDocumentOpenQuestions,
  );

  if (workingDocumentMarkdown.length > 0) {
    lines.push("");
    lines.push(workingDocumentMarkdown.trimEnd());
  }

  lines.push("");

  return lines.join("\n");
}
