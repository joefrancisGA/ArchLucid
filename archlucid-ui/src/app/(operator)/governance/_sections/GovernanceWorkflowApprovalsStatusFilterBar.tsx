"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { buyerFilterChipClass } from "@/lib/buyer/buyer-shell-home-present";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { governanceApprovalQueueFilterHrefFromSearch } from "@/lib/governance/governance-approval-queue-filter-url";
import {
  GOVERNANCE_APPROVAL_STATUS_FILTER_PARAM,
  governanceApprovalStatusFilterLabel,
  parseGovernanceApprovalStatusFilter,
  type GovernanceApprovalStatusFilter,
} from "@/lib/governance/governance-approval-status-filter";
import { cn } from "@/lib/utils";

const GOVERNANCE_APPROVAL_STATUS_FILTER_OPTIONS: readonly GovernanceApprovalStatusFilter[] = [
  "pending",
  "approved",
  "rejected",
];

export function GovernanceWorkflowApprovalsStatusFilterBar(): React.JSX.Element | null {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const activeFilter = parseGovernanceApprovalStatusFilter(searchParams.get(GOVERNANCE_APPROVAL_STATUS_FILTER_PARAM));

  if (pathname !== "/governance/approval-queue") {
    return null;
  }

  return (
    <div className="flex flex-wrap items-center gap-2" data-testid="governance-approval-status-filter-bar">
      <span className={cn("text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>Status filter</span>
      <Link
        className={buyerFilterChipClass(activeFilter === null, false)}
        href={governanceApprovalQueueFilterHrefFromSearch(searchParams, { approvalStatus: null })}
        aria-current={activeFilter === null ? "page" : undefined}
        data-testid="governance-approval-status-filter-all"
      >
        All
      </Link>
      {GOVERNANCE_APPROVAL_STATUS_FILTER_OPTIONS.map((filter) => (
        <Link
          key={filter}
          className={buyerFilterChipClass(activeFilter === filter, false)}
          href={governanceApprovalQueueFilterHrefFromSearch(searchParams, { approvalStatus: filter })}
          aria-current={activeFilter === filter ? "page" : undefined}
          data-testid={`governance-approval-status-filter-${filter}`}
          onClick={(event) => {
            if (activeFilter === filter) {
              event.preventDefault();
              router.replace(governanceApprovalQueueFilterHrefFromSearch(searchParams, { approvalStatus: null }), {
                scroll: false,
              });
            }
          }}
        >
          {governanceApprovalStatusFilterLabel(filter)}
        </Link>
      ))}
    </div>
  );
}