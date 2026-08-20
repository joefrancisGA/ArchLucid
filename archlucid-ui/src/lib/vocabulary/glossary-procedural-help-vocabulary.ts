/**
 * TB-2308 — Glossary ≠ procedural Help vocabulary rail.
 *
 * Why two surfaces exist:
 * - Glossary (`/help/glossary`) defines product terms for architects and buyers
 *   — orientation vocabulary and definitions.
 * - Help hub (`/help`) is the procedural help landing for how-to topics,
 *   guides, and runbooks.
 *
 * They stay separate because looking up a term definition is not the same task
 * as following a how-to topic or runbook.
 */

import { GLOSSARY_HELP_CANONICAL_PATH } from "@/lib/glossary-help-evidence-copy";
import { HELP_HUB_CANONICAL_PATH } from "@/lib/help/help-hub-evidence-copy";
import type { PairwiseVocabularyRailModel } from "@/lib/vocabulary/create-pairwise-vocabulary-rail";

export type GlossaryProceduralHelpSurfaceId = "glossary" | "help-hub";

export type GlossaryProceduralHelpLink = {
  readonly id: GlossaryProceduralHelpSurfaceId;
  readonly label: string;
  readonly href: string;
  readonly whenToUse: string;
};

export type GlossaryProceduralHelpVocabularyModel = {
  readonly heading: string;
  readonly whyTwo: string;
  readonly compactLine: string;
  readonly glossaryLink: GlossaryProceduralHelpLink;
  readonly helpHubLink: GlossaryProceduralHelpLink;
};

export const GLOSSARY_PROCEDURAL_HELP_HEADING =
  "Glossary and Help serve different purposes" as const;

export const GLOSSARY_PROCEDURAL_HELP_WHY_TWO =
  "Glossary defines product terms for architects and buyers — orientation vocabulary and definitions. Help is the hub for how-to topics, guides, and runbooks. Looking up a term is not the same as following a procedural guide." as const;

export const GLOSSARY_PROCEDURAL_HELP_COMPACT_LINE =
  "Glossary is term definitions; Help is how-to topics and runbooks." as const;

export const GLOSSARY_PROCEDURAL_HELP_GLOSSARY_LINK: GlossaryProceduralHelpLink = {
  id: "glossary",
  label: "Glossary",
  href: GLOSSARY_HELP_CANONICAL_PATH,
  whenToUse: "Look up product term definitions for architects and buyers.",
};

export const GLOSSARY_PROCEDURAL_HELP_HELP_HUB_LINK: GlossaryProceduralHelpLink = {
  id: "help-hub",
  label: "Help",
  href: HELP_HUB_CANONICAL_PATH,
  whenToUse: "Browse how-to topics, guides, and runbooks from the Help hub.",
};

/** Pairwise model for Glossary ↔ Help hub (fixed routes). */
export function buildGlossaryProceduralHelpPairwiseRail(): PairwiseVocabularyRailModel<GlossaryProceduralHelpSurfaceId> {
  return {
    heading: GLOSSARY_PROCEDURAL_HELP_HEADING,
    whyTwo: GLOSSARY_PROCEDURAL_HELP_WHY_TWO,
    compactLine: GLOSSARY_PROCEDURAL_HELP_COMPACT_LINE,
    currentLink: GLOSSARY_PROCEDURAL_HELP_GLOSSARY_LINK,
    peerLink: GLOSSARY_PROCEDURAL_HELP_HELP_HUB_LINK,
  };
}

/** Full vocabulary model (heading, why-two copy, and deep links). */
export function buildGlossaryProceduralHelpVocabulary(): GlossaryProceduralHelpVocabularyModel {
  const rail = buildGlossaryProceduralHelpPairwiseRail();

  return {
    heading: rail.heading,
    whyTwo: rail.whyTwo,
    compactLine: rail.compactLine,
    glossaryLink: rail.currentLink,
    helpHubLink: rail.peerLink,
  };
}

/** Peer deep-link for the surface you are not currently on. */
export function resolveGlossaryProceduralHelpPeerLink(
  currentSurfaceId: GlossaryProceduralHelpSurfaceId,
): GlossaryProceduralHelpLink {
  if (currentSurfaceId === "glossary") {
    return GLOSSARY_PROCEDURAL_HELP_HELP_HUB_LINK;
  }

  return GLOSSARY_PROCEDURAL_HELP_GLOSSARY_LINK;
}
