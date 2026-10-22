import {
  EvidenceOrientationClaimAndSourcesStrip,
} from "@/components/evidence-orientation/EvidenceOrientationClaimAndSourcesStrip";
import { PolicyPackInfluenceHonestyChip } from "@/components/reviews/PolicyPackInfluenceHonestyChip";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { SENDABLE_EXPORT_COVER_ROI_NON_SUMMING_LINE } from "@/lib/export-markdown-sendable-cover";
import { cn } from "@/lib/utils";
import {
  PILOT_OUTCOMES_CLAIM_DISCIPLINE,
  PILOT_OUTCOMES_FOLLOW_UPS_TITLE,
  PILOT_OUTCOMES_SOURCES,
  PILOT_OUTCOMES_SOURCES_INTRO,
} from "@/lib/pilot-outcomes-evidence-copy";

/** Claim discipline + Sources index for pilot outcomes / sponsor report (IPI). */
export function PilotOutcomesClaimOrientationStrip(): React.JSX.Element {
  return (
    <>
      <p className={cn("m-0 mb-3 text-sm text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)} data-testid="pilot-outcomes-non-summing-line">
        {SENDABLE_EXPORT_COVER_ROI_NON_SUMMING_LINE}
      </p>
      <PolicyPackInfluenceHonestyChip className="mb-3" />
      <EvidenceOrientationClaimAndSourcesStrip
        slug="pilot-outcomes"
        claim={PILOT_OUTCOMES_CLAIM_DISCIPLINE}
        sourcesTitle={PILOT_OUTCOMES_FOLLOW_UPS_TITLE}
        sourcesIntro={PILOT_OUTCOMES_SOURCES_INTRO}
        sources={PILOT_OUTCOMES_SOURCES}
        hubSecondary
      />
    </>
  );
}
