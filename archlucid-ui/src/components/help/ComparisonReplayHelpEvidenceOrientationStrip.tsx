import { EvidenceOrientationClaimAndSourcesStrip } from "@/components/evidence-orientation/EvidenceOrientationClaimAndSourcesStrip";
import {
  COMPARISON_REPLAY_HELP_CLAIM_DISCIPLINE,
  COMPARISON_REPLAY_HELP_SOURCES,
  COMPARISON_REPLAY_HELP_SOURCES_INTRO,
} from "@/lib/comparison-replay-help-evidence-copy";

/** Claim discipline + diligence artifact index for `/help/comparison-replay`. */
export function ComparisonReplayHelpEvidenceOrientationStrip(): React.JSX.Element {
  return (
    <EvidenceOrientationClaimAndSourcesStrip
      slug="comparison-replay-help"
      claim={COMPARISON_REPLAY_HELP_CLAIM_DISCIPLINE}
      sourcesIntro={COMPARISON_REPLAY_HELP_SOURCES_INTRO}
      sources={COMPARISON_REPLAY_HELP_SOURCES}
    />
  );
}
