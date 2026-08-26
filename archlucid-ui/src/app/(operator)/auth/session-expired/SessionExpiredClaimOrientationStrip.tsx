import {
  EvidenceOrientationClaimAndSourcesStrip,
} from "@/components/evidence-orientation/EvidenceOrientationClaimAndSourcesStrip";
import {
  EVIDENCE_SOURCES_STYLE,
} from "@/components/evidence-orientation/evidence-orientation-styles";
import {
  SESSION_EXPIRED_FOLLOW_UPS_TITLE,
  SESSION_EXPIRED_SOURCES,
  SESSION_EXPIRED_SOURCES_INTRO,
} from "@/lib/session-expired-evidence-copy";

/** Sources index for session expired (ASU) — claim discipline omitted via policy. */
export function SessionExpiredClaimOrientationStrip(): React.JSX.Element {
  return (
    <EvidenceOrientationClaimAndSourcesStrip
      slug="session-expired"
      sourcesTitle={SESSION_EXPIRED_FOLLOW_UPS_TITLE}
      sourcesIntro={SESSION_EXPIRED_SOURCES_INTRO}
      sources={SESSION_EXPIRED_SOURCES}
      sourcesLayout="stacked"
      sourcesStyle={EVIDENCE_SOURCES_STYLE.operatorNeutral}
    />
  );
}
