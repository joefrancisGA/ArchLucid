import { EvidenceOrientationClaimAndSourcesStrip } from "@/components/evidence-orientation/EvidenceOrientationClaimAndSourcesStrip";
import {
  AUTH_BOOTSTRAP_CLAIM_DISCIPLINE,
  AUTH_BOOTSTRAP_CLAIM_DISCIPLINE_HEADING,
  AUTH_BOOTSTRAP_FOLLOW_UPS_TITLE,
  AUTH_BOOTSTRAP_SOURCES,
  AUTH_BOOTSTRAP_SOURCES_INTRO,
} from "@/lib/auth-bootstrap-evidence-copy";

/** Claim discipline + Sources index for post-auth workspace bootstrap (AUB). */
export function PostAuthBootstrapClaimOrientationStrip(): React.JSX.Element {
  return (
    <EvidenceOrientationClaimAndSourcesStrip
      slug="post-auth-bootstrap"
      claim={AUTH_BOOTSTRAP_CLAIM_DISCIPLINE}
      claimHeading={AUTH_BOOTSTRAP_CLAIM_DISCIPLINE_HEADING}
      sourcesTitle={AUTH_BOOTSTRAP_FOLLOW_UPS_TITLE}
      sourcesIntro={AUTH_BOOTSTRAP_SOURCES_INTRO}
      sources={AUTH_BOOTSTRAP_SOURCES}
    />
  );
}
