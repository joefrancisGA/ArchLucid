import Link from "next/link";

import {
  POLICY_PACK_BASIS_BANNER_BODY,
  POLICY_PACK_BASIS_BANNER_TITLE,
  POLICY_PACK_BASIS_VIEW_AUDIT_TRAIL,
  POLICY_PACK_BASIS_VIEW_EVIDENCE_TRAIL,
  POLICY_PACK_BASIS_VIEW_SIGNED_RECORD,
} from "@/lib/policy/policy-packs-page";
import { getShowcaseManifestHref } from "@/lib/buyer-safe-review-navigation";
import { DESIGN_TOKENS, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { SHOWCASE_PHI_FINDING_GRAPH_NODE_ID } from "@/lib/findings/finding-inspect-graph-evidence";
import { auditTrailNavHref } from "@/lib/audit-nav-paths";
import { SHOWCASE_STATIC_DEMO_RUN_ID } from "@/lib/showcase-static-demo";
import { cn } from "@/lib/utils";

const showcaseRunEnc = encodeURIComponent(SHOWCASE_STATIC_DEMO_RUN_ID);
const signedRecordHref = getShowcaseManifestHref();
const evidenceTrailHref = `/insights/evidence-graph?runId=${showcaseRunEnc}&graphNodeId=${encodeURIComponent(SHOWCASE_PHI_FINDING_GRAPH_NODE_ID)}`;
const auditTrailHref = auditTrailNavHref(SHOWCASE_STATIC_DEMO_RUN_ID);

export type PolicyPackBasisStatusBannerProps = {
  readonly className?: string;
};

/** Compact policy-pack context banner — shared governance accent, calm secondary links. */
export function PolicyPackBasisStatusBanner(props: PolicyPackBasisStatusBannerProps) {
  const { className } = props;

  return (
    <div
      className={cn(DESIGN_TOKENS.banner.governanceApproval, className)}
      data-testid="policy-pack-basis-status-banner"
      role="status"
      aria-label={POLICY_PACK_BASIS_BANNER_TITLE}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1">
          <p className={cn("m-0 font-semibold text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}>
            {POLICY_PACK_BASIS_BANNER_TITLE}
          </p>
          <p className={cn("m-0 mt-1 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
            {POLICY_PACK_BASIS_BANNER_BODY}
          </p>
        </div>
        <div className="flex flex-wrap gap-2 sm:max-w-md sm:justify-end">
          <Link className={DESIGN_TOKENS.interactive.chip} href={signedRecordHref}>
            {POLICY_PACK_BASIS_VIEW_SIGNED_RECORD}
          </Link>
          <Link className={DESIGN_TOKENS.interactive.chip} href={evidenceTrailHref}>
            {POLICY_PACK_BASIS_VIEW_EVIDENCE_TRAIL}
          </Link>
          <Link className={DESIGN_TOKENS.interactive.chip} href={auditTrailHref}>
            {POLICY_PACK_BASIS_VIEW_AUDIT_TRAIL}
          </Link>
        </div>
      </div>
    </div>
  );
}
