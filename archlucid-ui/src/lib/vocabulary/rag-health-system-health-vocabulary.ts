/**
 * TB-2285 — RAG health ≠ System health vocabulary rail.
 *
 * Why two health surfaces exist:
 * - RAG corpus health (`/internal/rag-health`) shows per-corpus chunk counts and
 *   last-indexed timestamps for retrieval-augmented generation on this API host.
 * - System health (`/administration/system-health`) is the platform readiness
 *   and dependency probe dashboard for this deployment.
 *
 * They stay separate because RAG indexing posture is not platform dependency
 * probes. Operators need both with deep links so they do not treat one “health”
 * surface as the other.
 */

import { ADMINISTRATION_SYSTEM_HEALTH_PATH } from "@/lib/administration-route-paths";
import { INTERNAL_RAG_HEALTH_PATH } from "@/lib/internal-ops-route-paths";
import type { PairwiseVocabularyRailModel } from "@/lib/vocabulary/create-pairwise-vocabulary-rail";

export type RagHealthSystemHealthSurfaceId = "rag-health" | "system-health";

export type RagHealthSystemHealthLink = {
  readonly id: RagHealthSystemHealthSurfaceId;
  readonly label: string;
  readonly href: string;
  readonly whenToUse: string;
};

export type RagHealthSystemHealthVocabularyModel = {
  readonly heading: string;
  readonly whyTwo: string;
  readonly compactLine: string;
  readonly ragHealthLink: RagHealthSystemHealthLink;
  readonly systemHealthLink: RagHealthSystemHealthLink;
};

export const RAG_HEALTH_SYSTEM_HEALTH_HEADING =
  "RAG health and system health stay separate" as const;

export const RAG_HEALTH_SYSTEM_HEALTH_WHY_TWO =
  "RAG corpus health shows per-corpus chunk counts and last-indexed timestamps for retrieval on this API host. System health shows platform readiness and dependency probes for this deployment. Corpus indexing posture is not platform probes." as const;

export const RAG_HEALTH_SYSTEM_HEALTH_COMPACT_LINE =
  "RAG health is corpus indexing; System health is platform probes — open the other when you need both." as const;

export const RAG_HEALTH_SYSTEM_HEALTH_RAG_LINK: RagHealthSystemHealthLink = {
  id: "rag-health",
  label: "RAG corpus health",
  href: INTERNAL_RAG_HEALTH_PATH,
  whenToUse: "Review chunk counts and last-indexed timestamps per corpus.",
};

export const RAG_HEALTH_SYSTEM_HEALTH_SYSTEM_LINK: RagHealthSystemHealthLink = {
  id: "system-health",
  label: "System health",
  href: ADMINISTRATION_SYSTEM_HEALTH_PATH,
  whenToUse: "Check platform readiness and critical dependency probes.",
};

/** Pairwise model for RAG health ↔ System health (fixed routes). */
export function buildRagHealthSystemHealthPairwiseRail(): PairwiseVocabularyRailModel<RagHealthSystemHealthSurfaceId> {
  return {
    heading: RAG_HEALTH_SYSTEM_HEALTH_HEADING,
    whyTwo: RAG_HEALTH_SYSTEM_HEALTH_WHY_TWO,
    compactLine: RAG_HEALTH_SYSTEM_HEALTH_COMPACT_LINE,
    currentLink: RAG_HEALTH_SYSTEM_HEALTH_RAG_LINK,
    peerLink: RAG_HEALTH_SYSTEM_HEALTH_SYSTEM_LINK,
  };
}

/** Full vocabulary model (heading, why-two, and deep links). */
export function buildRagHealthSystemHealthVocabulary(): RagHealthSystemHealthVocabularyModel {
  const rail = buildRagHealthSystemHealthPairwiseRail();

  return {
    heading: rail.heading,
    whyTwo: rail.whyTwo,
    compactLine: rail.compactLine,
    ragHealthLink: rail.currentLink,
    systemHealthLink: rail.peerLink,
  };
}

/** Peer deep-link for the surface you are not currently on. */
export function resolveRagHealthSystemHealthPeerLink(
  currentSurfaceId: RagHealthSystemHealthSurfaceId,
): RagHealthSystemHealthLink {
  if (currentSurfaceId === "rag-health") {
    return RAG_HEALTH_SYSTEM_HEALTH_SYSTEM_LINK;
  }

  return RAG_HEALTH_SYSTEM_HEALTH_RAG_LINK;
}
