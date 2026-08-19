import { EvidenceOrientationClaimAndSourcesStrip } from "@/components/evidence-orientation/EvidenceOrientationClaimAndSourcesStrip";
import {
  HELP_HUB_CLAIM_DISCIPLINE,
  HELP_HUB_CLAIM_DISCIPLINE_HEADING,
  HELP_HUB_FOLLOW_UPS_TITLE,
  HELP_HUB_SOURCES,
  HELP_HUB_SOURCES_INTRO,
} from "@/lib/help/help-hub-evidence-copy";

/** Claim discipline + Sources index for Help Center hub (HEL). */
export function HelpHubClaimOrientationStrip(): React.JSX.Element {
  return (
    <EvidenceOrientationClaimAndSourcesStrip
      slug="help-hub"
      claim={HELP_HUB_CLAIM_DISCIPLINE}
      claimHeading={HELP_HUB_CLAIM_DISCIPLINE_HEADING}
      sourcesTitle={HELP_HUB_FOLLOW_UPS_TITLE}
      sourcesIntro={HELP_HUB_SOURCES_INTRO}
      sources={HELP_HUB_SOURCES}
    />
  );
}
