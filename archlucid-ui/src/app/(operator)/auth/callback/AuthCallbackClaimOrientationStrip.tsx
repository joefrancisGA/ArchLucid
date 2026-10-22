import {
  EvidenceOrientationClaimAndSourcesStrip,
} from "@/components/evidence-orientation/EvidenceOrientationClaimAndSourcesStrip";
import {
  AUTH_CALLBACK_FOLLOW_UPS_TITLE,
  AUTH_CALLBACK_SOURCES,
  AUTH_CALLBACK_SOURCES_INTRO,
} from "@/lib/auth-callback-evidence-copy";

/** Claim discipline + Sources index for `/auth/callback` (ACB). */
export function AuthCallbackClaimOrientationStrip(): React.JSX.Element {
  return (
    <EvidenceOrientationClaimAndSourcesStrip
      slug="auth-callback"
      sourcesTitle={AUTH_CALLBACK_FOLLOW_UPS_TITLE}
      sourcesIntro={AUTH_CALLBACK_SOURCES_INTRO}
      sources={AUTH_CALLBACK_SOURCES}
    />
  );
}
