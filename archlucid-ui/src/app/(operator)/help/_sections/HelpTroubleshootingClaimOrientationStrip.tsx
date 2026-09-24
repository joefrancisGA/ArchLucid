"use client";

import {
  EvidenceOrientationClaimAndSourcesStrip,
} from "@/components/evidence-orientation/EvidenceOrientationClaimAndSourcesStrip";
import { useProductLine } from "@/components/product-line/ProductLineProvider";
import {
  TROUBLESHOOTING_HELP_FOLLOW_UPS_TITLE,
  resolveTroubleshootingHelpSources,
  resolveTroubleshootingHelpSourcesIntro,
} from "@/lib/troubleshooting-help-evidence-copy";

/** Sources follow-ups for `/help/troubleshooting` (HTX). */
export function HelpTroubleshootingClaimOrientationStrip(): React.JSX.Element {
  const { productLine: productLineId } = useProductLine();

  return (
    <EvidenceOrientationClaimAndSourcesStrip
      slug="help-troubleshooting"
      sourcesTestId="help-troubleshooting-sources"
      sourcesTitle={TROUBLESHOOTING_HELP_FOLLOW_UPS_TITLE}
      sourcesIntro={resolveTroubleshootingHelpSourcesIntro(productLineId)}
      sources={resolveTroubleshootingHelpSources(productLineId)}
    />
  );
}
