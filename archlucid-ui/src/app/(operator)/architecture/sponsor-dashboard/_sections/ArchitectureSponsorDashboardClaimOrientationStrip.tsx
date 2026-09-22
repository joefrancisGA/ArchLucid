import {
  EvidenceOrientationClaimAndSourcesStrip,
} from "@/components/evidence-orientation/EvidenceOrientationClaimAndSourcesStrip";
import { PolicyPackInfluenceHonestyChip } from "@/components/reviews/PolicyPackInfluenceHonestyChip";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { SENDABLE_EXPORT_COVER_ROI_NON_SUMMING_LINE } from "@/lib/export-markdown-sendable-cover";
import { cn } from "@/lib/utils";
import {
  ARCHITECTURE_SPONSOR_DASHBOARD_FOLLOW_UPS_TITLE,
  ARCHITECTURE_SPONSOR_DASHBOARD_SOURCES,
  ARCHITECTURE_SPONSOR_DASHBOARD_SOURCES_INTRO,
} from "@/lib/architecture/architecture-sponsor-dashboard-evidence-copy";

/** Sources follow-ups for `/architecture/sponsor-dashboard` (ARE). */
export function ArchitectureSponsorDashboardClaimOrientationStrip(): React.JSX.Element {
  return (
    <>
      <p
        className={cn("m-0 mb-3 text-sm text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}
        data-testid="architecture-sponsor-dashboard-non-summing-line"
      >
        {SENDABLE_EXPORT_COVER_ROI_NON_SUMMING_LINE}
      </p>
      <PolicyPackInfluenceHonestyChip className="mb-3" />
      <EvidenceOrientationClaimAndSourcesStrip
        slug="architecture-sponsor-dashboard"
        sourcesTestId="architecture-sponsor-dashboard-sources"
        sourcesTitle={ARCHITECTURE_SPONSOR_DASHBOARD_FOLLOW_UPS_TITLE}
        sourcesIntro={ARCHITECTURE_SPONSOR_DASHBOARD_SOURCES_INTRO}
        sources={ARCHITECTURE_SPONSOR_DASHBOARD_SOURCES}
      />
    </>
  );
}
