import type { Metadata } from "next";

import { ExtractUploadSettingsPageClient } from "@/app/(operator)/administration/extract-upload/_sections/ExtractUploadSettingsPageClient";
import { OPERATOR_NAV_LINK_LABELS } from "@/lib/i18n";

export const metadata: Metadata = {
  title: OPERATOR_NAV_LINK_LABELS.extractUpload,
};

/** SecureNow inventory intake — same Extract & upload workspace under Infrastructure nav. */
export default function InfrastructureExtractUploadPage() {
  return <ExtractUploadSettingsPageClient />;
}
