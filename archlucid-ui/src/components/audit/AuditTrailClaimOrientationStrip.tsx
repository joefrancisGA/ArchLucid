import {
  EvidenceOrientationClaimAndSourcesStrip,
} from "@/components/evidence-orientation/EvidenceOrientationClaimAndSourcesStrip";
import {
  AUDIT_TRAIL_FOLLOW_UPS_TITLE,
  AUDIT_TRAIL_SOURCES,
  AUDIT_TRAIL_SOURCES_INTRO,
} from "@/lib/audit-trail-evidence-copy";

/** Claim discipline + Sources index for `/governance/audit` (AUD). */
export function AuditTrailClaimOrientationStrip(): React.JSX.Element {
  return (
    <EvidenceOrientationClaimAndSourcesStrip
      slug="audit-trail"
      sourcesTitle={AUDIT_TRAIL_FOLLOW_UPS_TITLE}
      sourcesIntro={AUDIT_TRAIL_SOURCES_INTRO}
      sources={AUDIT_TRAIL_SOURCES}
    />
  );
}
