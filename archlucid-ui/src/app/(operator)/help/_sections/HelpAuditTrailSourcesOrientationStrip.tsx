import { EvidenceOrientationClaimAndSourcesStrip } from "@/components/evidence-orientation/EvidenceOrientationClaimAndSourcesStrip";
import {
  AUDIT_TRAIL_HELP_FOLLOW_UPS_TITLE,
  AUDIT_TRAIL_HELP_SOURCES,
  AUDIT_TRAIL_HELP_SOURCES_INTRO,
} from "@/lib/audit-trail-help-evidence-copy";

/** Sources-only follow-ups for `/help/audit-trail` buyer-polished shell (H). */
export function HelpAuditTrailSourcesOrientationStrip(): React.JSX.Element {
  return (
    <EvidenceOrientationClaimAndSourcesStrip
      slug="audit-trail-help"
      sourcesTestId="audit-trail-help-sources"
      sourcesTitle={AUDIT_TRAIL_HELP_FOLLOW_UPS_TITLE}
      sourcesIntro={AUDIT_TRAIL_HELP_SOURCES_INTRO}
      sources={AUDIT_TRAIL_HELP_SOURCES}
      sourcesHeadingId="where-to-go-next"
      hubSecondary
    />
  );
}
