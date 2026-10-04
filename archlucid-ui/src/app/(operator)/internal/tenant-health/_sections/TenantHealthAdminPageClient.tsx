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
import { useOperatorNavAuthority } from "@/components/operator/OperatorNavAuthorityProvider";
import { OperatorPageContainer } from "@/components/operator/OperatorPageContainer";
import { OperatorPageHeader } from "@/components/operator/OperatorPageHeader";
import { TenantHealthEvidenceOrientationStrip } from "@/components/evidence-orientation/registry/claim-and-sources-strips";
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
import { formatAdminTenantHealthMetric } from "@/lib/tenant-health-admin-display";

function formatUtc(iso: string | null): string {
  if (!iso) {
    return "Last activity not returned";
  }

  const parsed = new Date(iso);

  if (Number.isNaN(parsed.getTime())) {
    return "Date not readable";
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
    () =>
      [...items].sort((left, right) => {
        const leftScore = left.engagementScore ?? Number.POSITIVE_INFINITY;
        const rightScore = right.engagementScore ?? Number.POSITIVE_INFINITY;

        return leftScore - rightScore;
      }),
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
    <OperatorPageContainer variant="dashboard" className={OPERATOR_LAYOUT.sectionStack} data-testid="tenant-health-admin-page">
      <OperatorPageHeader
        navHref={INTERNAL_TENANT_HEALTH_PATH}
        headingLevel="h1"
        title="Tenant health"
        subtitle="Internal customer-success view of engagement, approval activity, and pilot funnel stage per tenant scope."
        actions={
          <>
            <RefreshButton busy={loading} onClick={() => void refresh()} />
            <PageContextualHelpButton />
          </>
        }
      />
      <TenantHealthEvidenceOrientationStrip />
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
            <EnterpriseTableHeaderCell>
              Governance
              <span className={cn("block font-normal text-al-text-secondary", OPERATOR_TYPOGRAPHY.micro)}>
                Not returned means the API omitted this score.
              </span>
            </EnterpriseTableHeaderCell>
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
                <span className={cn("tabular-nums font-medium text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}>
                  {formatAdminTenantHealthMetric(row.engagementScore)}
                </span>
                <span className={cn("ml-2 text-al-text-secondary", OPERATOR_TYPOGRAPHY.micro)}>Engagement score</span>
              </EnterpriseTableCell>
              <EnterpriseTableCell>{formatAdminTenantHealthMetric(row.governanceScore)}</EnterpriseTableCell>
              <EnterpriseTableCell>{row.pilotFunnelStage || "Not returned"}</EnterpriseTableCell>
              <EnterpriseTableCell>{formatAdminTenantHealthMetric(row.runsLast7d)}</EnterpriseTableCell>
              <EnterpriseTableCell>{formatUtc(row.lastActivityUtc)}</EnterpriseTableCell>
            </EnterpriseTableRow>
          ))}
        </EnterpriseTableBody>
      </EnterpriseTable>
    </OperatorPageContainer>
  );
}
