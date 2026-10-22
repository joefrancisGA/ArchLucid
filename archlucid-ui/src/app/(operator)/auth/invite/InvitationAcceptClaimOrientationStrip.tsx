import {
  EvidenceOrientationClaimAndSourcesStrip,
} from "@/components/evidence-orientation/EvidenceOrientationClaimAndSourcesStrip";
import {
  AUTH_INVITE_FOLLOW_UPS_TITLE,
  AUTH_INVITE_SOURCES,
  AUTH_INVITE_SOURCES_INTRO,
} from "@/lib/auth-invite-evidence-copy";

/** Claim discipline + Sources index for invitation accept (AUI). */
export function InvitationAcceptClaimOrientationStrip(): React.JSX.Element {
  return (
    <EvidenceOrientationClaimAndSourcesStrip
      slug="auth-invite"
      sourcesTitle={AUTH_INVITE_FOLLOW_UPS_TITLE}
      sourcesIntro={AUTH_INVITE_SOURCES_INTRO}
      sources={AUTH_INVITE_SOURCES}
    />
  );
}
