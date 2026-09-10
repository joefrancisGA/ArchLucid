import type { ArchitectureStructuredSection } from "@/lib/architecture/architecture-structured-content-types";
import type { TransparencyTrail } from "@/types/feasibility-verdict";

/** LP-16 — draft/desk open questions are not sealed asserted intake (WS-19 / ADR 0073). */
export const OPEN_QUESTIONS_WORKING_DOCUMENT_HONESTY_LABEL = "Working document — not sealed" as const;

export const OPEN_QUESTIONS_WORKING_DOCUMENT_EXPORT_HEADING =
  "Open questions (working document — not sealed)" as const;

export type OpenQuestionsWorkingDocumentExportEntry = {
  readonly key: string;
  readonly value: string;
};

export type SanitizedTransparencyTrailExportSection = {
  readonly asserted: TransparencyTrail["asserted"];
  readonly inferred: TransparencyTrail["inferred"];
  readonly skipped: TransparencyTrail["skipped"];
  readonly workingDocumentOpenQuestions: readonly OpenQuestionsWorkingDocumentExportEntry[];
};

export function isOpenQuestionsTransparencyTrailKey(key: string): boolean {
  const normalized = key.trim().toLowerCase().replace(/_/g, "-");

  if (normalized === "openquestions" || normalized === "open-questions") {
    return true;
  }

  return normalized.startsWith("openquestions.")
    || normalized.startsWith("open-questions.");
}

export function sanitizeTransparencyTrailForCareerExport(
  trail: TransparencyTrail | null | undefined,
): SanitizedTransparencyTrailExportSection | null {
  if (trail === null || trail === undefined) {
    return null;
  }

  const workingDocumentOpenQuestions = trail.asserted
    .filter((entry) => isOpenQuestionsTransparencyTrailKey(entry.key))
    .map((entry) => ({ key: entry.key, value: entry.value }));

  const asserted = trail.asserted.filter((entry) => !isOpenQuestionsTransparencyTrailKey(entry.key));

  return {
    asserted,
    inferred: trail.inferred,
    skipped: trail.skipped,
    workingDocumentOpenQuestions,
  };
}

export function demoteOpenQuestionsStructuredSectionProvenance(
  section: ArchitectureStructuredSection,
): ArchitectureStructuredSection {
  if (section.key !== "open-questions") {
    return section;
  }

  if (section.provenance === "inferred" && section.entities.every((entity) => entity.provenance === "inferred")) {
    return section;
  }

  return {
    ...section,
    provenance: "inferred",
    entities: section.entities.map((entity) => ({
      ...entity,
      provenance: "inferred",
    })),
  };
}

export function formatOpenQuestionsWorkingDocumentMarkdownSection(
  entries: readonly OpenQuestionsWorkingDocumentExportEntry[],
): string {
  if (entries.length === 0) {
    return "";
  }

  const lines: string[] = [];

  lines.push(`## ${OPEN_QUESTIONS_WORKING_DOCUMENT_EXPORT_HEADING}`);
  lines.push("");
  lines.push(
    `> **${OPEN_QUESTIONS_WORKING_DOCUMENT_HONESTY_LABEL}:** Draft follow-ups are not asserted intake unless recorded through the transparency trail with confirm.`,
  );
  lines.push("");

  for (const entry of entries) {
    lines.push(`- ${entry.key}: ${entry.value}`);
  }

  lines.push("");

  return lines.join("\n");
}
