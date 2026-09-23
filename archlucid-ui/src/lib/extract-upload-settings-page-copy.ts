import { EXTRACT_UPLOAD_SETTINGS_PATH } from "@/lib/core-pilot-steps";
import { EVIDENCE_GRAPH_PATH } from "@/lib/evidence-graph-route";
import type { CloudInventoryPlatform } from "@/lib/cloud-inventory-platform";
import { cloudInventoryPlatformLabel } from "@/lib/cloud-inventory-platform";
import type { ProductLineId } from "@/lib/product-line/product-line-id";
import { isSecureNowProductLine } from "@/lib/product-line/securenow-cloud-platform-policy";
import { SETTINGS_ROOT_PATH } from "@/lib/settings-admin-route-paths";

export const EXTRACT_UPLOAD_SETTINGS_PAGE_TITLE = "Extract & upload" as const;

export const EXTRACT_UPLOAD_SETTINGS_PAGE_LOADING_SUBTITLE = "Loading extract and upload workspace…" as const;

export const EXTRACT_UPLOAD_SETTINGS_PAGE_SUBTITLE =
  "Schedule a customer-owned inventory agent for production, or run the read-only packager locally, then upload the ZIP for architecture reviews." as const;

export const EXTRACT_UPLOAD_SETTINGS_PAGE_SUBTITLE_BUYER =
  "Collect a read-only cloud inventory ZIP on a schedule or locally (Azure, AWS, or Google Cloud), then upload it to start architecture reviews." as const;

export const EXTRACT_UPLOAD_SETTINGS_PAGE_SUBTITLE_SECURENOW =
  "Collect a read-only Azure inventory ZIP" as const;

export const EXTRACT_UPLOAD_SETTINGS_PRIMARY_CONTENT_ID = "extract-upload-settings-primary-content" as const;

export const EXTRACT_UPLOAD_SETTINGS_FIRST_VIEWPORT_ID = "extract-upload-settings-first-viewport" as const;

export const EXTRACT_UPLOAD_SETTINGS_FIRST_VIEWPORT_TEST_ID = EXTRACT_UPLOAD_SETTINGS_FIRST_VIEWPORT_ID;

export const EXTRACT_UPLOAD_SETTINGS_SKIP_TARGET_ID = EXTRACT_UPLOAD_SETTINGS_FIRST_VIEWPORT_ID;

export const EXTRACT_UPLOAD_SETTINGS_SKIP_LINK_LABEL = "Skip to extract and upload workspace" as const;

export const EXTRACT_UPLOAD_SETTINGS_BREADCRUMB_TOPIC_TITLE = EXTRACT_UPLOAD_SETTINGS_PAGE_TITLE;

