"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

import { HelpLazyDetails } from "@/components/help/HelpLazyDetails";
import { EnterpriseCompactEmptyState } from "@/components/EnterpriseCompactEmptyState";
import { useOperatorNavAuthority } from "@/components/operator/OperatorNavAuthorityProvider";
import { OperatorPageHeader } from "@/components/operator/OperatorPageHeader";
import { OperatorSectionLoadFailure } from "@/components/operator/OperatorSectionLoadFailure";
import { PageContextualHelpButton } from "@/components/usability/PageContextualHelpButton";
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
import { RefreshButton } from "@/components/ui/refresh-button";
import { StatusTag } from "@/components/ui/status-tag";
import { listPlatformBundledPolicyPacks, setPlatformBundledPolicyPackActivation } from "@/lib/api";
import { OPERATOR_LAYOUT, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { INTERNAL_PLATFORM_BUNDLED_POLICY_PACKS_PATH } from "@/lib/internal-ops-route-paths";
import { AUTHORITY_RANK } from "@/lib/nav-authority";
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
  PLATFORM_BUNDLED_POLICY_PACKS_PAGE_SUBTITLE,
  PLATFORM_BUNDLED_POLICY_PACKS_PAGE_TITLE,
  PLATFORM_BUNDLED_POLICY_PACKS_TABLE_ARIA_LABEL,
  platformBundledPolicyPackActivateButtonLabel,
  platformBundledPolicyPackDeactivateButtonLabel,
  platformBundledPolicyPackListLoadFailureMessage,
  platformBundledPolicyPackToggleSuccessMessage,
} from "@/lib/platform-bundled-policy-packs-page-copy";
import {
  derivePlatformBundledPolicyPackCategory,
  formatPlatformBundledPolicyPackUtc,
  platformBundledPolicyPackCategoryLabel,
  PLATFORM_BUNDLED_POLICY_PACK_CATEGORY_OPTIONS,
  type PlatformBundledPolicyPackCategory,
} from "@/lib/platform-bundled-policy-packs-display";
import type { PlatformBundledPolicyPackRegistryEntry } from "@/types/policy-packs";
import { cn } from "@/lib/utils";

import { PlatformBundledPolicyPackActivationConfirmDialog } from "./PlatformBundledPolicyPackActivationConfirmDialog";

type PendingActivation = {
  row: PlatformBundledPolicyPackRegistryEntry;
  nextActive: boolean;
};

function rowMatchesFilters(
  row: PlatformBundledPolicyPackRegistryEntry,
  nameFilter: string,
  categoryFilter: PlatformBundledPolicyPackCategory,
): boolean {
  const normalizedFilter = nameFilter.trim().toLowerCase();

  if (normalizedFilter.length > 0 && !row.displayName.toLowerCase().includes(normalizedFilter)) {
    return false;
  }

  if (categoryFilter !== "all") {
    const derived = derivePlatformBundledPolicyPackCategory(row.bundleContentFile);

    if (derived !== categoryFilter) {
      return false;
    }
  }

  return true;
}

