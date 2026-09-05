"use client";

import Link from "next/link";

import { useArchitectureIdentitiesListQuery } from "@/hooks/use-architecture-identities-list-query";
import { EnterpriseCompactEmptyState } from "@/components/EnterpriseCompactEmptyState";
import {
  EnterpriseTable,
  EnterpriseTableBody,
  EnterpriseTableCell,
  EnterpriseTableHead,
  EnterpriseTableHeadRow,
  EnterpriseTableHeaderCell,
  EnterpriseTableRow,
} from "@/components/ui/enterprise-table";
import { architectureIdentityPath } from "@/lib/architecture/architecture-routes";
import {
  ARCHITECTURE_IDENTITY_LIST_EMPTY_BODY,
  ARCHITECTURE_IDENTITY_LIST_EMPTY_TITLE,
  ARCHITECTURE_IDENTITY_LIST_LOADING_LABEL,
  ARCHITECTURE_IDENTITY_TABLE_DRAFTS_COLUMN,
  ARCHITECTURE_IDENTITY_TABLE_NAME_COLUMN,
  ARCHITECTURE_IDENTITY_TABLE_REVIEWS_COLUMN,
  ARCHITECTURE_IDENTITY_TABLE_UPDATED_COLUMN,
} from "@/lib/architecture/architecture-identity-desk-copy";
import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { formatInventoryUpdatedAtCell } from "@/lib/relative-time";

/** Working-mode architecture portfolio — server identity list (ADR 0074 / DA-04). */
export function ArchitectureIdentityListClient(): React.JSX.Element {
  const query = useArchitectureIdentitiesListQuery();
  const items = query.data?.items ?? [];

  if (query.isLoading) {
    return (
      <p className={OPERATOR_TYPOGRAPHY.body} data-testid="architecture-identity-list-loading">
        {ARCHITECTURE_IDENTITY_LIST_LOADING_LABEL}
      </p>
    );
  }

  if (query.isError) {
    return (
      <div className="space-y-2" data-testid="architecture-identity-list-error">
        <p className={OPERATOR_TYPOGRAPHY.body}>Could not load architectures.</p>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <EnterpriseCompactEmptyState
        title={ARCHITECTURE_IDENTITY_LIST_EMPTY_TITLE}
        description={ARCHITECTURE_IDENTITY_LIST_EMPTY_BODY}
        testId="architecture-identity-list-empty"
      />
    );
  }

  return (
    <EnterpriseTable data-testid="architecture-identity-list-table">
      <EnterpriseTableHead>
        <EnterpriseTableHeadRow>
          <EnterpriseTableHeaderCell>{ARCHITECTURE_IDENTITY_TABLE_NAME_COLUMN}</EnterpriseTableHeaderCell>
          <EnterpriseTableHeaderCell>{ARCHITECTURE_IDENTITY_TABLE_UPDATED_COLUMN}</EnterpriseTableHeaderCell>
          <EnterpriseTableHeaderCell>{ARCHITECTURE_IDENTITY_TABLE_REVIEWS_COLUMN}</EnterpriseTableHeaderCell>
          <EnterpriseTableHeaderCell>{ARCHITECTURE_IDENTITY_TABLE_DRAFTS_COLUMN}</EnterpriseTableHeaderCell>
        </EnterpriseTableHeadRow>
      </EnterpriseTableHead>
      <EnterpriseTableBody>
        {items.map((item) => (
          <EnterpriseTableRow
            key={item.architectureId}
            data-testid={`architecture-identity-row-${item.architectureId}`}
          >
            <EnterpriseTableCell>
              <Link href={architectureIdentityPath(item.architectureId)} className={OPERATOR_LINK.nav}>
                {item.displayName}
              </Link>
            </EnterpriseTableCell>
            <EnterpriseTableCell>{formatInventoryUpdatedAtCell(item.updatedUtc).display}</EnterpriseTableCell>
            <EnterpriseTableCell>{item.reviewCount}</EnterpriseTableCell>
            <EnterpriseTableCell>{item.draftCount}</EnterpriseTableCell>
          </EnterpriseTableRow>
        ))}
      </EnterpriseTableBody>
    </EnterpriseTable>
  );
}
