"use client";

import {
  EvidenceOrientationClaimAndSourcesStrip,
} from "@/components/evidence-orientation/EvidenceOrientationClaimAndSourcesStrip";
import { useProductLine } from "@/components/product-line/ProductLineProvider";
import {
  AZURE_PERMISSIONS_HELP_FOLLOW_UPS_TITLE,
  AZURE_PERMISSIONS_HELP_ORIENTATION_SOURCES_INTRO,
  azurePermissionsHelpOrientationSourcesForProductLine,
} from "@/lib/azure-permissions-help-evidence-copy";

/** Sources follow-ups for `/help/azure-permissions` (HE). */
export function HelpAzurePermissionsClaimOrientationStrip(): React.JSX.Element {
  const { productLine: productLineId } = useProductLine();

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
