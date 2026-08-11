import { EvidenceOrientationClaimAndSourcesStrip } from "@/components/evidence-orientation/EvidenceOrientationClaimAndSourcesStrip";
import {
  AUDIT_TRAIL_HELP_CLAIM_DISCIPLINE,
  AUDIT_TRAIL_HELP_SOURCES,
  AUDIT_TRAIL_HELP_SOURCES_INTRO,
} from "@/lib/audit-trail-help-evidence-copy";

/** Claim discipline + diligence artifact index for `/help/audit-trail`. */
export function AuditTrailHelpEvidenceOrientationStrip(): React.JSX.Element {
  return (
    <EvidenceOrientationClaimAndSourcesStrip
      slug="audit-trail-help"
      claimTestId="help-audit-trail-claim-discipline"
      claim={AUDIT_TRAIL_HELP_CLAIM_DISCIPLINE}
      sourcesIntro={AUDIT_TRAIL_HELP_SOURCES_INTRO}
      sources={AUDIT_TRAIL_HELP_SOURCES}
    />
  );
}
