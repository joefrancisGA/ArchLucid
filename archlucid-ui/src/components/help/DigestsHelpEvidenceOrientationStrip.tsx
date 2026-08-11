import { EvidenceOrientationClaimAndSourcesStrip } from "@/components/evidence-orientation/EvidenceOrientationClaimAndSourcesStrip";
import {
  DIGESTS_HELP_CLAIM_DISCIPLINE,
  DIGESTS_HELP_FOLLOW_UPS_TITLE,
  DIGESTS_HELP_SOURCES,
  DIGESTS_HELP_SOURCES_INTRO,
} from "@/lib/digests-help-evidence-copy";

/** Claim discipline + cross-topic follow-ups for `/help/digests`. */
export function DigestsHelpEvidenceOrientationStrip(): React.JSX.Element {
  return (
    <EvidenceOrientationClaimAndSourcesStrip
      slug="help-digests"
      claim={DIGESTS_HELP_CLAIM_DISCIPLINE}
      claimTone="neutral"
      claimElement="div"
      sourcesTitle={DIGESTS_HELP_FOLLOW_UPS_TITLE}
      sourcesIntro={DIGESTS_HELP_SOURCES_INTRO}
      sources={DIGESTS_HELP_SOURCES}
      sourcesSurface="raised"
      sourcesHeadingId="where-to-go-next"
    />
  );
}
