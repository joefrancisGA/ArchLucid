import Link from "next/link";

import {
  BUYER_GOVERNANCE_STATUS_BANNER_BODY,
  BUYER_GOVERNANCE_STATUS_BANNER_TITLE,
  BUYER_GOVERNANCE_STATUS_BANNER_VIEW_APPROVAL,
  BUYER_GOVERNANCE_STATUS_BANNER_VIEW_AUDIT,
  BUYER_GOVERNANCE_STATUS_BANNER_VIEW_DISPOSITIONS,
} from "@/lib/buyer/buyer-polish-copy";
import { DESIGN_TOKENS, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import {
  GOVERNANCE_APPROVAL_QUEUE_PATH,
  GOVERNANCE_AUDIT_PATH,
  GOVERNANCE_FINDINGS_PATH,
} from "@/lib/governance/governance-route-paths";
import { cn } from "@/lib/utils";

const approvalQueueHref = GOVERNANCE_APPROVAL_QUEUE_PATH;
const auditHref = GOVERNANCE_AUDIT_PATH;
const findingsQueueHref = GOVERNANCE_FINDINGS_PATH;

export type GovernanceApprovalStatusBannerProps = {
  readonly className?: string;
  /** When true, omit the dispositions link because the user is already on the tenant findings queue. */
  readonly onRiskRegisterPage?: boolean;
  /** When true, link dispositions to the tenant findings queue (assigned-to-me child route). */
  readonly onAssignedToMeFindingsPage?: boolean;
};

/** Compact governance approval status — shared accent and actions across buyer governance surfaces. */
export function GovernanceApprovalStatusBanner(props: GovernanceApprovalStatusBannerProps) {
  const { className, onRiskRegisterPage = false, onAssignedToMeFindingsPage = false } = props;
  const hideDispositionsLink = onRiskRegisterPage;

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
          <Link className={DESIGN_TOKENS.interactive.chip} href={approvalQueueHref}>
            {BUYER_GOVERNANCE_STATUS_BANNER_VIEW_APPROVAL}
          </Link>
          {hideDispositionsLink ? null : (
            <Link className={DESIGN_TOKENS.interactive.chip} href={findingsQueueHref}>
              {onAssignedToMeFindingsPage ? "Open findings queue" : BUYER_GOVERNANCE_STATUS_BANNER_VIEW_DISPOSITIONS}
            </Link>
          )}
          <Link className={DESIGN_TOKENS.interactive.chip} href={auditHref}>
            {BUYER_GOVERNANCE_STATUS_BANNER_VIEW_AUDIT}
          </Link>
        </div>
      </div>
    </div>
  );
}
