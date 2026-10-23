import { inAppHelpHref } from "@/lib/product-documentation-registry";
import {
  SECURENOW_INFRASTRUCTURE_DRIFT_PATH,
  SECURENOW_INFRASTRUCTURE_RESOURCES_PATH,
} from "@/lib/governance/governance-infrastructure-route-paths";
import { SECURENOW_POLICY_PACKS_PATH } from "@/lib/governance/governance-route-paths";
import { CLOUD_CONNECTIONS_PATH } from "@/lib/integrations-nav-paths";
import type { EvidenceSourceLink } from "@/lib/evidence-surface-copy";
import type { ProductLineId } from "@/lib/product-line/product-line-id";
import { isSecureNowProductLine } from "@/lib/product-line/securenow-cloud-platform-policy";

export const EXTRACT_UPLOAD_SETTINGS_CANONICAL_PATH = "/administration/extract-upload" as const;

export const EXTRACT_UPLOAD_SETTINGS_HELP_TOPIC_LABEL = "How extract and upload works" as const;

export const EXTRACT_UPLOAD_SETTINGS_FOLLOW_UPS_TITLE = "Where to go next";

export const EXTRACT_UPLOAD_SETTINGS_SOURCES_INTRO =
  "Use these follow-ups when an uploaded package turns into a review run, intake guidance, or optional cloud connectors.";

export const EXTRACT_UPLOAD_SETTINGS_SECURENOW_SOURCES_INTRO =
  "Use these follow-ups after a validated inventory ZIP loads — open Azure connectors, resource explorer, drift, or policy packs.";

/** Operator Sources - no self-href to `/administration/extract-upload`. */
export const EXTRACT_UPLOAD_SETTINGS_SOURCES: readonly EvidenceSourceLink[] = [
  { label: "Evidence intake help", href: inAppHelpHref("evidence-intake") },
  { label: "Start a review", href: "/architecture/reviews/new" },
  { label: "Architecture reviews", href: "/architecture/reviews" },
  { label: "Cloud connections", href: "/integrations/cloud-connections" },
  { label: "Connect Azure help", href: inAppHelpHref("cloud-connections-azure") },
] as const;

export const EXTRACT_UPLOAD_SETTINGS_SECURENOW_SOURCES: readonly EvidenceSourceLink[] = [
  { label: "Connect Azure help", href: inAppHelpHref("cloud-connections-azure") },
  { label: "Azure connections", href: `${CLOUD_CONNECTIONS_PATH}/azure` },
  { label: "Resource explorer", href: SECURENOW_INFRASTRUCTURE_RESOURCES_PATH },
  { label: "Drift workbench", href: SECURENOW_INFRASTRUCTURE_DRIFT_PATH },
  { label: "Policy packs", href: SECURENOW_POLICY_PACKS_PATH },
] as const;

export function extractUploadSettingsSourcesIntro(productLineId: ProductLineId = "architecture"): string {
  return isSecureNowProductLine(productLineId)
    ? EXTRACT_UPLOAD_SETTINGS_SECURENOW_SOURCES_INTRO
    : EXTRACT_UPLOAD_SETTINGS_SOURCES_INTRO;
}

export function extractUploadSettingsSources(productLineId: ProductLineId = "architecture"): readonly EvidenceSourceLink[] {
  return isSecureNowProductLine(productLineId)
    ? EXTRACT_UPLOAD_SETTINGS_SECURENOW_SOURCES
    : EXTRACT_UPLOAD_SETTINGS_SOURCES;
}

/** The single action an accepted package unlocks; remaining follow-ups stay in "Where to go next". */
export const EXTRACT_UPLOAD_ACCEPTED_PACKAGE_NEXT_ACTION: EvidenceSourceLink = {
  label: "Start a review",
  href: "/architecture/reviews/new",
};

export const EXTRACT_UPLOAD_ACCEPTED_PACKAGE_NEXT_ACTION_SECURENOW: EvidenceSourceLink = {
  label: "Open resource explorer",
  href: SECURENOW_INFRASTRUCTURE_RESOURCES_PATH,
};

export function extractUploadAcceptedPackageNextAction(
  productLineId: ProductLineId = "architecture",
  associateRunId?: string | null,
): EvidenceSourceLink {
  const linkedReviewId = associateRunId?.trim() ?? "";

  if (linkedReviewId.length > 0) {
    return {
      label: "Open linked review",
      href: `/architecture/reviews/${encodeURIComponent(linkedReviewId)}`,
    };
  }

  return isSecureNowProductLine(productLineId)
    ? EXTRACT_UPLOAD_ACCEPTED_PACKAGE_NEXT_ACTION_SECURENOW
    : EXTRACT_UPLOAD_ACCEPTED_PACKAGE_NEXT_ACTION;
}

/** Orientation-strip Sources — same follow-ups as operator Sources. */
export const EXTRACT_UPLOAD_SETTINGS_ORIENTATION_SOURCES: readonly EvidenceSourceLink[] =
  EXTRACT_UPLOAD_SETTINGS_SOURCES;
