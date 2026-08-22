import Link from "next/link";

import {
  STANDARDS_RULES_BANNER_BODY,
  STANDARDS_RULES_BANNER_TITLE,
  STANDARDS_RULES_VIEW_AUDIT_TRAIL,
  STANDARDS_RULES_VIEW_EVIDENCE_TRAIL,
  STANDARDS_RULES_VIEW_SIGNED_RECORD,
} from "@/lib/standards-rules-page";
import {
  formatGovernanceApprovalProvenanceTimestamp,
  type GovernanceApprovalProvenance,
} from "@/lib/governance/governance-approval-provenance";
import { formatActionActorName } from "@/lib/action-actor-display";
import type { StandardsRulesGovernanceBannerHrefs } from "@/lib/governance/governance-resolution-page-presentation";
import { STANDARDS_RULES_INLINE_LINK_CLASS } from "@/lib/standards-rules-table-presentation";
import { DESIGN_TOKENS, OPERATOR_DISCLOSURE_TRIGGER_CLASS, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

export type StandardsRulesGovernanceStatusBannerProps = {
  readonly className?: string;
  readonly subjectLabel: string;
  readonly provenance: GovernanceApprovalProvenance;
  readonly hrefs: StandardsRulesGovernanceBannerHrefs;
};

/** Compact governance context for Standards & rules — banner actions share table link typography. */
export function StandardsRulesGovernanceStatusBanner(props: StandardsRulesGovernanceStatusBannerProps) {
  const { className, subjectLabel, provenance, hrefs } = props;
  const approverLabel = formatActionActorName(provenance.approverLabel);
  const approvedAtLabel = formatGovernanceApprovalProvenanceTimestamp(provenance.approvedAtUtc);
  const recordId = provenance.recordId.trim();

  return (
    <section
      className={cn(DESIGN_TOKENS.banner.governanceApproval, className)}
      data-testid="standards-rules-governance-status-banner"
      aria-labelledby="standards-rules-governance-status-banner-title"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1">
          <p
            id="standards-rules-governance-status-banner-title"
            className={cn("m-0 font-semibold text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}
          >
            {STANDARDS_RULES_BANNER_TITLE}
          </p>
          <p className={cn("m-0 mt-1 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
            <span className="font-semibold text-al-text-primary">{subjectLabel}</span>
            {" — "}
            {STANDARDS_RULES_BANNER_BODY}
          </p>
          <p className={cn("m-0 mt-2 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
            <span className="font-semibold text-al-text-primary">Approver:</span> {approverLabel}
            {" · "}
            <span className="font-semibold text-al-text-primary">Approved:</span> {approvedAtLabel}
          </p>
          <details className="mt-2">
            <summary className={cn("cursor-pointer text-al-text-secondary", OPERATOR_DISCLOSURE_TRIGGER_CLASS)}>
              Approval record details
            </summary>
            <p className={cn("m-0 mt-1 text-al-text-secondary", OPERATOR_TYPOGRAPHY.micro)}>
              Record ID: <code>{recordId}</code>
            </p>
          </details>
        </div>
        <div className="flex flex-wrap gap-x-4 gap-y-1 sm:max-w-md sm:justify-end">
          <Link className={STANDARDS_RULES_INLINE_LINK_CLASS} href={hrefs.sealedRecordHref}>
            {STANDARDS_RULES_VIEW_SIGNED_RECORD}
          </Link>
          <Link className={STANDARDS_RULES_INLINE_LINK_CLASS} href={hrefs.evidenceTrailHref}>
            {STANDARDS_RULES_VIEW_EVIDENCE_TRAIL}
          </Link>
          <Link className={STANDARDS_RULES_INLINE_LINK_CLASS} href={hrefs.auditTrailHref}>
            {STANDARDS_RULES_VIEW_AUDIT_TRAIL}
          </Link>
        </div>
      </div>
    </section>
  );
}
