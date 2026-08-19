import { EvidenceOrientationClaimAndSourcesStrip } from "@/components/evidence-orientation/EvidenceOrientationClaimAndSourcesStrip";
import {
  SESSION_EXPIRED_CLAIM_DISCIPLINE,
  SESSION_EXPIRED_CLAIM_DISCIPLINE_HEADING,
  SESSION_EXPIRED_FOLLOW_UPS_TITLE,
  SESSION_EXPIRED_SOURCES,
  SESSION_EXPIRED_SOURCES_INTRO,
} from "@/lib/session-expired-evidence-copy";

/** Claim discipline + Sources index for session expired (ASU). */
export function SessionExpiredClaimOrientationStrip(): React.JSX.Element {
  return (
    <EvidenceOrientationClaimAndSourcesStrip
      slug="session-expired"
      claim={SESSION_EXPIRED_CLAIM_DISCIPLINE}
      claimHeading={SESSION_EXPIRED_CLAIM_DISCIPLINE_HEADING}
      sourcesTitle={SESSION_EXPIRED_FOLLOW_UPS_TITLE}
      sourcesIntro={SESSION_EXPIRED_SOURCES_INTRO}
      sources={SESSION_EXPIRED_SOURCES}
    />
  );
}
