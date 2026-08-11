/**
 * TB-2245 — Connection status ≠ Cloud connections vocabulary rail.
 *
 * Why two surfaces exist:
 * - Connection status (`/administration/connection-status`) shows which
 *   notification, ticketing, publishing, and delivery integrations are ready
 *   for this workspace.
 * - Cloud connections (`/integrations/cloud-connections`) configures Azure,
 *   AWS, and GCP inventory connections used to collect architecture evidence.
 *
 * They stay separate because integration readiness is not cloud inventory
 * setup. Operators need both surfaces with deep links so they do not treat
 * one “connection” hub as the other.
 */

import {
  ADMINISTRATION_CONNECTION_STATUS_PATH,
  CLOUD_CONNECTIONS_PATH,
} from "@/lib/integrations-nav-paths";

export type ConnectionStatusCloudConnectionsSurfaceId =
  | "connection-status"
  | "cloud-connections";

export type ConnectionStatusCloudConnectionsLink = {
  readonly id: ConnectionStatusCloudConnectionsSurfaceId;
  readonly label: string;
  readonly href: string;
  readonly whenToUse: string;
};

export type ConnectionStatusCloudConnectionsVocabularyModel = {
  readonly heading: string;
  readonly whyTwo: string;
  readonly compactLine: string;
  readonly connectionStatusLink: ConnectionStatusCloudConnectionsLink;
  readonly cloudConnectionsLink: ConnectionStatusCloudConnectionsLink;
};

export const CONNECTION_STATUS_CLOUD_CONNECTIONS_HEADING =
  "Connection status and cloud connections do different jobs" as const;

export const CONNECTION_STATUS_CLOUD_CONNECTIONS_WHY_TWO =
  "Connection status shows which notification, ticketing, publishing, and delivery integrations are ready for this workspace. Cloud connections configures Azure, AWS, and GCP inventory connections that collect architecture evidence. Both use the word “connection,” but one is integration readiness and the other is cloud inventory setup — open the peer link when you need the other job." as const;

export const CONNECTION_STATUS_CLOUD_CONNECTIONS_COMPACT_LINE =
  "Connection status is integration readiness; Cloud connections configures cloud inventory — open the other when you need both." as const;

export const CONNECTION_STATUS_CLOUD_CONNECTIONS_STATUS_LINK: ConnectionStatusCloudConnectionsLink =
  {
    id: "connection-status",
    label: "Connection status",
    href: ADMINISTRATION_CONNECTION_STATUS_PATH,
    whenToUse: "See which workspace integrations are ready, recommended, or optional.",
  };

export const CONNECTION_STATUS_CLOUD_CONNECTIONS_CLOUD_LINK: ConnectionStatusCloudConnectionsLink =
  {
    id: "cloud-connections",
    label: "Cloud connections",
    href: CLOUD_CONNECTIONS_PATH,
    whenToUse: "Configure Azure, AWS, or GCP inventory connections for architecture evidence.",
  };

/** Full vocabulary model (heading, why-two copy, and deep links). */
export function buildConnectionStatusCloudConnectionsVocabulary(): ConnectionStatusCloudConnectionsVocabularyModel {
  return {
    heading: CONNECTION_STATUS_CLOUD_CONNECTIONS_HEADING,
    whyTwo: CONNECTION_STATUS_CLOUD_CONNECTIONS_WHY_TWO,
    compactLine: CONNECTION_STATUS_CLOUD_CONNECTIONS_COMPACT_LINE,
    connectionStatusLink: CONNECTION_STATUS_CLOUD_CONNECTIONS_STATUS_LINK,
    cloudConnectionsLink: CONNECTION_STATUS_CLOUD_CONNECTIONS_CLOUD_LINK,
  };
}

/** Peer deep-link for the surface you are not currently on. */
export function resolveConnectionStatusCloudConnectionsPeerLink(
  currentSurfaceId: ConnectionStatusCloudConnectionsSurfaceId,
): ConnectionStatusCloudConnectionsLink {
  if (currentSurfaceId === "connection-status") {
    return CONNECTION_STATUS_CLOUD_CONNECTIONS_CLOUD_LINK;
  }

  return CONNECTION_STATUS_CLOUD_CONNECTIONS_STATUS_LINK;
}
