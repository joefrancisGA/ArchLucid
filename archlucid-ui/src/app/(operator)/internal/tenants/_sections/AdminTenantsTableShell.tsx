"use client";

import { cn } from "@/lib/utils";

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
import { StatusTag } from "@/components/ui/status-tag";
import {
  resolveAdminTenantLifecycleStatus,
  type AdminTenantLifecycleStatus,
} from "@/lib/admin-tenants-ops";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

import type { AdminTenantsState } from "./use-admin-tenants-state";

function formatUtc(iso: string | null | undefined): string {
  if (iso == null || iso.trim().length === 0) {
    return " — ";
  }

  const parsed = new Date(iso);

  if (Number.isNaN(parsed.getTime())) {
    return " — ";
  }

  return parsed.toISOString().replace("T", " ").slice(0, 16) + " UTC";
}

function lifecycleStatusTag(status: AdminTenantLifecycleStatus) {
  switch (status) {
    case "active":
      return <StatusTag kind="ready" label="Active" />;
    case "suspended":
      return <StatusTag kind="needs-attention" label="Shut off" />;
    case "erasure-quarantine":
      return <StatusTag kind="blocked" label="Erasure quarantine" />;
    default: {
      const _exhaustive: never = status;
      return _exhaustive;
    }
  }
}

export type AdminTenantsTableShellProps = Pick<
  AdminTenantsState,
  "sortedItems" | "loading" | "mutatingId" | "onShutOff" | "onTurnOn"
>;

export function AdminTenantsTableShell({
  sortedItems,
  loading,
  mutatingId,
  onShutOff,
  onTurnOn,
}: AdminTenantsTableShellProps) {
  return (
    <EnterpriseTable ariaLabel="Admin tenants" data-testid="admin-tenants-table">
      <EnterpriseTableHead>
        <EnterpriseTableHeadRow>
          <EnterpriseTableHeaderCell>Name</EnterpriseTableHeaderCell>
          <EnterpriseTableHeaderCell>Slug</EnterpriseTableHeaderCell>
          <EnterpriseTableHeaderCell>Tier</EnterpriseTableHeaderCell>
          <EnterpriseTableHeaderCell>Status</EnterpriseTableHeaderCell>
          <EnterpriseTableHeaderCell>Created</EnterpriseTableHeaderCell>
          <EnterpriseTableHeaderCell>Actions</EnterpriseTableHeaderCell>
        </EnterpriseTableHeadRow>
      </EnterpriseTableHead>
      <EnterpriseTableBody>
        {sortedItems.length === 0 && !loading ? (
          <EnterpriseTableRow>
            <EnterpriseTableCell colSpan={6}>No tenants registered yet.</EnterpriseTableCell>
          </EnterpriseTableRow>
        ) : null}
        {sortedItems.map((row) => {
          const id = row.id ?? "";
          const status = resolveAdminTenantLifecycleStatus(row);
          const busy = mutatingId === id;

          return (
            <EnterpriseTableRow key={id || row.slug || row.name}>
              <EnterpriseTableCell>
                <div className="font-medium">{row.name ?? " — "}</div>
                <div className={cn("font-mono text-al-text-secondary", OPERATOR_TYPOGRAPHY.micro)}>{id || " — "}</div>
              </EnterpriseTableCell>
              <EnterpriseTableCell>{row.slug ?? " — "}</EnterpriseTableCell>
              <EnterpriseTableCell>{row.tier ?? " — "}</EnterpriseTableCell>
              <EnterpriseTableCell>{lifecycleStatusTag(status)}</EnterpriseTableCell>
              <EnterpriseTableCell>{formatUtc(row.createdUtc)}</EnterpriseTableCell>
              <EnterpriseTableCell>
                <div className="flex flex-wrap gap-2">
                  {status === "active" ? (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={busy || id.length === 0}
                      onClick={() => {
                        void onShutOff(row);
                      }}
                      data-testid={`admin-tenants-shut-off-${id}`}
                    >
                      Shut off
                    </Button>
                  ) : null}
                  {status === "suspended" ? (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={busy || id.length === 0}
                      onClick={() => {
                        void onTurnOn(row);
                      }}
                      data-testid={`admin-tenants-turn-on-${id}`}
                    >
                      Turn back on
                    </Button>
                  ) : null}
                  {status === "erasure-quarantine" ? (
                    <span className={cn("text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
                      Use platform erasure restore API
                    </span>
                  ) : null}
                </div>
              </EnterpriseTableCell>
            </EnterpriseTableRow>
          );
        })}
      </EnterpriseTableBody>
    </EnterpriseTable>
  );
}
