"use client";

import { cn } from "@/lib/utils";

import { ConfirmationDialog } from "@/components/ConfirmationDialog";
import { Button } from "@/components/ui/button";
import { RefreshButton } from "@/components/ui/refresh-button";
import { PageContextualHelpButton } from "@/components/usability/PageContextualHelpButton";
import { OperatorPageContainer } from "@/components/operator/OperatorPageContainer";
import { OperatorPageHeader } from "@/components/operator/OperatorPageHeader";
import { AdminTenantsEvidenceOrientationStrip } from "@/components/evidence-orientation/registry/claim-and-sources-strips";
import { INTERNAL_TENANTS_PATH } from "@/lib/internal-ops-route-paths";
import { OPERATOR_LAYOUT, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import type { AdminTenantTier } from "@/lib/admin-tenants-ops";

import { AdminTenantsTableShell } from "./AdminTenantsTableShell";
import { useAdminTenantsState } from "./use-admin-tenants-state";

export function AdminTenantsPageClient() {
  const state = useAdminTenantsState();
  const {
    isAuthorityLoading,
    isAdmin,
    sortedItems,
    error,
    actionMessage,
    loading,
    mutatingId,
    pendingTenantAction,
    name,
    setName,
    adminEmail,
    setAdminEmail,
    tier,
    setTier,
    dataRegion,
    setDataRegion,
    creating,
    canCreate,
    refresh,
    onCreate,
    onShutOff,
    onTurnOn,
    confirmPendingTenantAction,
    clearPendingTenantAction,
  } = state;

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

      <AdminTenantsTableShell
        sortedItems={sortedItems}
        loading={loading}
        mutatingId={mutatingId}
        onShutOff={onShutOff}
        onTurnOn={onTurnOn}
      />

      <ConfirmationDialog
        open={pendingTenantAction !== null}
        onOpenChange={(open) => {
          if (!open) {
            clearPendingTenantAction();
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
