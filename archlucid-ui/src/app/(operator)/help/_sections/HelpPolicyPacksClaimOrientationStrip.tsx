import {
  EvidenceOrientationClaimAndSourcesStrip,
} from "@/components/evidence-orientation/EvidenceOrientationClaimAndSourcesStrip";
import {
  POLICY_PACKS_HELP_FOLLOW_UPS_TITLE,
  resolvePolicyPacksHelpSources,
  resolvePolicyPacksHelpSourcesIntro,
} from "@/lib/policy/policy-packs-help-evidence-copy";
import { resolveProductLineIdFromEnv } from "@/lib/product-line/resolve-product-line-id";

/** Sources follow-ups for `/help/policy-packs` (HEO). */
export function HelpPolicyPacksClaimOrientationStrip(): React.JSX.Element {
  const productLineId = resolveProductLineIdFromEnv();

  return (
    <EvidenceOrientationClaimAndSourcesStrip
      slug="help-policy-packs"
      sourcesTestId="help-policy-packs-sources"
      sourcesTitle={POLICY_PACKS_HELP_FOLLOW_UPS_TITLE}
      sourcesIntro={resolvePolicyPacksHelpSourcesIntro(productLineId)}
      sources={resolvePolicyPacksHelpSources(productLineId)}
    />
  );
}
