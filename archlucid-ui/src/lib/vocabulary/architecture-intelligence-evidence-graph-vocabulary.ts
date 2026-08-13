/**
 * TB-2273 — Architecture intelligence ≠ Evidence graph vocabulary rail.
 *
 * Why two reasoning / evidence surfaces exist:
 * - Architecture intelligence (`/architecture/architecture-intelligence`) runs
 *   *closed-loop architecture reasoning* (and golden harness) against a
 *   free-form description — an operator reasoning surface, not a signed-record
 *   Sources trail.
 * - Evidence graph (`/insights/evidence-graph`) visualizes *provenance and
 *   linkage* for an architecture package’s evidence trail.
 *
 * They stay separate because generating closed-loop reasoning is not the same
 * task as exploring the evidence graph. Distinct from the Evidence graph
 * first-open coach (TB-2244), which teaches graph modes on first visit.
 */

import { ARCHITECTURE_INTELLIGENCE_PATH } from "@/lib/architecture/architecture-intelligence-route";
import { EVIDENCE_GRAPH_PATH } from "@/lib/evidence-graph-route";

export type ArchitectureIntelligenceEvidenceGraphSurfaceId =
  | "architecture-intelligence"
  | "evidence-graph";

export type ArchitectureIntelligenceEvidenceGraphLink = {
  readonly id: ArchitectureIntelligenceEvidenceGraphSurfaceId;
  readonly label: string;
  readonly href: string;
  readonly whenToUse: string;
};

export type ArchitectureIntelligenceEvidenceGraphVocabularyModel = {
  readonly heading: string;
  readonly whyTwo: string;
  readonly compactLine: string;
  readonly architectureIntelligenceLink: ArchitectureIntelligenceEvidenceGraphLink;
  readonly evidenceGraphLink: ArchitectureIntelligenceEvidenceGraphLink;
};

export const ARCHITECTURE_INTELLIGENCE_EVIDENCE_GRAPH_HEADING =
  "Architecture intelligence and Evidence graph serve different purposes" as const;

export const ARCHITECTURE_INTELLIGENCE_EVIDENCE_GRAPH_WHY_TWO =
  "Architecture intelligence runs closed-loop architecture reasoning against a free-form description. Evidence graph visualizes provenance and linkage in an architecture package’s evidence trail. Reasoning is not graph exploration." as const;

export const ARCHITECTURE_INTELLIGENCE_EVIDENCE_GRAPH_COMPACT_LINE =
  "Architecture intelligence runs closed-loop reasoning; Evidence graph shows provenance linkage — open the other when you need both." as const;

export const ARCHITECTURE_INTELLIGENCE_EVIDENCE_GRAPH_INTELLIGENCE_LINK: ArchitectureIntelligenceEvidenceGraphLink =
  {
    id: "architecture-intelligence",
    label: "Architecture intelligence",
    href: ARCHITECTURE_INTELLIGENCE_PATH,
    whenToUse: "Run closed-loop architecture reasoning or the golden regression harness.",
  };

export const ARCHITECTURE_INTELLIGENCE_EVIDENCE_GRAPH_GRAPH_LINK: ArchitectureIntelligenceEvidenceGraphLink =
  {
    id: "evidence-graph",
    label: "Evidence graph",
    href: EVIDENCE_GRAPH_PATH,
    whenToUse: "Explore provenance and linkage in an architecture package’s evidence trail.",
  };

/** Full vocabulary model (heading, why-two copy, and deep links). */
export function buildArchitectureIntelligenceEvidenceGraphVocabulary(): ArchitectureIntelligenceEvidenceGraphVocabularyModel {
  return {
    heading: ARCHITECTURE_INTELLIGENCE_EVIDENCE_GRAPH_HEADING,
    whyTwo: ARCHITECTURE_INTELLIGENCE_EVIDENCE_GRAPH_WHY_TWO,
    compactLine: ARCHITECTURE_INTELLIGENCE_EVIDENCE_GRAPH_COMPACT_LINE,
    architectureIntelligenceLink: ARCHITECTURE_INTELLIGENCE_EVIDENCE_GRAPH_INTELLIGENCE_LINK,
    evidenceGraphLink: ARCHITECTURE_INTELLIGENCE_EVIDENCE_GRAPH_GRAPH_LINK,
  };
}

/** Peer deep-link for the surface you are not currently on. */
export function resolveArchitectureIntelligenceEvidenceGraphPeerLink(
  currentSurfaceId: ArchitectureIntelligenceEvidenceGraphSurfaceId,
): ArchitectureIntelligenceEvidenceGraphLink {
  if (currentSurfaceId === "architecture-intelligence") {
    return ARCHITECTURE_INTELLIGENCE_EVIDENCE_GRAPH_GRAPH_LINK;
  }

  return ARCHITECTURE_INTELLIGENCE_EVIDENCE_GRAPH_INTELLIGENCE_LINK;
}
