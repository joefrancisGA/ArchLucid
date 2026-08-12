"use client";

import { cn } from "@/lib/utils";
import { useCallback, useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  EnterpriseTable,
  EnterpriseTableBody,
  EnterpriseTableCell,
  EnterpriseTableHead,
  EnterpriseTableHeaderCell,
  EnterpriseTableHeadRow,
  EnterpriseTableRow,
} from "@/components/ui/enterprise-table";
import { SeverityTag } from "@/components/ui/severity-tag";
import { useOperatorNavAuthority } from "@/components/operator/OperatorNavAuthorityProvider";
import { PageContextualHelpButton } from "@/components/usability/PageContextualHelpButton";
import { TenantSystemWorkspaceHealthVocabularyRail } from "@/components/TenantSystemWorkspaceHealthVocabularyRail";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
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
    <div className="w-full max-w-[1440px] space-y-6" data-testid="tenant-health-admin-page">
      <div>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className={OPERATOR_TYPOGRAPHY.pageTitle}>Tenant health</h1>
            <p className={cn("mt-1 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
              Internal customer-success view of engagement, governance, and pilot funnel stage per tenant scope.
            </p>
          </div>
          <PageContextualHelpButton />
        </div>
        <Button type="button" variant="outline" size="sm" className="mt-3" disabled={loading} onClick={() => void refresh()}>
          {loading ? "Refreshing…" : "Refresh"}
        </Button>
      </div>
      <TenantSystemWorkspaceHealthVocabularyRail currentSurfaceId="tenant-health" />
{error ? (
        <p className={cn("text-rose-700 dark:text-rose-300", OPERATOR_TYPOGRAPHY.body)} role="alert">
          {error}
        </p>
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
