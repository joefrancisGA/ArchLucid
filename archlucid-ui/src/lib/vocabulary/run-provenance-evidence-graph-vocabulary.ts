/**
 * TB-2296 — Run provenance ≠ Evidence graph vocabulary rail.
 *
 * Why two surfaces exist:
 * - Run provenance (`/architecture/reviews/{runId}/provenance`) is the per-package
 *   provenance walk for one architecture review.
 * - Evidence graph (`/insights/evidence-graph`) is the cross-package graph explorer
 *   for evidence trails and linkage.
 *
 * They stay separate because walking one package’s provenance is not the same task
 * as exploring the evidence graph across packages. Distinct from Architecture
 * intelligence ≠ Evidence graph (TB-2273).
 */

import { REVIEWS_LIST_PATH } from "@/lib/architecture/architecture-routes";
import { EVIDENCE_GRAPH_PATH } from "@/lib/evidence-graph-route";
import { createExternalPeerPairwiseVocabularyRail } from "@/lib/vocabulary/create-pairwise-vocabulary-rail";

export type RunProvenanceEvidenceGraphSurfaceId = "run-provenance" | "evidence-graph";

export type RunProvenanceEvidenceGraphLink = {
  readonly id: RunProvenanceEvidenceGraphSurfaceId;
  readonly label: string;
  readonly href: string;
  readonly whenToUse: string;
};

export type RunProvenanceEvidenceGraphVocabularyModel = {
  readonly heading: string;
  readonly whyTwo: string;
  readonly compactLine: string;
  readonly runProvenanceLink: RunProvenanceEvidenceGraphLink;
  readonly evidenceGraphLink: RunProvenanceEvidenceGraphLink;
};

export const RUN_PROVENANCE_EVIDENCE_GRAPH_HEADING =
  "Package provenance and Evidence graph serve different purposes" as const;

export const RUN_PROVENANCE_EVIDENCE_GRAPH_WHY_TWO =
  "Package provenance shows where evidence for one architecture review came from and how it links together. Evidence graph explores those connections across many reviews. Walking one review's provenance is not the same as exploring the cross-package graph." as const;

export const RUN_PROVENANCE_EVIDENCE_GRAPH_COMPACT_LINE =
  "Package provenance is per-review; Evidence graph explores across packages." as const;

/**
 * Peer from Evidence graph: Reviews hub, because provenance is run-scoped
 * (open Provenance on a package from the reviews list).
 */
export const RUN_PROVENANCE_EVIDENCE_GRAPH_PROVENANCE_LINK: RunProvenanceEvidenceGraphLink = {
  id: "run-provenance",
  label: "Reviews (open Provenance)",
  href: REVIEWS_LIST_PATH,
  whenToUse: "Open an architecture package, then use Provenance for that review’s linkage walk.",
};

export const RUN_PROVENANCE_EVIDENCE_GRAPH_GRAPH_LINK: RunProvenanceEvidenceGraphLink = {
  id: "evidence-graph",
  label: "Evidence graph",
  href: EVIDENCE_GRAPH_PATH,
  whenToUse: "Explore provenance and evidence trails across architecture packages.",
};

/** Pairwise model for package provenance ↔ Evidence graph (reviews hub fallback). */
export function buildRunProvenanceEvidenceGraphPairwiseRail() {
  return createExternalPeerPairwiseVocabularyRail({
    reviewSurfaceId: "run-provenance",
    externalSurfaceId: "evidence-graph",
    reviewTabId: "activity",
    copy: {
      heading: RUN_PROVENANCE_EVIDENCE_GRAPH_HEADING,
      whyTwo: RUN_PROVENANCE_EVIDENCE_GRAPH_WHY_TWO,
      compactLine: RUN_PROVENANCE_EVIDENCE_GRAPH_COMPACT_LINE,
      reviewSideLabel: "Reviews (open Provenance)",
      reviewSideWhenToUse:
        "Open an architecture package, then use Provenance for that review’s linkage walk.",
    },
    reviewsPeerFallbackLink: RUN_PROVENANCE_EVIDENCE_GRAPH_PROVENANCE_LINK,
    externalPeerLinkBase: RUN_PROVENANCE_EVIDENCE_GRAPH_GRAPH_LINK,
  });
}

/** Full vocabulary model (heading, why-two copy, and deep links). */
export function buildRunProvenanceEvidenceGraphVocabulary(): RunProvenanceEvidenceGraphVocabularyModel {
  const rail = buildRunProvenanceEvidenceGraphPairwiseRail();

  return {
    heading: rail.heading,
    whyTwo: rail.whyTwo,
    compactLine: rail.compactLine,
    runProvenanceLink: rail.reviewSideLink,
    evidenceGraphLink: rail.externalPeerLink,
  };
}

/** Peer deep-link for the surface you are not currently on. */
export function resolveRunProvenanceEvidenceGraphPeerLink(
  currentSurfaceId: RunProvenanceEvidenceGraphSurfaceId,
): RunProvenanceEvidenceGraphLink {
  if (currentSurfaceId === "run-provenance") {
    return RUN_PROVENANCE_EVIDENCE_GRAPH_GRAPH_LINK;
  }

  return RUN_PROVENANCE_EVIDENCE_GRAPH_PROVENANCE_LINK;
}
