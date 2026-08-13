"use client";

import { cn } from "@/lib/utils";
import { useCallback, useEffect, useMemo, useState } from "react";

import { RefreshButton } from "@/components/ui/refresh-button";
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
import { SeverityTag } from "@/components/ui/severity-tag";
import { useOperatorNavAuthority } from "@/components/operator/OperatorNavAuthorityProvider";
import { OperatorPageHeader } from "@/components/operator/OperatorPageHeader";
import { OperatorSectionLoadFailure } from "@/components/operator/OperatorSectionLoadFailure";
import { PageContextualHelpButton } from "@/components/usability/PageContextualHelpButton";
import { TenantSystemWorkspaceHealthVocabularyRail } from "@/components/TenantSystemWorkspaceHealthVocabularyRail";
import { INTERNAL_TENANT_HEALTH_PATH } from "@/lib/internal-ops-route-paths";
import { OPERATOR_LAYOUT, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { AUTHORITY_RANK } from "@/lib/nav-authority";
import {
  fetchAdminTenantHealthList,
  type AdminTenantHealthSummaryItem,
} from "@/lib/tenant-health-admin";
import { engagementScoreSeverityKind } from "@/lib/tenant-health-engagement-severity";

function formatUtc(iso: string | null): string {
  if (!iso) {
    return "—";
  }

  const parsed = new Date(iso);

  if (Number.isNaN(parsed.getTime())) {
    return "—";
  }

  return parsed.toISOString().replace("T", " ").slice(0, 16) + " UTC";
}

export function TenantHealthAdminPageClient() {
  const { callerAuthorityRank, isAuthorityLoading } = useOperatorNavAuthority();
  const isAdmin = callerAuthorityRank >= AUTHORITY_RANK.AdminAuthority;
  const [items, setItems] = useState<AdminTenantHealthSummaryItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const sortedItems = useMemo(
    () => [...items].sort((left, right) => left.engagementScore - right.engagementScore),
    [items],
  );

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetchAdminTenantHealthList();
      setItems(response.items);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load tenant health.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthorityLoading || !isAdmin) {
      return;
    }

    void refresh();
  }, [isAdmin, isAuthorityLoading, refresh]);

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
    <div className={cn("w-full max-w-[1440px]", OPERATOR_LAYOUT.sectionStack)} data-testid="tenant-health-admin-page">
      <OperatorPageHeader
        navHref={INTERNAL_TENANT_HEALTH_PATH}
        headingLevel="h1"
        title="Tenant health"
        subtitle="Internal customer-success view of engagement, governance, and pilot funnel stage per tenant scope."
        actions={
          <>
            <RefreshButton busy={loading} onClick={() => void refresh()} />
            <PageContextualHelpButton />
          </>
        }
      />
      <TenantSystemWorkspaceHealthVocabularyRail currentSurfaceId="tenant-health" />
      {error ? (
        <OperatorSectionLoadFailure
          message={error}
          retryLabel="Reload tenant health"
          retrying={loading}
          testId="tenant-health-load-failure"
          onRetry={() => void refresh()}
        />
      ) : null}

      <EnterpriseTable ariaLabel="Tenant health scores">
        <EnterpriseTableHead>
          <EnterpriseTableHeadRow>
            <EnterpriseTableHeaderCell>Tenant</EnterpriseTableHeaderCell>
            <EnterpriseTableHeaderCell>Engagement</EnterpriseTableHeaderCell>
            <EnterpriseTableHeaderCell>Governance</EnterpriseTableHeaderCell>
            <EnterpriseTableHeaderCell>Funnel stage</EnterpriseTableHeaderCell>
            <EnterpriseTableHeaderCell>Reviews (7d)</EnterpriseTableHeaderCell>
            <EnterpriseTableHeaderCell>Last active</EnterpriseTableHeaderCell>
          </EnterpriseTableHeadRow>
        </EnterpriseTableHead>
        <EnterpriseTableBody>
          {loading && sortedItems.length === 0 ? (
            <EnterpriseTableSkeletonRows
              columns={6}
              label="Loading tenant health…"
              testId="tenant-health-skeleton"
            />
          ) : null}
          {sortedItems.map((row) => (
            <EnterpriseTableRow key={`${row.tenantId}-${row.workspaceId}-${row.projectId}`}>
              <EnterpriseTableCell className={cn("font-mono text-al-text-primary", OPERATOR_TYPOGRAPHY.micro)}>
                {row.tenantId}
              </EnterpriseTableCell>
              <EnterpriseTableCell>
                <SeverityTag
                  severity={String(row.engagementScore)}
                  kind={engagementScoreSeverityKind(row.engagementScore)}
                  label={`${row.engagementScore}`}
                />
              </EnterpriseTableCell>
              <EnterpriseTableCell>{row.governanceScore}</EnterpriseTableCell>
              <EnterpriseTableCell>{row.pilotFunnelStage}</EnterpriseTableCell>
              <EnterpriseTableCell>{row.runsLast7d}</EnterpriseTableCell>
              <EnterpriseTableCell>{formatUtc(row.lastActivityUtc)}</EnterpriseTableCell>
            </EnterpriseTableRow>
          ))}
        </EnterpriseTableBody>
      </EnterpriseTable>
    </div>
  );
}
