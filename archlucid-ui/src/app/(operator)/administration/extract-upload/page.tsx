import { redirect } from "next/navigation";

import { ExtractUploadSettingsPageClient } from "./_sections/ExtractUploadSettingsPageClient";
import { EXTRACT_UPLOAD_SETTINGS_CANONICAL_PATH } from "@/lib/extract-upload-settings-evidence-copy";
import { extractUploadSettingsPathForProductLine } from "@/lib/extract-upload-settings-route";
import { resolveProductLineIdFromEnv } from "@/lib/product-line/resolve-product-line-id";

export default function ExtractUploadSettingsPage() {
  const canonicalPath = extractUploadSettingsPathForProductLine(resolveProductLineIdFromEnv());

  if (canonicalPath !== EXTRACT_UPLOAD_SETTINGS_CANONICAL_PATH) {
    redirect(canonicalPath);
  }

  return <ExtractUploadSettingsPageClient />;
}
