import {
  EvidenceOrientationClaimAndSourcesStrip,
} from "@/components/evidence-orientation/EvidenceOrientationClaimAndSourcesStrip";
import {
  ARCHITECTURE_SPONSOR_DASHBOARD_FOLLOW_UPS_TITLE,
  ARCHITECTURE_SPONSOR_DASHBOARD_SOURCES,
  ARCHITECTURE_SPONSOR_DASHBOARD_SOURCES_INTRO,
} from "@/lib/architecture/architecture-sponsor-dashboard-evidence-copy";

/** Sources follow-ups for `/architecture/sponsor-dashboard` (ARE). */
export function ArchitectureSponsorDashboardClaimOrientationStrip(): React.JSX.Element {
  return (
    <EvidenceOrientationClaimAndSourcesStrip
      slug="architecture-sponsor-dashboard"
      sourcesTestId="architecture-sponsor-dashboard-sources"
      sourcesTitle={ARCHITECTURE_SPONSOR_DASHBOARD_FOLLOW_UPS_TITLE}
      sourcesIntro={ARCHITECTURE_SPONSOR_DASHBOARD_SOURCES_INTRO}
      sources={ARCHITECTURE_SPONSOR_DASHBOARD_SOURCES}
    />
  );
}
