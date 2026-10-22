import {
  EvidenceOrientationClaimAndSourcesStrip,
} from "@/components/evidence-orientation/EvidenceOrientationClaimAndSourcesStrip";
import { PolicyPackInfluenceHonestyChip } from "@/components/reviews/PolicyPackInfluenceHonestyChip";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { SENDABLE_EXPORT_COVER_ROI_NON_SUMMING_LINE } from "@/lib/export-markdown-sendable-cover";
import {
  PILOT_GUIDE_HELP_FOLLOW_UPS_TITLE,
  PILOT_GUIDE_HELP_SOURCES,
  PILOT_GUIDE_HELP_SOURCES_INTRO,
} from "@/lib/pilot-guide-help-evidence-copy";
import { cn } from "@/lib/utils";

/** Sources follow-ups for `/help/pilot-guide` (HP). */
export function HelpPilotGuideClaimOrientationStrip(): React.JSX.Element {
  return (
    <>
      <p
        className={cn("m-0 mb-3 text-sm text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}
        data-testid="help-pilot-guide-non-summing-line"
      >
        {SENDABLE_EXPORT_COVER_ROI_NON_SUMMING_LINE}
      </p>
      <PolicyPackInfluenceHonestyChip className="mb-3" />
      <EvidenceOrientationClaimAndSourcesStrip
      slug="help-pilot-guide"
      sourcesTestId="help-pilot-guide-sources"
      sourcesTitle={PILOT_GUIDE_HELP_FOLLOW_UPS_TITLE}
      sourcesIntro={PILOT_GUIDE_HELP_SOURCES_INTRO}
      sources={PILOT_GUIDE_HELP_SOURCES}
    />
    </>
  );
}
