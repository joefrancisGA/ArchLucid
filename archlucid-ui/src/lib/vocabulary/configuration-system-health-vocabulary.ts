/**
 * TB-2279 — Configuration summary ≠ System health vocabulary rail.
 *
 * Why two “is the platform OK?” surfaces exist:
 * - Configuration summary (`/internal/configuration`) browses effective
 *   deployment knobs and catalog lint — settings inventory, not live probes.
 * - System health (`/administration/system-health`) shows platform readiness
 *   and critical dependency probes for this deployment.
 *
 * They stay separate because browsing knobs is not watching live probes.
 * Distinct from the Tenant / System / Workspace health triad (TB-2252), which
 * never covered configuration summary.
 */

import { ADMINISTRATION_SYSTEM_HEALTH_PATH } from "@/lib/administration-route-paths";
import { INTERNAL_CONFIGURATION_PATH } from "@/lib/internal-ops-route-paths";
import type { PairwiseVocabularyRailModel } from "@/lib/vocabulary/create-pairwise-vocabulary-rail";

export type ConfigurationSystemHealthSurfaceId =
  | "configuration-summary"
  | "system-health";

export type ConfigurationSystemHealthLink = {
  readonly id: ConfigurationSystemHealthSurfaceId;
  readonly label: string;
  readonly href: string;
  readonly whenToUse: string;
};

export type ConfigurationSystemHealthVocabularyModel = {
  readonly heading: string;
  readonly whyTwo: string;
  readonly compactLine: string;
  readonly configurationLink: ConfigurationSystemHealthLink;
  readonly systemHealthLink: ConfigurationSystemHealthLink;
};

export const CONFIGURATION_SYSTEM_HEALTH_HEADING =
  "Configuration summary and System health serve different purposes" as const;

export const CONFIGURATION_SYSTEM_HEALTH_WHY_TWO =
  "Configuration summary browses effective deployment knobs and catalog lint for this tenant. System health shows live platform readiness and critical dependency probes. Reading settings is not the same as watching probes." as const;

export const CONFIGURATION_SYSTEM_HEALTH_COMPACT_LINE =
  "Configuration summary browses knobs and lint; System health shows live dependency probes — open the other when you need both." as const;

export const CONFIGURATION_SYSTEM_HEALTH_CONFIGURATION_LINK: ConfigurationSystemHealthLink = {
  id: "configuration-summary",
  label: "Configuration summary",
  href: INTERNAL_CONFIGURATION_PATH,
  whenToUse: "Browse effective deployment knobs and catalog lint.",
};

export const CONFIGURATION_SYSTEM_HEALTH_SYSTEM_HEALTH_LINK: ConfigurationSystemHealthLink = {
  id: "system-health",
  label: "System health",
  href: ADMINISTRATION_SYSTEM_HEALTH_PATH,
  whenToUse: "Check platform readiness and critical dependency probes.",
};

/** Pairwise model for Configuration summary ↔ System health (fixed routes). */
export function buildConfigurationSystemHealthPairwiseRail(): PairwiseVocabularyRailModel<ConfigurationSystemHealthSurfaceId> {
  return {
    heading: CONFIGURATION_SYSTEM_HEALTH_HEADING,
    whyTwo: CONFIGURATION_SYSTEM_HEALTH_WHY_TWO,
    compactLine: CONFIGURATION_SYSTEM_HEALTH_COMPACT_LINE,
    currentLink: CONFIGURATION_SYSTEM_HEALTH_CONFIGURATION_LINK,
    peerLink: CONFIGURATION_SYSTEM_HEALTH_SYSTEM_HEALTH_LINK,
  };
}

/** Full vocabulary model (heading, why-two copy, and deep links). */
export function buildConfigurationSystemHealthVocabulary(): ConfigurationSystemHealthVocabularyModel {
  const rail = buildConfigurationSystemHealthPairwiseRail();

  return {
    heading: rail.heading,
    whyTwo: rail.whyTwo,
    compactLine: rail.compactLine,
    configurationLink: rail.currentLink,
    systemHealthLink: rail.peerLink,
  };
}

/** Peer deep-link for the surface you are not currently on. */
export function resolveConfigurationSystemHealthPeerLink(
  currentSurfaceId: ConfigurationSystemHealthSurfaceId,
): ConfigurationSystemHealthLink {
  if (currentSurfaceId === "configuration-summary") {
    return CONFIGURATION_SYSTEM_HEALTH_SYSTEM_HEALTH_LINK;
  }

  return CONFIGURATION_SYSTEM_HEALTH_CONFIGURATION_LINK;
}
