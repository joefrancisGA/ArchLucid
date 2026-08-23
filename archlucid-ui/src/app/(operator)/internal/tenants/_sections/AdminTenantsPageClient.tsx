"use client";

import { cn } from "@/lib/utils";
import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";

import { ConfirmationDialog } from "@/components/ConfirmationDialog";
import { Button } from "@/components/ui/button";
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
import { StatusTag } from "@/components/ui/status-tag";
import { useOperatorNavAuthority } from "@/components/operator/OperatorNavAuthorityProvider";
import { PageContextualHelpButton } from "@/components/usability/PageContextualHelpButton";
import { OperatorPageContainer } from "@/components/operator/OperatorPageContainer";
import { OperatorPageHeader } from "@/components/operator/OperatorPageHeader";
import { AdminTenantsEvidenceOrientationStrip } from "@/components/evidence-orientation/registry/claim-and-sources-strips";
import { INTERNAL_TENANTS_PATH } from "@/lib/internal-ops-route-paths";
import { OPERATOR_LAYOUT, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { AUTHORITY_RANK } from "@/lib/nav-authority";
import {
  canProvisionAdminTenantForm,
  listAdminTenants,
  provisionAdminTenant,
  resolveAdminTenantLifecycleStatus,
  suspendAdminTenant,
  unsuspendAdminTenant,
  type AdminTenantLifecycleStatus,
  type AdminTenantRecord,
  type AdminTenantTier,
} from "@/lib/admin-tenants-ops";

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

export function AdminTenantsPageClient() {
  const { callerAuthorityRank, isAuthorityLoading } = useOperatorNavAuthority();
  const isAdmin = callerAuthorityRank >= AUTHORITY_RANK.AdminAuthority;

  const [items, setItems] = useState<AdminTenantRecord[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [mutatingId, setMutatingId] = useState<string | null>(null);
  const [pendingTenantAction, setPendingTenantAction] = useState<{
    kind: "shut-off" | "turn-on";
    row: AdminTenantRecord;
  } | null>(null);

  const [name, setName] = useState("");
  const [adminEmail, setAdminEmail] = useState("");
  const [tier, setTier] = useState<AdminTenantTier>("Standard");
  const [dataRegion, setDataRegion] = useState("default");
  const [creating, setCreating] = useState(false);

  const canCreate = canProvisionAdminTenantForm(name, adminEmail);

  const sortedItems = useMemo(() => {
    return [...items].sort((left, right) => {
      const leftName = (left.name ?? "").toLocaleLowerCase();
      const rightName = (right.name ?? "").toLocaleLowerCase();

      return leftName.localeCompare(rightName);
    });
  }, [items]);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const rows = await listAdminTenants();
      setItems(rows);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load tenants.");
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

  async function onCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!canCreate || creating) {
      return;
    }

    setCreating(true);
    setError(null);
    setActionMessage(null);

    try {
      const result = await provisionAdminTenant({
        name: name.trim(),
        adminEmail: adminEmail.trim(),
        tier,
        dataRegion: dataRegion.trim().length > 0 ? dataRegion.trim() : "default",
      });
      setName("");
      setAdminEmail("");
      setActionMessage(
        result.wasAlreadyProvisioned === true
          ? `Tenant already existed (${result.tenantId ?? "unknown id"}). Default packs are already seeded.`
          : `Created tenant ${result.tenantId ?? ""}. Default policy packs were seeded.`,
      );
      await refresh();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to create tenant.");
    } finally {
      setCreating(false);
    }
  }

  async function onShutOff(row: AdminTenantRecord) {
    const id = row.id?.trim() ?? "";

    if (id.length === 0 || mutatingId !== null) {
      return;
    }

    setPendingTenantAction({ kind: "shut-off", row });
  }

  async function onTurnOn(row: AdminTenantRecord) {
    const id = row.id?.trim() ?? "";

    if (id.length === 0 || mutatingId !== null) {
      return;
    }

    setPendingTenantAction({ kind: "turn-on", row });
  }

  async function confirmPendingTenantAction(): Promise<void> {
    if (pendingTenantAction === null || mutatingId !== null) {
      return;
    }

    const row = pendingTenantAction.row;
    const id = row.id?.trim() ?? "";

    if (id.length === 0) {
      return;
    }

    setMutatingId(id);
    setError(null);
    setActionMessage(null);

    try {
      if (pendingTenantAction.kind === "shut-off") {
        await suspendAdminTenant(id);
        setActionMessage(`Shut off ${row.name ?? id}.`);
      } else {
        await unsuspendAdminTenant(id);
        setActionMessage(`Turned on ${row.name ?? id}.`);
      }

      setPendingTenantAction(null);
      await refresh();
    } catch (e: unknown) {
      setError(
        e instanceof Error
          ? e.message
          : pendingTenantAction.kind === "shut-off"
            ? "Failed to shut off tenant."
            : "Failed to turn tenant back on.",
      );
    } finally {
      setMutatingId(null);
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
    <OperatorPageContainer variant="dashboard" className={OPERATOR_LAYOUT.sectionStack} data-testid="admin-tenants-page">
      <OperatorPageHeader
        navHref={INTERNAL_TENANTS_PATH}
        title="Tenants"
        headingLevel="h1"
        subtitle="Provision a net-new tenant (seeds bundled policy packs) or shut off an existing tenant without deleting data. Erasure quarantine remains a separate platform deletion path."
        actions={<PageContextualHelpButton />}
      >
        <RefreshButton
          busy={loading}
          onClick={() => {
            void refresh();
          }}
        />
      </OperatorPageHeader>

      <AdminTenantsEvidenceOrientationStrip />

      <section
        className="space-y-3 rounded-md border border-neutral-300 p-4 dark:border-neutral-700"
        aria-labelledby="admin-tenants-create-heading"
        data-testid="admin-tenants-create"
      >
        <h2 id="admin-tenants-create-heading" className={OPERATOR_TYPOGRAPHY.sectionTitle}>
          Create tenant
        </h2>
        <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
          Creates the tenant registry row, default workspace/project, and seeds platform default policy packs.
        </p>
        <form className="grid max-w-xl gap-3" onSubmit={(event) => void onCreate(event)}>
          <label className={cn("grid gap-1", OPERATOR_TYPOGRAPHY.body)}>
            Organization name
            <input
              className="rounded-md border border-input bg-background px-3 py-2"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoComplete="organization"
              data-testid="admin-tenants-name"
              required
            />
          </label>
          <label className={cn("grid gap-1", OPERATOR_TYPOGRAPHY.body)}>
            Admin email
            <input
              type="email"
              className="rounded-md border border-input bg-background px-3 py-2"
              value={adminEmail}
              onChange={(e) => setAdminEmail(e.target.value)}
              autoComplete="email"
              data-testid="admin-tenants-admin-email"
              required
            />
          </label>
          <label className={cn("grid gap-1", OPERATOR_TYPOGRAPHY.body)}>
            Tier
            <select
              className="rounded-md border border-input bg-background px-3 py-2"
              value={tier}
              onChange={(e) => setTier(e.target.value as AdminTenantTier)}
              data-testid="admin-tenants-tier"
            >
              <option value="Free">Free</option>
              <option value="Standard">Standard</option>
              <option value="Enterprise">Enterprise</option>
            </select>
          </label>
          <label className={cn("grid gap-1", OPERATOR_TYPOGRAPHY.body)}>
            Data region
            <input
              className="rounded-md border border-input bg-background px-3 py-2"
              value={dataRegion}
              onChange={(e) => setDataRegion(e.target.value)}
              data-testid="admin-tenants-data-region"
            />
          </label>
          {!canCreate ? (
            <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)} role="status">
              Enter an organization name and a valid admin email to enable Create.
            </p>
          ) : null}
          <div>
            <Button
              type="submit"
              disabled={!canCreate || creating}
              data-testid="admin-tenants-create-submit"
            >
              {creating ? "Creating…" : "Create tenant"}
            </Button>
          </div>
        </form>
      </section>

      {error ? (
        <p className={cn("text-rose-700 dark:text-rose-300", OPERATOR_TYPOGRAPHY.body)} role="alert">
          {error}
        </p>
      ) : null}

      {actionMessage ? (
        <p className={cn("text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)} role="status">
          {actionMessage}
        </p>
      ) : null}

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

      <ConfirmationDialog
        open={pendingTenantAction !== null}
        onOpenChange={(open) => {
          if (!open && mutatingId === null) {
            setPendingTenantAction(null);
          }
        }}
        title={
          pendingTenantAction?.kind === "turn-on" ? "Turn tenant back on?" : "Shut off tenant?"
        }
        description={
          pendingTenantAction?.kind === "turn-on"
            ? `Restore API access for tenant "${pendingTenantAction.row.name ?? pendingTenantAction.row.id ?? "this tenant"}"?`
            : `Shut off tenant "${pendingTenantAction?.row.name ?? pendingTenantAction?.row.id ?? "this tenant"}"? API access for that tenant will be suspended. Data is retained.`
        }
        confirmLabel={pendingTenantAction?.kind === "turn-on" ? "Turn back on" : "Shut off tenant"}
        variant={pendingTenantAction?.kind === "turn-on" ? "default" : "destructive"}
        busy={mutatingId !== null}
        onConfirm={() => {
          void confirmPendingTenantAction();
        }}
      />
    </OperatorPageContainer>
  );
}
