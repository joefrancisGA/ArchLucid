import {
  EvidenceOrientationClaimAndSourcesStrip,
} from "@/components/evidence-orientation/EvidenceOrientationClaimAndSourcesStrip";
import {
  POLICY_PACKS_HELP_FOLLOW_UPS_TITLE,
  POLICY_PACKS_HELP_SOURCES,
  POLICY_PACKS_HELP_SOURCES_INTRO,
} from "@/lib/policy/policy-packs-help-evidence-copy";

/** Sources follow-ups for `/help/policy-packs` (HEO). */
export function HelpPolicyPacksClaimOrientationStrip(): React.JSX.Element {
  return (
    <EvidenceOrientationClaimAndSourcesStrip
      slug="help-policy-packs"
      sourcesTestId="help-policy-packs-sources"
      sourcesTitle={POLICY_PACKS_HELP_FOLLOW_UPS_TITLE}
      sourcesIntro={POLICY_PACKS_HELP_SOURCES_INTRO}
      sources={POLICY_PACKS_HELP_SOURCES}
    />
  );
}
