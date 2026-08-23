import {
  EXTRACT_UPLOAD_ADVANCED_COMMAND_DISCLOSURE_SUMMARY,
  EXTRACT_UPLOAD_DEMO_ASIDE_DESCRIPTION,
  EXTRACT_UPLOAD_DEMO_ASIDE_TITLE,
  EXTRACT_UPLOAD_DROP_ZONE_ARIA_LABEL,
  EXTRACT_UPLOAD_SETTINGS_PAGE_SUBTITLE,
  EXTRACT_UPLOAD_SETTINGS_PAGE_SUBTITLE_BUYER,
  EXTRACT_UPLOAD_SCRIPT_DOWNLOAD_LABEL,
  EXTRACT_UPLOAD_STEP_COLLECT_DESCRIPTION,
  EXTRACT_UPLOAD_STEP_COLLECT_TITLE,
  EXTRACT_UPLOAD_STEP_UPLOAD_DESCRIPTION,
  EXTRACT_UPLOAD_STEP_UPLOAD_TITLE,
  EXTRACT_UPLOAD_UPLOAD_ERROR_TOAST_TITLE,
  EXTRACT_UPLOAD_UPLOAD_SUCCESS_TOAST_MESSAGE,
  EXTRACT_UPLOAD_VALIDATE_DISCLOSURE_SUMMARY,
} from "@/lib/extract-upload-settings-page-copy";

/** Primary extract-upload surfaces shown before a cloud provider is selected. */
export const EXTRACT_UPLOAD_CLOUD_NEUTRAL_COPY_SURFACES = {
  pageSubtitle: EXTRACT_UPLOAD_SETTINGS_PAGE_SUBTITLE,
  pageSubtitleBuyer: EXTRACT_UPLOAD_SETTINGS_PAGE_SUBTITLE_BUYER,
  demoAsideTitle: EXTRACT_UPLOAD_DEMO_ASIDE_TITLE,
  demoAsideDescription: EXTRACT_UPLOAD_DEMO_ASIDE_DESCRIPTION,
  stepCollectTitle: EXTRACT_UPLOAD_STEP_COLLECT_TITLE,
  stepCollectDescription: EXTRACT_UPLOAD_STEP_COLLECT_DESCRIPTION,
  stepUploadTitle: EXTRACT_UPLOAD_STEP_UPLOAD_TITLE,
  stepUploadDescription: EXTRACT_UPLOAD_STEP_UPLOAD_DESCRIPTION,
  advancedCommandDisclosureSummary: EXTRACT_UPLOAD_ADVANCED_COMMAND_DISCLOSURE_SUMMARY,
  scriptDownloadLabel: EXTRACT_UPLOAD_SCRIPT_DOWNLOAD_LABEL,
  validateDisclosureSummary: EXTRACT_UPLOAD_VALIDATE_DISCLOSURE_SUMMARY,
  dropZoneAriaLabel: EXTRACT_UPLOAD_DROP_ZONE_ARIA_LABEL,
  uploadErrorToastTitle: EXTRACT_UPLOAD_UPLOAD_ERROR_TOAST_TITLE,
  uploadSuccessToastMessage: EXTRACT_UPLOAD_UPLOAD_SUCCESS_TOAST_MESSAGE,
} as const;

/**
 * Phrases that must not appear in {@link EXTRACT_UPLOAD_CLOUD_NEUTRAL_COPY_SURFACES}
 * (implies Azure is required, default, or the only supported inventory path).
 */
export const EXTRACT_UPLOAD_CLOUD_NEUTRAL_BANNED_PHRASES: readonly string[] = [
  "get-archlucidazurepackage",
  "azure extractor",
  "synthetic azure",
  "azure upload",
  "azure package uploaded",
  "upload your azure",
  "upload an azure",
  "manifest.json schemaversion",
  "before the api call",
] as const;

export function listExtractUploadSettingsPageCopyViolations(
  surfaces: Readonly<Record<string, string>> = EXTRACT_UPLOAD_CLOUD_NEUTRAL_COPY_SURFACES,
): string[] {
  const violations: string[] = [];

  for (const [surfaceId, text] of Object.entries(surfaces)) {
    const normalized = text.toLowerCase();

    for (const phrase of EXTRACT_UPLOAD_CLOUD_NEUTRAL_BANNED_PHRASES) {
      if (normalized.includes(phrase)) {
        violations.push(`${surfaceId}: banned phrase "${phrase}"`);
      }
    }
  }

  return violations;
}
