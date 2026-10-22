import {
  EvidenceOrientationClaimAndSourcesStrip,
} from "@/components/evidence-orientation/EvidenceOrientationClaimAndSourcesStrip";
import {
  EVIDENCE_TRAIL_HELP_FOLLOW_UPS_TITLE,
  EVIDENCE_TRAIL_HELP_SOURCES,
  EVIDENCE_TRAIL_HELP_SOURCES_INTRO,
} from "@/lib/evidence-trail-help-evidence-copy";

/** Sources follow-ups for `/help/evidence-trail` (EV). */
export function HelpEvidenceTrailClaimOrientationStrip(): React.JSX.Element {
  return (
    <EvidenceOrientationClaimAndSourcesStrip
      slug="help-evidence-trail"
      sourcesTestId="help-evidence-trail-sources"
      sourcesTitle={EVIDENCE_TRAIL_HELP_FOLLOW_UPS_TITLE}
      sourcesIntro={EVIDENCE_TRAIL_HELP_SOURCES_INTRO}
      sources={EVIDENCE_TRAIL_HELP_SOURCES}
    />
  );
}
