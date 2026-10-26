"use client";

import Link from "next/link";
import { useCallback, useEffect, useState, type ReactElement } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { CollapsibleSection } from "@/components/CollapsibleSection";
import { FindingDerivationLine } from "@/components/usability/FindingDerivationLine";
import { NewSinceLastVisitMarker } from "@/components/usability/NewSinceLastVisitMarker";
import { StatusTag } from "@/components/ui/status-tag";
import {
  EnterpriseTableCell,
} from "@/components/ui/enterprise-table";
import { DESIGN_TOKENS, OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { findingDerivationFromGovernanceQueueRow } from "@/lib/findings/finding-derivation-sentence";
import { governanceQueueStatusTagKind } from "@/components/governance/findings/governance-findings-buyer-labels";
import {
  governanceFindingInspectHref,
} from "@/components/governance/findings/governance-findings-navigation";
import { governanceQueueDispositionLabel } from "@/lib/architecture/architecture-risk-register-page";
import { cn } from "@/lib/utils";
import {
  governanceFindingDerivationDisclosureHrefFromSearch,
  parseGovernanceFindingDerivationIdFromSearch,
} from "@/lib/governance/governance-finding-derivation-disclosure-url";

import {
  GOVERNANCE_FINDINGS_QUEUE_SEVERITY_STICKY_CLASS,
  GOVERNANCE_FINDINGS_QUEUE_TITLE_STICKY_CLASS,
} from "@/lib/governance/governance-queue-sticky-identity";
import {
  GovernanceFindingsQueueDueCell,
  governanceQueueSeverityCell,
} from "./GovernanceFindingsQueueOperationalRowCells";
import {
  governanceFindingQueueRowHasPolicyRuleId,
  governanceFindingQueueRowHasStoredRunId,
  governanceFindingQueueRowReviewHref,
  type GovernanceFindingQueueRow,
} from "./governance-finding-queue-row";

export type GovernanceFindingsQueueAssignedToMeRowCellsProps = {
  readonly row: GovernanceFindingQueueRow;
  readonly showNewSinceLastVisit: boolean;
  readonly onOpenRow?: () => void;
};

export function GovernanceFindingsQueueAssignedToMeRowCells(props: GovernanceFindingsQueueAssignedToMeRowCellsProps): ReactElement {
  const { row, showNewSinceLastVisit, onOpenRow } = props;
  const findingDerivation = findingDerivationFromGovernanceQueueRow(row);
  const hasStoredRunId = governanceFindingQueueRowHasStoredRunId(row);
  const findingInspectHref = hasStoredRunId
    ? governanceFindingInspectHref(row.runId, row.findingId)
    : null;
  const router = useRouter();
  const pathname = usePathname() ?? "/";
  const searchParams = useSearchParams();
  const governanceFindingDerivationIdParam = searchParams.get("governanceFindingDerivationId");
  const [derivationOpen, setDerivationOpenState] = useState(
    () => parseGovernanceFindingDerivationIdFromSearch(governanceFindingDerivationIdParam) === row.findingId,
  );

  const syncDerivationOpenToUrl = useCallback(
    (open: boolean) => {
      router.replace(
        governanceFindingDerivationDisclosureHrefFromSearch(
          searchParams.toString(),
          open ? row.findingId : null,
          pathname,
        ),
        { scroll: false },
      );
    },
    [pathname, router, row.findingId, searchParams],
  );

  const setDerivationOpen = useCallback(
    (open: boolean) => {
      setDerivationOpenState(open);
      syncDerivationOpenToUrl(open);
    },
    [syncDerivationOpenToUrl],
  );

  useEffect(() => {
    setDerivationOpenState(
      parseGovernanceFindingDerivationIdFromSearch(governanceFindingDerivationIdParam) === row.findingId,
    );
  }, [governanceFindingDerivationIdParam, row.findingId]);

  return (
    <>
      <EnterpriseTableCell className={cn("font-medium text-al-text-primary", GOVERNANCE_FINDINGS_QUEUE_TITLE_STICKY_CLASS)}>
        {showNewSinceLastVisit ? (
          <span className="mr-2 inline-flex align-middle">
            <NewSinceLastVisitMarker testId={`governance-table-row-new-${row.findingId}`} />
          </span>
        ) : null}
        {findingInspectHref !== null ? (
          <Link
            className={OPERATOR_LINK.inline}
            href={findingInspectHref}
            prefetch={false}
            onClick={() => {
              onOpenRow?.();
            }}
          >
            {row.title}
          </Link>
        ) : (
          <span className="text-al-text-primary">{row.title}</span>
        )}
        {governanceFindingQueueRowHasPolicyRuleId(row) ? (
          <div className="mt-1 text-xs text-al-text-secondary" data-testid={`governance-table-control-${row.findingId}`}>
            Framework control: {row.policyRuleId}
          </div>
        ) : null}
        {findingDerivation !== null ? (
          <CollapsibleSection
            title="Derivation"
            open={derivationOpen}
            onToggle={setDerivationOpen}
            sectionTestId={`governance-table-derivation-${row.findingId}`}
          >
            <FindingDerivationLine
              derivation={findingDerivation}
              evidenceHref={findingInspectHref}
              testId={`governance-table-derivation-line-${row.findingId}`}
              compact
            />
          </CollapsibleSection>
        ) : null}
      </EnterpriseTableCell>
      <EnterpriseTableCell>
        {row.runId.trim().length > 0 ? (
          <Link className={OPERATOR_LINK.inline} href={governanceFindingQueueRowReviewHref(row.runId)}>
            {row.runLabel}
          </Link>
        ) : (
          <span className="space-y-0.5">
            <span className="block">{row.runLabel}</span>
            <span className={cn("block", OPERATOR_TYPOGRAPHY.helper)}>Review id was not stored.</span>
          </span>
        )}
      </EnterpriseTableCell>
      <EnterpriseTableCell className={GOVERNANCE_FINDINGS_QUEUE_SEVERITY_STICKY_CLASS}>
        {governanceQueueSeverityCell(row, false)}
      </EnterpriseTableCell>
      <EnterpriseTableCell className={DESIGN_TOKENS.table.cellSecondary}>
        <GovernanceFindingsQueueDueCell row={row} />
      </EnterpriseTableCell>
      <EnterpriseTableCell className={DESIGN_TOKENS.table.cellSecondary}>
        {governanceQueueDispositionLabel(row)}
      </EnterpriseTableCell>
      <EnterpriseTableCell>
        <StatusTag kind={governanceQueueStatusTagKind(row.status)} label={row.status} />
      </EnterpriseTableCell>
    </>
  );
}
