"use client";

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
import { useOperatorNavAuthority } from "@/components/OperatorNavAuthorityProvider";
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
    return <p className="text-sm text-neutral-500">Loading…</p>;
  }

  if (!isAdmin) {
    return (
      <p className="text-sm text-rose-800 dark:text-rose-200" role="alert">
        This page requires tenant administrator access (AdminAuthority).
      </p>
    );
  }

  return (
    <div className="w-full max-w-[1440px] space-y-6" data-testid="tenant-health-admin-page">
      <div>
        <h1 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">Tenant health</h1>
        <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
          Internal customer-success view of engagement, governance, and pilot funnel stage per tenant scope.
        </p>
        <Button type="button" variant="outline" size="sm" className="mt-3" disabled={loading} onClick={() => void refresh()}>
          {loading ? "Refreshing…" : "Refresh"}
        </Button>
      </div>

      {error ? (
        <p className="text-sm text-rose-700 dark:text-rose-300" role="alert">
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
              <EnterpriseTableCell className="font-mono text-xs">{row.tenantId}</EnterpriseTableCell>
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
