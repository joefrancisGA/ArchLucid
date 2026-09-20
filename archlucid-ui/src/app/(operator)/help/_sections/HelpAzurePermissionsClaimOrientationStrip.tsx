import {
  EvidenceOrientationClaimAndSourcesStrip,
} from "@/components/evidence-orientation/EvidenceOrientationClaimAndSourcesStrip";
import {
  AZURE_PERMISSIONS_HELP_FOLLOW_UPS_TITLE,
  AZURE_PERMISSIONS_HELP_ORIENTATION_SOURCES_INTRO,
  azurePermissionsHelpOrientationSourcesForProductLine,
} from "@/lib/azure-permissions-help-evidence-copy";
import { resolveProductLineIdFromEnv } from "@/lib/product-line/resolve-product-line-id";

/** Sources follow-ups for `/help/azure-permissions` (HE). */
export function HelpAzurePermissionsClaimOrientationStrip(): React.JSX.Element {
  const productLineId = resolveProductLineIdFromEnv();

  return (
    <EvidenceOrientationClaimAndSourcesStrip
      slug="azure-permissions-help"
      sourcesTestId="azure-permissions-help-sources"
      sourcesTitle={AZURE_PERMISSIONS_HELP_FOLLOW_UPS_TITLE}
      sourcesIntro={AZURE_PERMISSIONS_HELP_ORIENTATION_SOURCES_INTRO}
      sources={azurePermissionsHelpOrientationSourcesForProductLine(productLineId)}
      sourcesHeadingId="where-to-go-next"
      hubSecondary
    />
  );
}
