import Link from "next/link";

import {
  BUYER_GOVERNANCE_STATUS_BANNER_BODY,
  BUYER_GOVERNANCE_STATUS_BANNER_TITLE,
  BUYER_GOVERNANCE_STATUS_BANNER_VIEW_APPROVAL,
  BUYER_GOVERNANCE_STATUS_BANNER_VIEW_AUDIT,
  BUYER_GOVERNANCE_STATUS_BANNER_VIEW_DISPOSITIONS,
} from "@/lib/buyer/buyer-polish-copy";
import { DESIGN_TOKENS, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { auditTrailNavHref } from "@/lib/audit-nav-paths";
import { SHOWCASE_STATIC_DEMO_RUN_ID } from "@/lib/showcase-static-demo";
import { cn } from "@/lib/utils";

const showcaseRunHref = `/governance/approval-queue?runId=${encodeURIComponent(SHOWCASE_STATIC_DEMO_RUN_ID)}`;
const showcaseAuditHref = auditTrailNavHref(SHOWCASE_STATIC_DEMO_RUN_ID);
const riskRegisterHref = "/governance/findings";

export type GovernanceApprovalStatusBannerProps = {
  readonly className?: string;
  /** When true, omit the dispositions link because the user is already on the risk register. */
  readonly onRiskRegisterPage?: boolean;
};

/** Compact governance approval status — shared accent and actions across buyer governance surfaces. */
export function GovernanceApprovalStatusBanner(props: GovernanceApprovalStatusBannerProps) {
  const { className, onRiskRegisterPage = false } = props;

  return (
    <div
      className={cn(DESIGN_TOKENS.banner.governanceApproval, className)}
      data-testid="governance-approval-status-banner"
      role="status"
      aria-label={BUYER_GOVERNANCE_STATUS_BANNER_TITLE}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1">
          <p className={cn("m-0 font-semibold text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}>
            {BUYER_GOVERNANCE_STATUS_BANNER_TITLE}
          </p>
          <p className={cn("m-0 mt-1 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
            {BUYER_GOVERNANCE_STATUS_BANNER_BODY}
          </p>
        </div>
        <div className="flex flex-wrap gap-2 sm:max-w-md sm:justify-end">
          <Link className={DESIGN_TOKENS.interactive.chip} href={showcaseRunHref}>
            {BUYER_GOVERNANCE_STATUS_BANNER_VIEW_APPROVAL}
          </Link>
          {onRiskRegisterPage ? null : (
            <Link className={DESIGN_TOKENS.interactive.chip} href={riskRegisterHref}>
              {BUYER_GOVERNANCE_STATUS_BANNER_VIEW_DISPOSITIONS}
            </Link>
          )}
          <Link className={DESIGN_TOKENS.interactive.chip} href={showcaseAuditHref}>
            {BUYER_GOVERNANCE_STATUS_BANNER_VIEW_AUDIT}
          </Link>
        </div>
      </div>
    </div>
  );
}
