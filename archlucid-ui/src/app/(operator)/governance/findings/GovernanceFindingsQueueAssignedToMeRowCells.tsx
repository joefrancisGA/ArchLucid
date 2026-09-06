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
import { DESIGN_TOKENS, OPERATOR_LINK } from "@/lib/design-tokens";
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
import type { GovernanceFindingQueueRow } from "./governance-finding-queue-row";

export type GovernanceFindingsQueueAssignedToMeRowCellsProps = {
  readonly row: GovernanceFindingQueueRow;
  readonly showNewSinceLastVisit: boolean;
  readonly onOpenRow?: () => void;
};

export function GovernanceFindingsQueueAssignedToMeRowCells(props: GovernanceFindingsQueueAssignedToMeRowCellsProps): ReactElement {
  const { row, showNewSinceLastVisit, onOpenRow } = props;
  const findingDerivation = findingDerivationFromGovernanceQueueRow(row);
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
        <Link
          className={OPERATOR_LINK.inline}
          href={governanceFindingInspectHref(row.runId, row.findingId)}
          prefetch={false}
          onClick={() => {
            onOpenRow?.();
          }}
        >
          {row.title}
        </Link>
        {findingDerivation !== null ? (
          <CollapsibleSection
            title="Derivation"
            open={derivationOpen}
            onToggle={setDerivationOpen}
            sectionTestId={`governance-table-derivation-${row.findingId}`}
          >
            <FindingDerivationLine
              derivation={findingDerivation}
              evidenceHref={governanceFindingInspectHref(row.runId, row.findingId)}
              testId={`governance-table-derivation-line-${row.findingId}`}
              compact
            />
          </CollapsibleSection>
        ) : null}
      </EnterpriseTableCell>
      <EnterpriseTableCell>
        <Link className={OPERATOR_LINK.inline} href={`/architecture/reviews/${encodeURIComponent(row.runId)}`}>
          {row.runLabel}
        </Link>
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