export function extractUploadSettingsPageSubtitle(
  buyerPolishedShell: boolean,
  productLineId: ProductLineId = "architecture",
): string {
  if (isSecureNowProductLine(productLineId)) {
    return EXTRACT_UPLOAD_SETTINGS_PAGE_SUBTITLE_SECURENOW;
  }

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

export const EXTRACT_UPLOAD_BASELINE_STATUS_PENDING_MESSAGE =
  "Wait until inventory baseline status finishes loading before uploading a replacement package." as const;

export const EXTRACT_UPLOAD_EXTRACTOR_VERSION_METADATA_PREFIX = "Extractor script" as const;

export const EXTRACT_UPLOAD_EVIDENCE_TRAIL_LINK_LABEL = "Evidence graph" as const;

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

export const EXTRACT_UPLOAD_STEP_COLLECT_TITLE = "Step 1 — Collect inventory" as const;

export const EXTRACT_UPLOAD_STEP_COLLECT_DESCRIPTION =
  "Schedule a customer-owned agent for production collection, or run a one-time local command for a pilot. Upload the ZIP in Step 2." as const;

export const EXTRACT_UPLOAD_SCHEDULED_AGENT_TITLE = "Recommended: schedule a customer-owned agent" as const;

export const EXTRACT_UPLOAD_SCHEDULED_AGENT_DESCRIPTION =
  "Deploy a runbook or timer Function in your subscription so inventory uploads on a cadence — no command line or UI pull. Local scripts remain for one-time pilots." as const;

export const EXTRACT_UPLOAD_SCHEDULED_AGENT_HELP_HREF = "/help/cloud-connections" as const;

export const EXTRACT_UPLOAD_SCHEDULED_AGENT_HELP_LABEL = "Set up scheduled collection" as const;

export const EXTRACT_UPLOAD_ONE_TIME_LOCAL_DISCLOSURE = "One-time local collection (pilot)" as const;

export const EXTRACT_UPLOAD_STEP_UPLOAD_TITLE = "Step 2 — Upload ZIP" as const;

export const EXTRACT_UPLOAD_STEP_UPLOAD_DESCRIPTION =
  "Drag and drop or browse. Client-side checks validate the package format before upload." as const;

export const EXTRACT_UPLOAD_ADVANCED_COMMAND_DISCLOSURE_SUMMARY =
  "Advanced: full inventory packager command (Azure example)" as const;

export const EXTRACT_UPLOAD_SCRIPT_DOWNLOAD_LABEL =
  "Download packager script — Azure example" as const;

export const EXTRACT_UPLOAD_DROP_ZONE_ARIA_LABEL = "Cloud inventory ZIP upload" as const;

export const EXTRACT_UPLOAD_UPLOAD_ERROR_TOAST_TITLE = "Inventory upload" as const;

export const EXTRACT_UPLOAD_UPLOAD_SUCCESS_TOAST_MESSAGE =
  "Inventory package uploaded — open Reviews to attach it to a review." as const;

export const EXTRACT_UPLOAD_REVIEW_BINDING_PREFIX = "Upload binds to review" as const;

export const EXTRACT_UPLOAD_ACCEPTED_PACKAGE_PANEL_TITLE = "Last accepted architecture package" as const;

export const EXTRACT_UPLOAD_ACCEPTED_REPLACE_LABEL = "Replace inventory" as const;

export const EXTRACT_UPLOAD_CANCEL_REPLACE_LABEL = "Cancel replace" as const;

export const EXTRACT_UPLOAD_REPLACE_CONTINUITY_TITLE = "Replacing inventory on file" as const;

export const EXTRACT_UPLOAD_REPLACE_CONTINUITY_DESCRIPTION =
  "Upload a new package to replace the current inventory baseline. Cancel to keep the accepted package." as const;

export const EXTRACT_UPLOAD_DEMO_CONFIRM_TITLE = "Replace inventory with demo data?" as const;

export const EXTRACT_UPLOAD_DEMO_CONFIRM_DESCRIPTION =
  "Demo data replaces the inventory package on file. Continue only for evaluation — production baselines should use read-only packager output." as const;

export const EXTRACT_UPLOAD_DEMO_CONFIRM_ACTION_LABEL = "Use demo data" as const;

export const EXTRACT_UPLOAD_NON_AZURE_SCRIPT_SOURCE_ARCHITECTURE =
  "Download packager scripts from your ArchLucid checkout under scripts/." as const;

export const EXTRACT_UPLOAD_NON_AZURE_SCRIPT_SOURCE_SECURENOW =
  "Download packager scripts from your SecureNow checkout under scripts/." as const;

export function extractUploadNonAzureScriptSourceHint(
  platform: CloudInventoryPlatform,
  productLineId: ProductLineId = "architecture",
): string {
  const platformLabel = cloudInventoryPlatformLabel(platform);
  const checkoutLead = isSecureNowProductLine(productLineId)
    ? EXTRACT_UPLOAD_NON_AZURE_SCRIPT_SOURCE_SECURENOW
    : EXTRACT_UPLOAD_NON_AZURE_SCRIPT_SOURCE_ARCHITECTURE;

  return checkoutLead.replace(/^Download /, `Download ${platformLabel} `);
}

export const EXTRACT_UPLOAD_PACKAGE_ID_COPY_ERROR_TITLE = "Package id" as const;

export const EXTRACT_UPLOAD_PACKAGE_ID_COPY_ERROR_DETAIL =
  "Could not write to clipboard — copy manually." as const;

export const EXTRACT_UPLOAD_ACCEPTED_SUMMARY_LABEL = "Package accepted" as const;

export const EXTRACT_UPLOAD_EXECUTION_POLICY_SCOPE_PROCESS_COMMAND =
  "Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass" as const;
