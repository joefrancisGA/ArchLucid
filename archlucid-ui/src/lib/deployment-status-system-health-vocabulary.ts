/**
 * TB-2287 — Deployment status ≠ System health vocabulary rail.
 *
 * Why two surfaces exist:
 * - Deployment status (`/internal/deployment-status`) shows release identity and
 *   component agreement for this Internal Operations build.
 * - System health (`/administration/system-health`) is the platform readiness
 *   and dependency probe dashboard for this deployment.
 *
 * They stay separate because BUILD/component agreement is not live dependency
 * probes. Operators need both with deep links so they do not treat one “status”
 * or “health” surface as the other.
 */

import { ADMINISTRATION_SYSTEM_HEALTH_PATH } from "@/lib/administration-route-paths";
import { INTERNAL_DEPLOYMENT_STATUS_PATH } from "@/lib/internal-ops-route-paths";

export type DeploymentStatusSystemHealthSurfaceId = "deployment-status" | "system-health";

export type DeploymentStatusSystemHealthLink = {
  readonly id: DeploymentStatusSystemHealthSurfaceId;
  readonly label: string;
  readonly href: string;
  readonly whenToUse: string;
};

export type DeploymentStatusSystemHealthVocabularyModel = {
  readonly heading: string;
  readonly whyTwo: string;
  readonly compactLine: string;
  readonly deploymentStatusLink: DeploymentStatusSystemHealthLink;
  readonly systemHealthLink: DeploymentStatusSystemHealthLink;
};

export const DEPLOYMENT_STATUS_SYSTEM_HEALTH_HEADING =
  "Deployment status and system health stay separate" as const;

export const DEPLOYMENT_STATUS_SYSTEM_HEALTH_WHY_TWO =
  "Deployment status shows release identity and component agreement for this Internal Operations build. System health shows platform readiness and dependency probes for this deployment. BUILD agreement is not live dependency probes — open the peer link when you need the other job." as const;

export const DEPLOYMENT_STATUS_SYSTEM_HEALTH_COMPACT_LINE =
  "Deployment status is release identity; System health is platform probes — open the other when you need both." as const;

export const DEPLOYMENT_STATUS_SYSTEM_HEALTH_DEPLOYMENT_LINK: DeploymentStatusSystemHealthLink = {
  id: "deployment-status",
  label: "Deployment status",
  href: INTERNAL_DEPLOYMENT_STATUS_PATH,
  whenToUse: "Confirm release identity and component agreement for this build.",
};

export const DEPLOYMENT_STATUS_SYSTEM_HEALTH_SYSTEM_LINK: DeploymentStatusSystemHealthLink = {
  id: "system-health",
  label: "System health",
  href: ADMINISTRATION_SYSTEM_HEALTH_PATH,
  whenToUse: "Check platform readiness and critical dependency probes.",
};

/** Full vocabulary model (heading, why-two, and deep links). */
export function buildDeploymentStatusSystemHealthVocabulary(): DeploymentStatusSystemHealthVocabularyModel {
  return {
    heading: DEPLOYMENT_STATUS_SYSTEM_HEALTH_HEADING,
    whyTwo: DEPLOYMENT_STATUS_SYSTEM_HEALTH_WHY_TWO,
    compactLine: DEPLOYMENT_STATUS_SYSTEM_HEALTH_COMPACT_LINE,
    deploymentStatusLink: DEPLOYMENT_STATUS_SYSTEM_HEALTH_DEPLOYMENT_LINK,
    systemHealthLink: DEPLOYMENT_STATUS_SYSTEM_HEALTH_SYSTEM_LINK,
  };
}

/** Peer deep-link for the surface you are not currently on. */
export function resolveDeploymentStatusSystemHealthPeerLink(
  currentSurfaceId: DeploymentStatusSystemHealthSurfaceId,
): DeploymentStatusSystemHealthLink {
  if (currentSurfaceId === "deployment-status") {
    return DEPLOYMENT_STATUS_SYSTEM_HEALTH_SYSTEM_LINK;
  }

  return DEPLOYMENT_STATUS_SYSTEM_HEALTH_DEPLOYMENT_LINK;
}
