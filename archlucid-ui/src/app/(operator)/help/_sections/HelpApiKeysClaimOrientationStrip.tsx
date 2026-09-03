import {
  EvidenceOrientationClaimAndSourcesStrip,
} from "@/components/evidence-orientation/EvidenceOrientationClaimAndSourcesStrip";
import {
  API_KEYS_HELP_FOLLOW_UPS_TITLE,
  API_KEYS_HELP_SOURCES,
  API_KEYS_HELP_SOURCES_INTRO,
} from "@/lib/api-keys-help-evidence-copy";

/** Sources follow-ups for `/help/api-keys` (HEP). */
export function HelpApiKeysClaimOrientationStrip(): React.JSX.Element {
  return (
    <EvidenceOrientationClaimAndSourcesStrip
      slug="help-api-keys"
      sourcesTestId="help-api-keys-sources"
      sourcesTitle={API_KEYS_HELP_FOLLOW_UPS_TITLE}
      sourcesIntro={API_KEYS_HELP_SOURCES_INTRO}
      sources={API_KEYS_HELP_SOURCES}
    />
  );
}
