import {
  EvidenceOrientationClaimAndSourcesStrip,
} from "@/components/evidence-orientation/EvidenceOrientationClaimAndSourcesStrip";
import {
  TENANT_SETTINGS_FOLLOW_UPS_TITLE,
  TENANT_SETTINGS_SOURCES,
  TENANT_SETTINGS_SOURCES_INTRO,
} from "@/lib/tenant-settings-evidence-copy";

/** Sources follow-ups for `/administration/workspace-settings` (ATE). */
export function TenantSettingsSettingsClaimOrientationStrip(): React.JSX.Element {
  return (
    <EvidenceOrientationClaimAndSourcesStrip
      slug="tenant-settings-settings"
      sourcesTestId="tenant-settings-settings-sources"
      sourcesTitle={TENANT_SETTINGS_FOLLOW_UPS_TITLE}
      sourcesIntro={TENANT_SETTINGS_SOURCES_INTRO}
      sources={TENANT_SETTINGS_SOURCES}
      hubSecondary
    />
  );
}