export function AdminPlatformBundledPolicyPacksPageClient() {
  const { callerAuthorityRank, isAuthorityLoading } = useOperatorNavAuthority();
  const isAdmin = callerAuthorityRank >= AUTHORITY_RANK.AdminAuthority;

  const [rows, setRows] = useState<PlatformBundledPolicyPackRegistryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [updatingFile, setUpdatingFile] = useState<string | null>(null);
  const [toggleMessage, setToggleMessage] = useState<string | null>(null);
  const [nameFilter, setNameFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<PlatformBundledPolicyPackCategory>("all");
  const [pendingActivation, setPendingActivation] = useState<PendingActivation | null>(null);
  const [deactivateAcknowledgment, setDeactivateAcknowledgment] = useState("");

  const load = useCallback(async (): Promise<boolean> => {
    setLoading(true);
    setLoadError(null);

    try {
      const data = await listPlatformBundledPolicyPacks();
      setRows(data);

      return true;
    } catch (cause) {
      setLoadError(platformBundledPolicyPackListLoadFailureMessage(cause instanceof Error ? cause.message : String(cause)));

      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthorityLoading || !isAdmin) {
      return;
    }

    void load();
  }, [isAdmin, isAuthorityLoading, load]);

  const filteredRows = useMemo(
    () => rows.filter((row) => rowMatchesFilters(row, nameFilter, categoryFilter)),
    [rows, nameFilter, categoryFilter],
  );

  const hasActiveFilters = nameFilter.trim().length > 0 || categoryFilter !== "all";

  function openActivationConfirm(row: PlatformBundledPolicyPackRegistryEntry) {
    setToggleMessage(null);
    setDeactivateAcknowledgment("");
    setPendingActivation({
      row,
      nextActive: !row.isGloballyActive,
    });
  }

  async function confirmPendingActivation() {
    if (pendingActivation === null || updatingFile !== null) {
      return;
    }

    const { row, nextActive } = pendingActivation;
    setUpdatingFile(row.bundleContentFile);
    setLoadError(null);

    try {
      const updated = await setPlatformBundledPolicyPackActivation(row.bundleContentFile, nextActive);

      setRows((current) =>
        current.map((entry) =>
          entry.bundleContentFile === updated.bundleContentFile ? updated : entry,
        ),
      );
      setToggleMessage(platformBundledPolicyPackToggleSuccessMessage(row.displayName, nextActive));
      setPendingActivation(null);
      setDeactivateAcknowledgment("");

      const reloaded = await load();

      if (!reloaded) {
        setToggleMessage(null);
      }
    } catch (cause) {
      setLoadError(platformBundledPolicyPackListLoadFailureMessage(cause instanceof Error ? cause.message : String(cause)));
    } finally {
      setUpdatingFile(null);
    }
  }

  if (isAuthorityLoading) {
    return <p className={cn("text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>Loading…</p>;
  }

  if (!isAdmin) {
    return (
      <p className={cn("text-rose-800 dark:text-rose-200", OPERATOR_TYPOGRAPHY.body)} role="alert">
        This page requires tenant administrator access (AdminAuthority).
      </p>
    );
  }

  return (
    <div
      className={cn("w-full max-w-[1440px]", OPERATOR_LAYOUT.sectionStack)}
      data-testid="admin-platform-bundled-policy-packs-page"
    >
      <OperatorPageHeader
        navHref={INTERNAL_PLATFORM_BUNDLED_POLICY_PACKS_PATH}
        title={PLATFORM_BUNDLED_POLICY_PACKS_PAGE_TITLE}
        headingLevel="h1"
        subtitle={PLATFORM_BUNDLED_POLICY_PACKS_PAGE_SUBTITLE}
        actions={
          <div
            className="flex flex-wrap items-center gap-2"
            data-testid="platform-bundled-policy-packs-header-actions"
          >
            <RefreshButton
              busy={loading}
              data-testid="platform-bundled-policy-packs-refresh-button"
              onClick={() => {
                void load();
              }}
            />
            <PageContextualHelpButton />
          </div>
        }
      />

      {loadError !== null ? (
        <OperatorSectionLoadFailure
          message={loadError}
          retryLabel="Reload registry"
          retrying={loading}
          testId="platform-bundled-policy-packs-load-failure"
          onRetry={() => {
            void load();
          }}
        />
      ) : null}

      {toggleMessage !== null ? (
        <p
          className={cn("text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}
          role="status"
          data-testid="platform-bundled-policy-packs-toggle-status"
        >
          {toggleMessage}
        </p>
      ) : null}

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

      {pendingActivation !== null ? (
        <PlatformBundledPolicyPackActivationConfirmDialog
          open={pendingActivation !== null}
          busy={updatingFile !== null}
          displayName={pendingActivation.row.displayName}
          mode={pendingActivation.nextActive ? "activate" : "deactivate"}
          acknowledgment={deactivateAcknowledgment}
          onAcknowledgmentChange={setDeactivateAcknowledgment}
          onCancel={() => {
            if (updatingFile === null) {
              setPendingActivation(null);
              setDeactivateAcknowledgment("");
            }
          }}
          onConfirm={() => {
            void confirmPendingActivation();
          }}
        />
      ) : null}
    </div>
  );
}
