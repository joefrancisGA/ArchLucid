import {
  EvidenceOrientationClaimAndSourcesStrip,
} from "@/components/evidence-orientation/EvidenceOrientationClaimAndSourcesStrip";
import { resolveProductLineIdFromEnv } from "@/lib/product-line/resolve-product-line-id";
import {
  TROUBLESHOOTING_HELP_FOLLOW_UPS_TITLE,
  resolveTroubleshootingHelpSources,
  resolveTroubleshootingHelpSourcesIntro,
} from "@/lib/troubleshooting-help-evidence-copy";

/** Sources follow-ups for `/help/troubleshooting` (HTX). */
export function HelpTroubleshootingClaimOrientationStrip(): React.JSX.Element {
  const productLineId = resolveProductLineIdFromEnv();

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
