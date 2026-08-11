/**
 * TB-2298 — Create-home Clarifications ≠ Findings vocabulary rail.
 *
 * Why two tabs stay separate on the architecture package:
 * - Clarifications (`?archTab=clarifications`) is gaps and open questions that
 *   reduce assessment confidence until answered or evidenced.
 * - Findings (`?archTab=findings`) is the assessment findings list for this
 *   review — risk/quality issues to triage and act on.
 *
 * They share create-home chrome but are not the same work queue. Distinct from
 * Decision register ≠ Findings queue (TB-2291) and Risk exceptions ≠ Findings
 * (TB-2249).
 */

import { buildArchitectureWorkspaceTabHref } from "@/lib/architecture-workspace-tabs";

export type ClarificationsFindingsSurfaceId = "clarifications" | "findings";

export type ClarificationsFindingsLink = {
  readonly id: ClarificationsFindingsSurfaceId;
  readonly label: string;
  readonly href: string;
  readonly whenToUse: string;
};

export type ClarificationsFindingsVocabularyModel = {
  readonly heading: string;
  readonly whyTwo: string;
  readonly compactLine: string;
  readonly clarificationsLink: ClarificationsFindingsLink;
  readonly findingsLink: ClarificationsFindingsLink;
};

export const CLARIFICATIONS_FINDINGS_HEADING =
  "Clarifications and Findings do different jobs" as const;

export const CLARIFICATIONS_FINDINGS_WHY_TWO =
  "Clarifications are gaps and open questions that reduce assessment confidence until answered or evidenced. Findings are the assessment findings list for this review — risk and quality issues to triage. Open questions are not the same queue as findings." as const;

export const CLARIFICATIONS_FINDINGS_COMPACT_LINE =
  "Clarifications are gaps and open questions; Findings are assessment issues to triage — open the other when you need that job." as const;

/** Build run-scoped Clarifications ↔ Findings vocabulary (create-home archTab links). */
export function buildClarificationsFindingsVocabulary(
  runId: string,
): ClarificationsFindingsVocabularyModel {
  const trimmed = runId.trim();

  return {
    heading: CLARIFICATIONS_FINDINGS_HEADING,
    whyTwo: CLARIFICATIONS_FINDINGS_WHY_TWO,
    compactLine: CLARIFICATIONS_FINDINGS_COMPACT_LINE,
    clarificationsLink: {
      id: "clarifications",
      label: "Clarifications",
      href: buildArchitectureWorkspaceTabHref(trimmed, "clarifications"),
      whenToUse: "Answer gaps and open questions that reduce assessment confidence.",
    },
    findingsLink: {
      id: "findings",
      label: "Findings",
      href: buildArchitectureWorkspaceTabHref(trimmed, "findings"),
      whenToUse: "Triage assessment findings for this architecture review.",
    },
  };
}

/** Peer deep-link for the create-home tab you are not currently on. */
export function resolveClarificationsFindingsPeerLink(
  currentSurfaceId: ClarificationsFindingsSurfaceId,
  model: ClarificationsFindingsVocabularyModel,
): ClarificationsFindingsLink {
  if (currentSurfaceId === "clarifications") {
    return model.findingsLink;
  }

  return model.clarificationsLink;
}
