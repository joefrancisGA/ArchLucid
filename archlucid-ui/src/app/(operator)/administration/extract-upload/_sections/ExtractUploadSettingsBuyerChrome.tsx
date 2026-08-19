"use client";

import { ExtractUploadSettingsEvidenceOrientationStrip } from "@/components/evidence-orientation/registry/claim-and-sources-strips";
import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";
import { EXTRACT_UPLOAD_SETTINGS_ORIENTATION_SOURCES } from "@/lib/extract-upload-settings-evidence-copy";
import { HELP_PAGE_LAYOUT } from "@/lib/help/help-page-layout";

/** Buyer default: mount Sources orientation above the extract-upload workspace body (ADX). */
export function ExtractUploadSettingsBuyerChrome(): React.JSX.Element | null {
  if (!isBuyerPolishedOperatorShellEnv()) {
    return null;
  }

  return (
    <div data-testid="extract-upload-settings-orientation-top">
      <ExtractUploadSettingsEvidenceOrientationStrip
        readingBodyClassName={HELP_PAGE_LAYOUT.readingBody}
        sources={EXTRACT_UPLOAD_SETTINGS_ORIENTATION_SOURCES}
      />
    </div>
  );
}
