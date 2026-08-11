import { EvidenceOrientationClaimAndSourcesStrip } from "@/components/evidence-orientation/EvidenceOrientationClaimAndSourcesStrip";
import {
  REPEAT_REVIEW_LOOP_HELP_CLAIM_DISCIPLINE,
  REPEAT_REVIEW_LOOP_HELP_SOURCES,
  REPEAT_REVIEW_LOOP_HELP_SOURCES_INTRO,
} from "@/lib/repeat-review-loop-help-evidence-copy";

/** Claim discipline + diligence artifact index for `/help/repeat-review-loop`. */
export function RepeatReviewLoopHelpEvidenceOrientationStrip(): React.JSX.Element {
  return (
    <EvidenceOrientationClaimAndSourcesStrip
      slug="repeat-review-loop-help"
      claim={REPEAT_REVIEW_LOOP_HELP_CLAIM_DISCIPLINE}
      claimTone="info"
      sourcesIntro={REPEAT_REVIEW_LOOP_HELP_SOURCES_INTRO}
      sources={REPEAT_REVIEW_LOOP_HELP_SOURCES}
    />
  );
}
