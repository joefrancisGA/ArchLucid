import { inAppHelpHref } from "@/lib/product-documentation-registry";

export const EXTRACT_UPLOAD_SETTINGS_CANONICAL_PATH = "/administration/extract-upload" as const;

export const EXTRACT_UPLOAD_SETTINGS_CLAIM_DISCIPLINE =
  "This Extract and Upload page collects a read-only Azure inventory ZIP for architecture reviews - it is not a signed-review diligence Sources package. Open Evidence intake help, Start a review, or Cloud connections when you need intake guidance or live connectors.";

export const EXTRACT_UPLOAD_SETTINGS_SOURCES_INTRO =
  "Use these follow-ups when an uploaded package turns into a review run, intake guidance, or optional cloud connectors.";

export type ExtractUploadSettingsSourceLink = {
  readonly label: string;
  readonly href: string;
};

/** Operator Sources - no self-href to `/administration/extract-upload`. */
export const EXTRACT_UPLOAD_SETTINGS_SOURCES: readonly ExtractUploadSettingsSourceLink[] = [
  { label: "Evidence intake help", href: inAppHelpHref("evidence-intake") },
  { label: "Start a review", href: "/architecture/reviews/new" },
  { label: "Architecture reviews", href: "/architecture/reviews" },
  { label: "Cloud connections", href: "/integrations/cloud-connections" },
  { label: "Connect Azure help", href: inAppHelpHref("cloud-connections-azure") },
] as const;
