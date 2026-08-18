import { EvidenceOrientationClaimAndSourcesStrip } from "@/components/evidence-orientation/EvidenceOrientationClaimAndSourcesStrip";
import {
  ACCESS_DENIED_CLAIM_DISCIPLINE,
  ACCESS_DENIED_CLAIM_DISCIPLINE_HEADING,
  ACCESS_DENIED_FOLLOW_UPS_TITLE,
  ACCESS_DENIED_SOURCES,
  ACCESS_DENIED_SOURCES_INTRO,
} from "@/lib/access-denied-evidence-copy";

/** Claim discipline + Sources index for access denied (4XX). */
export function AccessDeniedClaimOrientationStrip(): React.JSX.Element {
  return (
    <EvidenceOrientationClaimAndSourcesStrip
      slug="access-denied"
      claim={ACCESS_DENIED_CLAIM_DISCIPLINE}
      claimHeading={ACCESS_DENIED_CLAIM_DISCIPLINE_HEADING}
      sourcesTitle={ACCESS_DENIED_FOLLOW_UPS_TITLE}
      sourcesIntro={ACCESS_DENIED_SOURCES_INTRO}
      sources={ACCESS_DENIED_SOURCES}
    />
  );
}
