import Link from "next/link";

import {
  EVIDENCE_GRAPH_BANNER_BODY,
  EVIDENCE_GRAPH_BANNER_TITLE,
  EVIDENCE_GRAPH_VIEW_AUDIT_TRAIL,
  EVIDENCE_GRAPH_VIEW_GOVERNANCE_APPROVAL,
  EVIDENCE_GRAPH_VIEW_SIGNED_RECORD,
} from "@/lib/evidence-graph-page";
import { getShowcaseManifestHref } from "@/lib/buyer-safe-review-navigation";
import { DESIGN_TOKENS, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { SHOWCASE_STATIC_DEMO_RUN_ID } from "@/lib/showcase-static-demo";
import { cn } from "@/lib/utils";

const showcaseRunEnc = encodeURIComponent(SHOWCASE_STATIC_DEMO_RUN_ID);
const signedRecordHref = getShowcaseManifestHref();
const governanceApprovalHref = `/governance?runId=${showcaseRunEnc}`;
const auditTrailHref = `/audit?runId=${showcaseRunEnc}`;

export type EvidenceGraphLifecycleStatusBannerProps = {
  readonly className?: string;
};

/** Compact lifecycle context for Evidence graph — shared governance accent, calm chip links. */
export function EvidenceGraphLifecycleStatusBanner(props: EvidenceGraphLifecycleStatusBannerProps) {
  const { className } = props;

  return (
    <div
      className={cn(DESIGN_TOKENS.banner.governanceApproval, className)}
      data-testid="evidence-graph-lifecycle-status-banner"
      role="status"
      aria-label={EVIDENCE_GRAPH_BANNER_TITLE}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1">
          <p className={cn("m-0 font-semibold text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}>
            {EVIDENCE_GRAPH_BANNER_TITLE}
          </p>
          <p className={cn("m-0 mt-1 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
            {EVIDENCE_GRAPH_BANNER_BODY}
          </p>
        </div>
        <div className="flex flex-wrap gap-2 sm:max-w-md sm:justify-end">
          <Link className={DESIGN_TOKENS.interactive.chip} href={signedRecordHref}>
            {EVIDENCE_GRAPH_VIEW_SIGNED_RECORD}
          </Link>
          <Link className={DESIGN_TOKENS.interactive.chip} href={governanceApprovalHref}>
            {EVIDENCE_GRAPH_VIEW_GOVERNANCE_APPROVAL}
          </Link>
          <Link className={DESIGN_TOKENS.interactive.chip} href={auditTrailHref}>
            {EVIDENCE_GRAPH_VIEW_AUDIT_TRAIL}
          </Link>
        </div>
      </div>
    </div>
  );
}
