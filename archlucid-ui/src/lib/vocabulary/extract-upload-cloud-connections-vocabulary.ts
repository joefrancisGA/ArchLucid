/**
 * TB-2281 — Extract & Upload ≠ Cloud connections vocabulary rail.
 *
 * Why two “how evidence gets in” surfaces exist:
 * - Extract & Upload (`/administration/extract-upload`) is the offline ZIP /
 *   extractor settings path for uploading an Azure inventory package.
 * - Cloud connections (`/integrations/cloud-connections`) configures live
 *   Azure, AWS, and GCP inventory connections that collect architecture evidence.
 *
 * They stay separate because uploading an extractor ZIP is not configuring
 * live cloud inventory. Distinct from Connection status ≠ Cloud connections
 * (TB-2245), which reconciles integration readiness with cloud inventory.
 */

import { EXTRACT_UPLOAD_SETTINGS_PATH } from "@/lib/core-pilot-steps";
import { CLOUD_CONNECTIONS_PATH } from "@/lib/integrations-nav-paths";

export type ExtractUploadCloudConnectionsSurfaceId =
  | "extract-upload"
  | "cloud-connections";

export type ExtractUploadCloudConnectionsLink = {
  readonly id: ExtractUploadCloudConnectionsSurfaceId;
  readonly label: string;
  readonly href: string;
  readonly whenToUse: string;
};

export type ExtractUploadCloudConnectionsVocabularyModel = {
  readonly heading: string;
  readonly whyTwo: string;
  readonly compactLine: string;
  readonly extractUploadLink: ExtractUploadCloudConnectionsLink;
  readonly cloudConnectionsLink: ExtractUploadCloudConnectionsLink;
};

export const EXTRACT_UPLOAD_CLOUD_CONNECTIONS_HEADING =
  "Extract & Upload and Cloud connections serve different purposes" as const;

export const EXTRACT_UPLOAD_CLOUD_CONNECTIONS_WHY_TWO =
  "Extract & Upload is the offline ZIP and extractor settings path for uploading an Azure inventory package into architecture reviews. Cloud connections configures live Azure, AWS, and GCP inventory connections that collect architecture evidence. Uploading a package is not the same as configuring live cloud inventory." as const;

export const EXTRACT_UPLOAD_CLOUD_CONNECTIONS_COMPACT_LINE =
  "Extract & Upload uploads an offline inventory ZIP; Cloud connections configures live cloud inventory — open the other when you need both." as const;

export const EXTRACT_UPLOAD_CLOUD_CONNECTIONS_EXTRACT_LINK: ExtractUploadCloudConnectionsLink =
  {
    id: "extract-upload",
    label: "Extract & Upload",
    href: EXTRACT_UPLOAD_SETTINGS_PATH,
    whenToUse: "Run the extractor locally and upload an Azure inventory ZIP.",
  };

export const EXTRACT_UPLOAD_CLOUD_CONNECTIONS_CLOUD_LINK: ExtractUploadCloudConnectionsLink =
  {
    id: "cloud-connections",
    label: "Cloud connections",
    href: CLOUD_CONNECTIONS_PATH,
    whenToUse: "Configure Azure, AWS, or GCP inventory connections for architecture evidence.",
  };

/** Full vocabulary model (heading, why-two copy, and deep links). */
export function buildExtractUploadCloudConnectionsVocabulary(): ExtractUploadCloudConnectionsVocabularyModel {
  return {
    heading: EXTRACT_UPLOAD_CLOUD_CONNECTIONS_HEADING,
    whyTwo: EXTRACT_UPLOAD_CLOUD_CONNECTIONS_WHY_TWO,
    compactLine: EXTRACT_UPLOAD_CLOUD_CONNECTIONS_COMPACT_LINE,
    extractUploadLink: EXTRACT_UPLOAD_CLOUD_CONNECTIONS_EXTRACT_LINK,
    cloudConnectionsLink: EXTRACT_UPLOAD_CLOUD_CONNECTIONS_CLOUD_LINK,
  };
}

/** Peer deep-link for the surface you are not currently on. */
export function resolveExtractUploadCloudConnectionsPeerLink(
  currentSurfaceId: ExtractUploadCloudConnectionsSurfaceId,
): ExtractUploadCloudConnectionsLink {
  if (currentSurfaceId === "extract-upload") {
    return EXTRACT_UPLOAD_CLOUD_CONNECTIONS_CLOUD_LINK;
  }

  return EXTRACT_UPLOAD_CLOUD_CONNECTIONS_EXTRACT_LINK;
}
