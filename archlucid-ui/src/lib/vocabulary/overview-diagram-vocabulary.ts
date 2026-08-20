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

import {
  createPairwiseVocabularyRail,
  type PairwiseVocabularyRailModel,
} from "@/lib/vocabulary/create-pairwise-vocabulary-rail";

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

/** Build run-scoped Overview ↔ Diagram pairwise model (create-home reviewTab links). */
export function buildOverviewDiagramPairwiseRail(
  runId: string,
): PairwiseVocabularyRailModel<OverviewDiagramSurfaceId> {
  return createPairwiseVocabularyRail({
    runId,
    currentTab: "overview",
    currentTabId: "overview",
    peerTabId: "architecture",
    currentSurfaceId: "overview",
    peerSurfaceId: "diagram",
    copy: {
      heading: OVERVIEW_DIAGRAM_HEADING,
      whyTwo: OVERVIEW_DIAGRAM_WHY_TWO,
      compactLine: OVERVIEW_DIAGRAM_COMPACT_LINE,
      currentLabel: "Overview",
      peerLabel: "Diagram",
      currentWhenToUse: "Read the structured brief summary for this architecture package.",
      peerWhenToUse: "View the illustrative architecture sketch for this package.",
    },
  });
}

/** Build run-scoped Overview ↔ Diagram vocabulary (create-home reviewTab links). */
export function buildOverviewDiagramVocabulary(runId: string): OverviewDiagramVocabularyModel {
  const rail = buildOverviewDiagramPairwiseRail(runId);

  return {
    heading: rail.heading,
    whyTwo: rail.whyTwo,
    compactLine: rail.compactLine,
    overviewLink: rail.currentLink,
    diagramLink: rail.peerLink,
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
