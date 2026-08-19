import { EvidenceOrientationClaimAndSourcesStrip } from "@/components/evidence-orientation/EvidenceOrientationClaimAndSourcesStrip";
import {
  INVITE_REVIEWER_CLAIM_DISCIPLINE,
  INVITE_REVIEWER_SOURCES,
  INVITE_REVIEWER_SOURCES_INTRO,
} from "@/lib/invite-reviewer-evidence-copy";

import { INVITE_REVIEWER_CLAIM_HEADING } from "./invite-reviewer-page-copy";

/** Claim discipline + Sources index for the invite-reviewer surface (SRI). */
export function InviteReviewerClaimOrientationStrip(): React.JSX.Element {
  return (
    <EvidenceOrientationClaimAndSourcesStrip
      slug="invite-reviewer"
      claim={INVITE_REVIEWER_CLAIM_DISCIPLINE}
      claimHeading={INVITE_REVIEWER_CLAIM_HEADING}
      sourcesIntro={INVITE_REVIEWER_SOURCES_INTRO}
      sources={INVITE_REVIEWER_SOURCES}
    />
  );
}
