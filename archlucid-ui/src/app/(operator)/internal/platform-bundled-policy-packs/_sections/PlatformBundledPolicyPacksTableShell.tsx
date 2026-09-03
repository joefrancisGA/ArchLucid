"use client";

import Link from "next/link";

import { HelpLazyDetails } from "@/components/help/HelpLazyDetails";
import { EnterpriseCompactEmptyState } from "@/components/EnterpriseCompactEmptyState";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  EnterpriseTable,
  EnterpriseTableBody,
  EnterpriseTableCell,
  EnterpriseTableHead,
  EnterpriseTableHeaderCell,
  EnterpriseTableHeadRow,
  EnterpriseTableRow,
} from "@/components/ui/enterprise-table";
import { EnterpriseTableSkeletonRows } from "@/components/ui/enterprise-table-skeleton-rows";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { StatusTag } from "@/components/ui/status-tag";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import {
  PLATFORM_BUNDLED_POLICY_PACK_AUDIT_HREF,
  PLATFORM_BUNDLED_POLICY_PACK_AUDIT_LINK_LABEL,
  PLATFORM_BUNDLED_POLICY_PACKS_BLAST_RADIUS_ACTIVE,
  PLATFORM_BUNDLED_POLICY_PACKS_BLAST_RADIUS_DEACTIVATED,
  PLATFORM_BUNDLED_POLICY_PACKS_BLAST_RADIUS_LABEL,
  PLATFORM_BUNDLED_POLICY_PACKS_EMPTY_DESCRIPTION,
  PLATFORM_BUNDLED_POLICY_PACKS_EMPTY_TITLE,
  PLATFORM_BUNDLED_POLICY_PACKS_FILTER_EMPTY_DESCRIPTION,
  PLATFORM_BUNDLED_POLICY_PACKS_FILTER_EMPTY_TITLE,
  PLATFORM_BUNDLED_POLICY_PACKS_TABLE_ARIA_LABEL,
  platformBundledPolicyPackActivateButtonLabel,
  platformBundledPolicyPackDeactivateButtonLabel,
} from "@/lib/platform-bundled-policy-packs-page-copy";
import {
  derivePlatformBundledPolicyPackCategory,
  formatPlatformBundledPolicyPackUtc,
  platformBundledPolicyPackCategoryLabel,
  PLATFORM_BUNDLED_POLICY_PACK_CATEGORY_OPTIONS,
  type PlatformBundledPolicyPackCategory,
} from "@/lib/platform-bundled-policy-packs-display";
import { cn } from "@/lib/utils";

import type { PlatformBundledPolicyPacksState } from "./use-platform-bundled-policy-packs-state";

export type PlatformBundledPolicyPacksTableShellProps = Pick<
  PlatformBundledPolicyPacksState,
  | "rows"
  | "loading"
  | "updatingFile"
  | "nameFilter"
  | "setNameFilter"
  | "categoryFilter"
  | "setCategoryFilter"
  | "filteredRows"
  | "hasActiveFilters"
  | "openActivationConfirm"
>;

