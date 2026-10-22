import { EvidenceOrientationClaimAndSourcesStrip } from "@/components/evidence-orientation/EvidenceOrientationClaimAndSourcesStrip";
import { HELP_PAGE_LAYOUT } from "@/lib/help/help-page-layout";
import {
  TENANT_SETTINGS_FOLLOW_UPS_TITLE,
  TENANT_SETTINGS_ORIENTATION_SOURCES_INTRO,
  TENANT_SETTINGS_SOURCES,
} from "@/lib/tenant-settings-evidence-copy";
import { TENANT_SETTINGS_SETTINGS_ORIENTATION_BOTTOM_TEST_ID } from "@/lib/tenant-settings-settings-page-copy";

/** Sources-only follow-ups for `/administration/workspace-settings` buyer-polished shell (ATE). */
export function TenantSettingsSourcesOrientationStrip(): React.JSX.Element {
  return (
    <EvidenceOrientationClaimAndSourcesStrip
      slug="tenant-settings-settings"
      stripTestId={TENANT_SETTINGS_SETTINGS_ORIENTATION_BOTTOM_TEST_ID}
      sourcesTestId="tenant-settings-settings-sources"
      sourcesTitle={TENANT_SETTINGS_FOLLOW_UPS_TITLE}
      sourcesIntro={TENANT_SETTINGS_ORIENTATION_SOURCES_INTRO}
      sources={TENANT_SETTINGS_SOURCES}
      sourcesHeadingId="tenant-settings-settings-sources-heading"
      readingBodyClassName={HELP_PAGE_LAYOUT.readingBody}
      hubSecondary
    />
  );
}
