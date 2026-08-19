import { inAppHelpHref } from "@/lib/product-documentation-registry";
import type { EvidenceSourceLink } from "@/lib/evidence-surface-copy";

export const EXTRACT_UPLOAD_SETTINGS_CANONICAL_PATH = "/administration/extract-upload" as const;

export const EXTRACT_UPLOAD_SETTINGS_HELP_TOPIC_LABEL = "How extract and upload works" as const;

export const EXTRACT_UPLOAD_SETTINGS_FOLLOW_UPS_TITLE = "Where to go next";

export const EXTRACT_UPLOAD_SETTINGS_SOURCES_INTRO =
  "Use these follow-ups when an uploaded package turns into a review run, intake guidance, or optional cloud connectors.";

/** Operator Sources - no self-href to `/administration/extract-upload`. */
export const EXTRACT_UPLOAD_SETTINGS_SOURCES: readonly EvidenceSourceLink[] = [
  { label: "Evidence intake help", href: inAppHelpHref("evidence-intake") },
  { label: "Start a review", href: "/architecture/reviews/new" },
  { label: "Architecture reviews", href: "/architecture/reviews" },
  { label: "Cloud connections", href: "/integrations/cloud-connections" },
  { label: "Connect Azure help", href: inAppHelpHref("cloud-connections-azure") },
] as const;

const EXTRACT_UPLOAD_SETTINGS_EXCLUDED_ORIENTATION_SOURCE_HREFS = new Set<string>([
  "/architecture/reviews",
]);

/** Orientation-strip Sources — excludes the Step 2 Go to Reviews CTA destination. */
export const EXTRACT_UPLOAD_SETTINGS_ORIENTATION_SOURCES: readonly EvidenceSourceLink[] =
  EXTRACT_UPLOAD_SETTINGS_SOURCES.filter(
    (source) => !EXTRACT_UPLOAD_SETTINGS_EXCLUDED_ORIENTATION_SOURCE_HREFS.has(source.href),
  );
