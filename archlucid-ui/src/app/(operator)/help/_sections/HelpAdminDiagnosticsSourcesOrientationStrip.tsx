import { EvidenceOrientationClaimAndSourcesStrip } from "@/components/evidence-orientation/EvidenceOrientationClaimAndSourcesStrip";
import {
  ADMIN_DIAGNOSTICS_HELP_FOLLOW_UPS_TITLE,
  ADMIN_DIAGNOSTICS_HELP_SOURCES,
  ADMIN_DIAGNOSTICS_HELP_SOURCES_INTRO,
} from "@/lib/admin-diagnostics-help-evidence-copy";

/** Sources-only follow-ups for `/help/admin-diagnostics` buyer-polished shell (HAE). */
export function HelpAdminDiagnosticsSourcesOrientationStrip(): React.JSX.Element {
  return (
    <EvidenceOrientationClaimAndSourcesStrip
      slug="admin-diagnostics-help"
      sourcesTestId="help-admin-diagnostics-sources"
      sourcesTitle={ADMIN_DIAGNOSTICS_HELP_FOLLOW_UPS_TITLE}
      sourcesIntro={ADMIN_DIAGNOSTICS_HELP_SOURCES_INTRO}
      sources={ADMIN_DIAGNOSTICS_HELP_SOURCES}
      sourcesHeadingId="where-to-go-next"
      hubSecondary
    />
  );
}