export function PlatformBundledPolicyPacksTableShell(props: PlatformBundledPolicyPacksTableShellProps): React.JSX.Element {
  const {
    rows,
    loading,
    updatingFile,
    nameFilter,
    setNameFilter,
    categoryFilter,
    setCategoryFilter,
    filteredRows,
    hasActiveFilters,
    openActivationConfirm,
  } = props;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className={OPERATOR_TYPOGRAPHY.cardTitle}>Bundled pack registry</CardTitle>
      </CardHeader>
      <CardContent className={cn("space-y-4", OPERATOR_TYPOGRAPHY.body)}>
        <div className="flex flex-wrap items-end gap-3">
          <div className="grid min-w-[12rem] gap-1">
            <Label htmlFor="platform-bundled-policy-packs-name-filter" className={OPERATOR_TYPOGRAPHY.label}>
              Filter by name
            </Label>
            <Input
              id="platform-bundled-policy-packs-name-filter"
              value={nameFilter}
              data-testid="platform-bundled-policy-packs-name-filter"
              onChange={(event) => {
                setNameFilter(event.target.value);
              }}
            />
          </div>
          <div className="grid min-w-[12rem] gap-1">
            <Label htmlFor="platform-bundled-policy-packs-category-filter" className={OPERATOR_TYPOGRAPHY.label}>
              Category
            </Label>
            <select
              id="platform-bundled-policy-packs-category-filter"
              className="rounded-md border border-input bg-background px-3 py-2"
              value={categoryFilter}
              data-testid="platform-bundled-policy-packs-category-filter"
              onChange={(event) => {
                setCategoryFilter(event.target.value as PlatformBundledPolicyPackCategory);
              }}
            >
              {PLATFORM_BUNDLED_POLICY_PACK_CATEGORY_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {loading ? (
          <EnterpriseTable ariaLabel={PLATFORM_BUNDLED_POLICY_PACKS_TABLE_ARIA_LABEL}>
            <EnterpriseTableHead>
              <EnterpriseTableHeadRow>
                <EnterpriseTableHeaderCell>Display name</EnterpriseTableHeaderCell>
                <EnterpriseTableHeaderCell>Status</EnterpriseTableHeaderCell>
                <EnterpriseTableHeaderCell>{PLATFORM_BUNDLED_POLICY_PACKS_BLAST_RADIUS_LABEL}</EnterpriseTableHeaderCell>
                <EnterpriseTableHeaderCell>Last changed</EnterpriseTableHeaderCell>
                <EnterpriseTableHeaderCell>Actions</EnterpriseTableHeaderCell>
              </EnterpriseTableHeadRow>
            </EnterpriseTableHead>
            <EnterpriseTableBody>
              <EnterpriseTableSkeletonRows columns={5} rows={6} />
            </EnterpriseTableBody>
          </EnterpriseTable>
        ) : null}

        {!loading && rows.length === 0 ? (
          <EnterpriseCompactEmptyState
            testId="platform-bundled-policy-packs-empty-state"
            title={PLATFORM_BUNDLED_POLICY_PACKS_EMPTY_TITLE}
            description={PLATFORM_BUNDLED_POLICY_PACKS_EMPTY_DESCRIPTION}
          />
        ) : null}

        {!loading && rows.length > 0 && filteredRows.length === 0 ? (
          <EnterpriseCompactEmptyState
            testId="platform-bundled-policy-packs-filter-empty-state"
            title={PLATFORM_BUNDLED_POLICY_PACKS_FILTER_EMPTY_TITLE}
            description={PLATFORM_BUNDLED_POLICY_PACKS_FILTER_EMPTY_DESCRIPTION}
          />
        ) : null}

        {!loading && filteredRows.length > 0 ? (
          <EnterpriseTable ariaLabel={PLATFORM_BUNDLED_POLICY_PACKS_TABLE_ARIA_LABEL}>
            <EnterpriseTableHead>
              <EnterpriseTableHeadRow>
                <EnterpriseTableHeaderCell>Display name</EnterpriseTableHeaderCell>
                <EnterpriseTableHeaderCell>Status</EnterpriseTableHeaderCell>
                <EnterpriseTableHeaderCell>{PLATFORM_BUNDLED_POLICY_PACKS_BLAST_RADIUS_LABEL}</EnterpriseTableHeaderCell>
                <EnterpriseTableHeaderCell>Last changed</EnterpriseTableHeaderCell>
                <EnterpriseTableHeaderCell>Actions</EnterpriseTableHeaderCell>
              </EnterpriseTableHeadRow>
            </EnterpriseTableHead>
            <EnterpriseTableBody>
              {filteredRows.map((row) => {
                const category = derivePlatformBundledPolicyPackCategory(row.bundleContentFile);
                const isUpdating = updatingFile === row.bundleContentFile;
                const actionLabel = row.isGloballyActive
                  ? platformBundledPolicyPackDeactivateButtonLabel(row.displayName)
                  : platformBundledPolicyPackActivateButtonLabel(row.displayName);

                return (
                  <EnterpriseTableRow
                    key={row.bundleContentFile}
                    data-testid={`platform-bundled-policy-pack-${row.bundleContentFile}`}
                  >
                    <EnterpriseTableCell>
                      <div className="space-y-1">
                        <p className={cn("m-0 font-medium text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}>
                          {row.displayName}
                        </p>
                        <HelpLazyDetails
                          summary="Bundle file"
                          data-testid={`platform-bundled-policy-pack-file-${row.bundleContentFile}`}
                          bodyTestId={`platform-bundled-policy-pack-file-body-${row.bundleContentFile}`}
                          summaryClassName={cn("cursor-pointer text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}
                        >
                          <p className={cn("m-0 font-mono text-al-text-secondary", OPERATOR_TYPOGRAPHY.micro)}>
                            {row.bundleContentFile}
                          </p>
                        </HelpLazyDetails>
                      </div>
                    </EnterpriseTableCell>
                    <EnterpriseTableCell>
                      <StatusTag
                        kind={row.isGloballyActive ? "ready" : "neutral"}
                        label={row.isGloballyActive ? "Active globally" : "Deactivated globally"}
                      />
                    </EnterpriseTableCell>
                    <EnterpriseTableCell>
                      <div className="space-y-1">
                        <p className="m-0">{platformBundledPolicyPackCategoryLabel(category)}</p>
                        <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
                          {row.isGloballyActive
                            ? PLATFORM_BUNDLED_POLICY_PACKS_BLAST_RADIUS_ACTIVE
                            : PLATFORM_BUNDLED_POLICY_PACKS_BLAST_RADIUS_DEACTIVATED}
                        </p>
                      </div>
                    </EnterpriseTableCell>
                    <EnterpriseTableCell>
                      <div className="space-y-1">
                        <p className="m-0">{formatPlatformBundledPolicyPackUtc(row.updatedUtc)}</p>
                        <Link
                          href={PLATFORM_BUNDLED_POLICY_PACK_AUDIT_HREF}
                          className={cn("text-al-text-secondary underline-offset-2 hover:underline", OPERATOR_TYPOGRAPHY.helper)}
                        >
                          {PLATFORM_BUNDLED_POLICY_PACK_AUDIT_LINK_LABEL}
                        </Link>
                      </div>
                    </EnterpriseTableCell>
                    <EnterpriseTableCell>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        aria-label={actionLabel}
                        aria-disabled={isUpdating || updatingFile !== null}
                        aria-busy={isUpdating}
                        data-testid={`platform-bundled-policy-pack-toggle-${row.bundleContentFile}`}
                        onClick={() => {
                          if (isUpdating || updatingFile !== null) {
                            return;
                          }

                          openActivationConfirm(row);
                        }}
                      >
                        {isUpdating
                          ? "Saving…"
                          : row.isGloballyActive
                            ? "Deactivate globally"
                            : "Activate globally"}
                      </Button>
                    </EnterpriseTableCell>
                  </EnterpriseTableRow>
                );
              })}
            </EnterpriseTableBody>
          </EnterpriseTable>
        ) : null}

        {hasActiveFilters && filteredRows.length > 0 ? (
          <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)} role="status">
            Showing {filteredRows.length} of {rows.length} bundled packs.
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}
