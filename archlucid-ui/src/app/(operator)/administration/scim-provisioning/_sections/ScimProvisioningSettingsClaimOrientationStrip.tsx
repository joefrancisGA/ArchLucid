import {
  EvidenceOrientationClaimAndSourcesStrip,
} from "@/components/evidence-orientation/EvidenceOrientationClaimAndSourcesStrip";
import {
  SCIM_PROVISIONING_FOLLOW_UPS_TITLE,
  SCIM_PROVISIONING_SOURCES,
  SCIM_PROVISIONING_SOURCES_INTRO,
} from "@/lib/scim-provisioning-evidence-copy";

/** Sources follow-ups for `/administration/scim-provisioning` (ASC). */
export function ScimProvisioningSettingsClaimOrientationStrip(): React.JSX.Element {
  return (
    <EvidenceOrientationClaimAndSourcesStrip
      slug="scim-provisioning-settings"
      sourcesTestId="scim-provisioning-settings-sources"
      sourcesTitle={SCIM_PROVISIONING_FOLLOW_UPS_TITLE}
      sourcesIntro={SCIM_PROVISIONING_SOURCES_INTRO}
      sources={SCIM_PROVISIONING_SOURCES}
      hubSecondary
    />
  );
}
