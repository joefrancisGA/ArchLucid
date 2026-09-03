import {
  EvidenceOrientationClaimAndSourcesStrip,
} from "@/components/evidence-orientation/EvidenceOrientationClaimAndSourcesStrip";
import {
  AZURE_PERMISSIONS_HELP_FOLLOW_UPS_TITLE,
  AZURE_PERMISSIONS_HELP_SOURCES,
  AZURE_PERMISSIONS_HELP_SOURCES_INTRO,
} from "@/lib/azure-permissions-help-evidence-copy";

/** Sources follow-ups for `/help/azure-permissions` (HE). */
export function HelpAzurePermissionsClaimOrientationStrip(): React.JSX.Element {
  return (
    <EvidenceOrientationClaimAndSourcesStrip
      slug="azure-permissions-help"
      sourcesTestId="azure-permissions-help-sources"
      sourcesTitle={AZURE_PERMISSIONS_HELP_FOLLOW_UPS_TITLE}
      sourcesIntro={AZURE_PERMISSIONS_HELP_SOURCES_INTRO}
      sources={AZURE_PERMISSIONS_HELP_SOURCES}
    />
  );
}
