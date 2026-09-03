import {
  EvidenceOrientationClaimAndSourcesStrip,
} from "@/components/evidence-orientation/EvidenceOrientationClaimAndSourcesStrip";
import {
  API_CONTRACTS_HELP_FOLLOW_UPS_TITLE,
  API_CONTRACTS_HELP_SOURCES,
  API_CONTRACTS_HELP_SOURCES_INTRO,
} from "@/lib/api-contracts-help-evidence-copy";

/** Sources follow-ups for `/help/api-contracts` (HG). */
export function HelpApiContractsClaimOrientationStrip(): React.JSX.Element {
  return (
    <EvidenceOrientationClaimAndSourcesStrip
      slug="help-api-contracts"
      sourcesTestId="help-api-contracts-sources"
      sourcesTitle={API_CONTRACTS_HELP_FOLLOW_UPS_TITLE}
      sourcesIntro={API_CONTRACTS_HELP_SOURCES_INTRO}
      sources={API_CONTRACTS_HELP_SOURCES}
    />
  );
}
