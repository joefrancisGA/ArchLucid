import { CLOUD_CONNECTIONS_PATH } from "@/lib/integrations-nav-paths";
import { EXTRACT_UPLOAD_PATH } from "@/lib/administration/extract-upload-demo-scenario-url";

export const SECURENOW_SECOND_CAPTURE_CTA_LABEL = "Run another capture" as const;

export const SECURENOW_SECOND_CAPTURE_CLOUD_CONNECTIONS_LABEL = "Cloud connections" as const;

export const SECURENOW_SECOND_CAPTURE_EXTRACT_UPLOAD_LABEL = "Extract and upload" as const;

export const SECURENOW_SECOND_CAPTURE_CTA_HREFS = {
  cloudConnections: CLOUD_CONNECTIONS_PATH,
  extractUpload: EXTRACT_UPLOAD_PATH,
} as const;