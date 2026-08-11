import { EvidenceOrientationClaimAndSourcesStrip } from "@/components/evidence-orientation/EvidenceOrientationClaimAndSourcesStrip";
import {
  SUBPROCESSORS_HELP_CLAIM_DISCIPLINE,
  SUBPROCESSORS_HELP_SOURCES,
  SUBPROCESSORS_HELP_SOURCES_INTRO,
} from "@/lib/subprocessors-help-evidence-copy";

/** Claim discipline + diligence artifact index for `/help/subprocessors`. */
export function SubprocessorsHelpEvidenceOrientationStrip(): React.JSX.Element {
  return (
    <EvidenceOrientationClaimAndSourcesStrip
      slug="subprocessors-help"
      claim={SUBPROCESSORS_HELP_CLAIM_DISCIPLINE}
      sourcesIntro={SUBPROCESSORS_HELP_SOURCES_INTRO}
      sources={SUBPROCESSORS_HELP_SOURCES}
    />
  );
}
