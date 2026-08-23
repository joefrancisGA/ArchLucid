import { EXTRACT_UPLOAD_SETTINGS_PATH } from "@/lib/core-pilot-steps";
import { EVIDENCE_GRAPH_PATH } from "@/lib/evidence-graph-route";
import { SETTINGS_ROOT_PATH } from "@/lib/settings-admin-route-paths";

export const EXTRACT_UPLOAD_SETTINGS_PAGE_TITLE = "Extract & Upload" as const;

export const EXTRACT_UPLOAD_SETTINGS_PAGE_SUBTITLE =
  "Run the read-only cloud inventory script locally for your provider, validate the ZIP, then upload it for architecture reviews." as const;

export const EXTRACT_UPLOAD_SETTINGS_PAGE_SUBTITLE_BUYER =
  "Collect a read-only cloud inventory ZIP locally (Azure, AWS, or Google Cloud), validate it, and upload it to start architecture reviews." as const;

export const EXTRACT_UPLOAD_SETTINGS_PRIMARY_CONTENT_ID = "extract-upload-settings-primary-content" as const;

export const EXTRACT_UPLOAD_SETTINGS_SKIP_LINK_LABEL = "Skip to extract and upload workspace" as const;

export const EXTRACT_UPLOAD_SETTINGS_BREADCRUMB_TOPIC_TITLE = EXTRACT_UPLOAD_SETTINGS_PAGE_TITLE;

export function extractUploadSettingsPageSubtitle(buyerPolishedShell: boolean): string {
  return buyerPolishedShell
    ? EXTRACT_UPLOAD_SETTINGS_PAGE_SUBTITLE_BUYER
    : EXTRACT_UPLOAD_SETTINGS_PAGE_SUBTITLE;
}

export const EXTRACT_UPLOAD_SETTINGS_BREADCRUMB_ADMINISTRATION_LABEL = "Administration" as const;

export const EXTRACT_UPLOAD_SETTINGS_BREADCRUMB_ADMINISTRATION_HREF = SETTINGS_ROOT_PATH;

export const EXTRACT_UPLOAD_SETTINGS_NAV_HREF = EXTRACT_UPLOAD_SETTINGS_PATH;

export const EXTRACT_UPLOAD_INVENTORY_ON_FILE_STATUS_LABEL = "Inventory on file" as const;

export const EXTRACT_UPLOAD_NO_INVENTORY_STATUS_LABEL = "No inventory on file" as const;

export const EXTRACT_UPLOAD_INVENTORY_CHECKING_STATUS_LABEL = "Checking inventory…" as const;

export const EXTRACT_UPLOAD_EXTRACTOR_VERSION_METADATA_PREFIX = "Extractor script" as const;

export const EXTRACT_UPLOAD_EVIDENCE_TRAIL_LINK_LABEL = "Evidence trail" as const;

export const EXTRACT_UPLOAD_EVIDENCE_TRAIL_HREF = EVIDENCE_GRAPH_PATH;

export const EXTRACT_UPLOAD_VALIDATE_DISCLOSURE_SUMMARY = "Validate before upload (CLI)" as const;

export const EXTRACT_UPLOAD_VALIDATE_CLI_COMMAND =
  "archlucid azure validate-zip --path <your-package.zip>" as const;

export const EXTRACT_UPLOAD_VALIDATE_AWS_CLI_COMMAND =
  "archlucid aws validate-zip --path <your-package.zip>" as const;

export const EXTRACT_UPLOAD_VALIDATE_GCP_CLI_COMMAND =
  "archlucid gcp validate-zip --path <your-package.zip>" as const;

export const EXTRACT_UPLOAD_DEMO_ASIDE_TITLE = "Try demo data" as const;

export const EXTRACT_UPLOAD_DEMO_ASIDE_DESCRIPTION =
  "Upload a bundled synthetic cloud inventory ZIP — same format as read-only packager output — without running a script locally." as const;

export const EXTRACT_UPLOAD_STEP_COLLECT_TITLE = "Step 1 — Collect inventory locally" as const;

export const EXTRACT_UPLOAD_STEP_COLLECT_DESCRIPTION =
  "Copy the quick-start command for your cloud provider, run it locally, then upload the ZIP in Step 2. Use preview mode on the advanced script when you need a dry run first." as const;

export const EXTRACT_UPLOAD_STEP_UPLOAD_TITLE = "Step 2 — Upload ZIP" as const;

export const EXTRACT_UPLOAD_STEP_UPLOAD_DESCRIPTION =
  "Drag and drop or browse. Client-side checks validate the package format before upload." as const;

export const EXTRACT_UPLOAD_ADVANCED_COMMAND_DISCLOSURE_SUMMARY =
  "Advanced: full inventory packager command (Azure example)" as const;

export const EXTRACT_UPLOAD_SCRIPT_DOWNLOAD_LABEL =
  "Download packager script — Azure example (inspect before running)" as const;

export const EXTRACT_UPLOAD_DROP_ZONE_ARIA_LABEL = "Cloud inventory ZIP upload" as const;

export const EXTRACT_UPLOAD_UPLOAD_ERROR_TOAST_TITLE = "Inventory upload" as const;

export const EXTRACT_UPLOAD_UPLOAD_SUCCESS_TOAST_MESSAGE =
  "Inventory package uploaded — open Reviews to attach it to a review." as const;
