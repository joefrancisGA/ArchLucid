/**
 * TB-2309 — Create-home Overview ≠ Diagram vocabulary rail.
 *
 * Why two tabs stay separate on the architecture package:
 * - Overview (`?archTab=overview`) is the structured brief summary for this
 *   architecture package.
 * - Diagram (`?archTab=diagram`) is an illustrative Mermaid sketch of the
 *   architecture — not the authoritative structured brief.
 *
 * They share create-home chrome but are not the same representation. Distinct
 * from Clarifications ≠ Findings (TB-2298) and Package Evidence ≠ Evidence graph
 * (TB-2300).
 */

import { buildReviewWorkspaceTabHref } from "@/lib/unified-review-workspace-tabs";

export type OverviewDiagramSurfaceId = "overview" | "diagram";

export type OverviewDiagramLink = {
  readonly id: OverviewDiagramSurfaceId;
  readonly label: string;
  readonly href: string;
  readonly whenToUse: string;
};

export type OverviewDiagramVocabularyModel = {
  readonly heading: string;
  readonly whyTwo: string;
  readonly compactLine: string;
  readonly overviewLink: OverviewDiagramLink;
  readonly diagramLink: OverviewDiagramLink;
};

export const OVERVIEW_DIAGRAM_HEADING =
  "Overview and Diagram serve different purposes" as const;

export const OVERVIEW_DIAGRAM_WHY_TWO =
  "Overview is the structured brief summary for this architecture package. Diagram is an illustrative sketch of the architecture — not the authoritative brief. Reading the summary is not the same as viewing the sketch." as const;

export const OVERVIEW_DIAGRAM_COMPACT_LINE =
  "Overview is the structured brief; Diagram is an illustrative sketch." as const;

/** Build run-scoped Overview ↔ Diagram vocabulary (create-home archTab links). */
export function buildOverviewDiagramVocabulary(runId: string): OverviewDiagramVocabularyModel {
  const trimmed = runId.trim();

  return {
    heading: OVERVIEW_DIAGRAM_HEADING,
    whyTwo: OVERVIEW_DIAGRAM_WHY_TWO,
    compactLine: OVERVIEW_DIAGRAM_COMPACT_LINE,
    overviewLink: {
      id: "overview",
      label: "Overview",
      href: buildReviewWorkspaceTabHref(trimmed, "overview"),
      whenToUse: "Read the structured brief summary for this architecture package.",
    },
    diagramLink: {
      id: "diagram",
      label: "Diagram",
      href: buildReviewWorkspaceTabHref(trimmed, "architecture"),
      whenToUse: "View the illustrative architecture sketch for this package.",
    },
  };
}

/** Peer deep-link for the create-home tab you are not currently on. */
export function resolveOverviewDiagramPeerLink(
  currentSurfaceId: OverviewDiagramSurfaceId,
  model: OverviewDiagramVocabularyModel,
): OverviewDiagramLink {
  if (currentSurfaceId === "overview") {
    return model.diagramLink;
  }

  return model.overviewLink;
}
