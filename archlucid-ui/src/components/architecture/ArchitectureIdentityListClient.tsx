"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { EnterpriseCompactEmptyState } from "@/components/EnterpriseCompactEmptyState";
import { InventoryHiddenFilterHonestyBand } from "@/components/usability/InventoryHiddenFilterHonestyBand";
import { InventoryShowingCountBand } from "@/components/usability/InventoryShowingCountBand";
import { FilterChip } from "@/components/ui/filter-chip";
import { FilterChipGroup } from "@/components/ui/filter-chip-group";
import { useArchitectureIdentitiesListQuery } from "@/hooks/use-architecture-identities-list-query";
import {
  EnterpriseTable,
  EnterpriseTableBody,
  EnterpriseTableCell,
  EnterpriseTableHead,
  EnterpriseTableHeadRow,
  EnterpriseTableHeaderCell,
  EnterpriseTableRow,
} from "@/components/ui/enterprise-table";
import { architectureIdentityPath, ARCHITECTURES_NEW_PATH } from "@/lib/architecture/architecture-routes";
import {
  ARCHITECTURE_IDENTITY_LIST_EMPTY_BODY,
  ARCHITECTURE_IDENTITY_LIST_EMPTY_PRIMARY_LABEL,
  ARCHITECTURE_IDENTITY_LIST_EMPTY_TITLE,
  ARCHITECTURE_IDENTITY_LIST_LOADING_LABEL,
  ARCHITECTURE_IDENTITY_LIST_SHOW_ARCHIVED_LABEL,
  ARCHITECTURE_IDENTITY_TABLE_DRAFTS_COLUMN,
  ARCHITECTURE_IDENTITY_TABLE_NAME_COLUMN,
  ARCHITECTURE_IDENTITY_TABLE_REVIEWS_COLUMN,
  ARCHITECTURE_IDENTITY_TABLE_UPDATED_COLUMN,
} from "@/lib/architecture/architecture-identity-desk-copy";
import { buyerFilterChipClass } from "@/lib/buyer/buyer-shell-home-present";
import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { deriveInventoryHiddenFilterHonesty } from "@/lib/inventory-hidden-filter-honesty";
import { formatInventoryUpdatedAtCell } from "@/lib/relative-time";
import { cn } from "@/lib/utils";

const FILTER_CHIP_LAYOUT_CLASS = "w-fit shrink-0 whitespace-nowrap";

/** Working-mode architecture portfolio — server identity list (ADR 0074 / DA-04). */
export function ArchitectureIdentityListClient(): React.JSX.Element {
  const [showArchived, setShowArchived] = useState(false);
  const query = useArchitectureIdentitiesListQuery(1, undefined, { includeArchived: showArchived });
  const items = query.data?.items ?? [];
  const archivedHiddenCount = query.data?.archivedHiddenCount ?? 0;

  const hiddenFilterHonesty = useMemo(
    () =>
      deriveInventoryHiddenFilterHonesty({
        visibleCount: query.data?.totalCount ?? items.length,
        filteredPoolCount: (query.data?.totalCount ?? items.length) + archivedHiddenCount,
        unitSingular: "architecture",
        unitPlural: "architectures",
        filterLabel: "archived",
      }),
    [archivedHiddenCount, items.length, query.data?.totalCount],
  );

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

  if (items.length === 0 && !showArchived) {
    return (
      <div className="space-y-3">
        {!showArchived && archivedHiddenCount > 0 ? (
          <InventoryHiddenFilterHonestyBand
            honesty={hiddenFilterHonesty}
            onShowAll={() => setShowArchived(true)}
            testId="architecture-identity-list-hidden-archived-band"
          />
        ) : null}
        <EnterpriseCompactEmptyState
          title={ARCHITECTURE_IDENTITY_LIST_EMPTY_TITLE}
          description={ARCHITECTURE_IDENTITY_LIST_EMPTY_BODY}
          actions={[
            {
              label: ARCHITECTURE_IDENTITY_LIST_EMPTY_PRIMARY_LABEL,
              href: ARCHITECTURES_NEW_PATH,
              variant: "primary",
            },
          ]}
          testId="architecture-identity-list-empty"
        />
      </div>
    );
  }

  const totalCount = query.data?.totalCount ?? items.length;

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-2" data-testid="architecture-identity-list-toolbar">
        <FilterChipGroup aria-label="Filter architectures" className="flex flex-wrap items-center gap-1.5">
          <FilterChip
            data-testid="architecture-identity-list-show-archived"
            className={cn(FILTER_CHIP_LAYOUT_CLASS, buyerFilterChipClass(showArchived, archivedHiddenCount === 0, archivedHiddenCount === 0))}
            aria-pressed={showArchived}
            disabled={!showArchived && archivedHiddenCount === 0}
            onClick={() => setShowArchived((value) => !value)}
          >
            {ARCHITECTURE_IDENTITY_LIST_SHOW_ARCHIVED_LABEL}
          </FilterChip>
        </FilterChipGroup>
      </div>
      {!showArchived && archivedHiddenCount > 0 ? (
        <InventoryHiddenFilterHonestyBand
          honesty={hiddenFilterHonesty}
          onShowAll={() => setShowArchived(true)}
          testId="architecture-identity-list-hidden-archived-band"
        />
      ) : null}
      <InventoryShowingCountBand
        loaded={items.length}
        total={totalCount}
        hasMore={query.data?.hasMore}
        testId="architecture-identity-list-showing-count"
      />
      <EnterpriseTable ariaLabel="Architecture portfolio" data-testid="architecture-identity-list-table">
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
    </div>
  );
}
