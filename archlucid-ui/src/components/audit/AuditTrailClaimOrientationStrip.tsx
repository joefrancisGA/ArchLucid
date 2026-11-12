"use client";

import { useProductLine } from "@/components/product-line/ProductLineProvider";
import {
  EvidenceOrientationClaimAndSourcesStrip,
} from "@/components/evidence-orientation/EvidenceOrientationClaimAndSourcesStrip";
import {
  AUDIT_TRAIL_FOLLOW_UPS_TITLE,
  AUDIT_TRAIL_SOURCES_INTRO,
  resolveAuditTrailOrientationSources,
} from "@/lib/audit-trail-evidence-copy";

/** Claim discipline + Sources index for `/governance/audit` (AUD). */
export function AuditTrailClaimOrientationStrip(): React.JSX.Element {
  const { productLine } = useProductLine();

  return (
    <EvidenceOrientationClaimAndSourcesStrip
      slug="audit-trail"
      sourcesTitle={AUDIT_TRAIL_FOLLOW_UPS_TITLE}
      sourcesIntro={AUDIT_TRAIL_SOURCES_INTRO}
      sources={resolveAuditTrailOrientationSources(productLine)}
      hubSecondary
    />
  );
}
