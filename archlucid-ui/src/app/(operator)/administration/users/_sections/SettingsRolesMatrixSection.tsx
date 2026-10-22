"use client";

import { cn } from "@/lib/utils";

import { OperatorEmptyState } from "@/components/operator/OperatorShellMessage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { roleClaimCaption, roleDisplayLabel } from "@/lib/role-display-labels";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import {
  LivelihoodDocumentGuardDialog,
  useLivelihoodDocumentGuards,
} from "@/hooks/use-livelihood-document-guards";

import {
  BUILTIN_ROLE_SUMMARIES,
  CUSTOM_ROLE_START_FROM_OPTIONS,
  ROLES_MATRIX_HELPER_COPY,
  ROLES_MATRIX_LEGEND_COPY,
  unsavedRoleEditsNotice,
} from "./roles-matrix-constants";
import { totalUnsavedPermissionChanges } from "./custom-role-draft-state";
import { SettingsRolesMatrixTable } from "./SettingsRolesMatrixTable";
import { useSettingsRolesMatrix } from "./use-settings-roles-matrix";

/** Built-in role card. Shows the buyer-facing label and discloses the claim value when they differ. */
function BuiltinRoleSummaryCard({ apiRoleName, description }: { apiRoleName: string; description: string }) {
  const claimCaption = roleClaimCaption(apiRoleName);

  return (
    <div className="rounded-md border border-neutral-200 bg-neutral-50/80 px-3 py-2 dark:border-neutral-800 dark:bg-neutral-900/40">
      <p className={cn("m-0 font-semibold text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}>{roleDisplayLabel(apiRoleName)}</p>
      {claimCaption !== null ? (
        <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.micro)}>{claimCaption}</p>
      ) : null}
      <p className={cn("m-0 mt-1 text-al-text-secondary", OPERATOR_TYPOGRAPHY.micro)}>{description}</p>
    </div>
  );
}

export function SettingsRolesMatrixSection({ readOnly = false }: { readonly readOnly?: boolean }) {
  const {
    matrix,
    loading,
    loadFailure,
    load,
    columns,
    unsavedRoleNames,
    hasUnsavedEdits,
    savingRoleId,
    newRoleName,
    setNewRoleName,
    startFromRole,
    setStartFromRole,
    collapsedGroups,
    pendingHighRisk,
    setPendingHighRisk,
    newRoleNameRef,
    togglePermission,
    discardRoleEdits,
    toggleGroupCollapsed,
    requestSaveRole,
    permissionsForStartFrom,
    requestCreateCustomRole,
    prefillCloneOfRole,
    confirmHighRiskAction,
    pendingHighRiskLabels,
    createBlockedReason,
  } = useSettingsRolesMatrix();
  const documentGuards = useLivelihoodDocumentGuards({ when: hasUnsavedEdits });

  if (loading)
    return <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>Loading role matrix…</p>;

  if (loadFailure !== null) {
    return (
      <div className="space-y-4" data-testid="settings-roles-matrix-load-error">
        <OperatorEmptyState title={loadFailure.title} description={loadFailure.description} />
        <Button type="button" variant="secondary" size="sm" onClick={() => void load()}>
          Retry
        </Button>
      </div>
    );
  }

  return (
    <section data-testid="settings-roles-matrix" className="space-y-6">
        <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>{ROLES_MATRIX_HELPER_COPY}</p>

        {hasUnsavedEdits ? (
          <p
            role="status"
            data-testid="settings-roles-unsaved-notice"
            className={cn(
              "m-0 rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-amber-900 dark:border-amber-700/60 dark:bg-amber-950/40 dark:text-amber-100",
              OPERATOR_TYPOGRAPHY.body,
            )}
          >
            {unsavedRoleEditsNotice(unsavedRoleNames, totalUnsavedPermissionChanges(matrix.roles, matrix.baseline))}
          </p>
        ) : null}

        <div
          className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4"
          data-testid="settings-roles-builtin-summary"
          role="group"
          aria-label="Built-in role summaries"
        >
          {BUILTIN_ROLE_SUMMARIES.map((summary) => (
            <BuiltinRoleSummaryCard key={summary.name} apiRoleName={summary.name} description={summary.description} />
          ))}
        </div>

        {readOnly ? null : (
        <div className="rounded-md border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-950">
          <h3 className={cn("m-0 font-semibold text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}>Create custom role</h3>
          <p className={cn("m-0 mt-1 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
            Start from a built-in role or an empty permission set, then refine permissions in the matrix below.
          </p>
          <div className="mt-4 grid gap-3 md:grid-cols-[minmax(12rem,1fr)_minmax(12rem,1fr)_auto] md:items-end">
            <div>
              <label htmlFor="new-custom-role-name" className={cn("font-medium text-al-text-secondary", OPERATOR_TYPOGRAPHY.label)}>
                Role name
              </label>
              <Input
                id="new-custom-role-name"
                ref={newRoleNameRef}
                value={newRoleName}
                onChange={(event) => setNewRoleName(event.target.value)}
                placeholder="Architect without billing"
                className="mt-1"
              />
            </div>
            <div>
              <label htmlFor="start-from-role" className={cn("font-medium text-al-text-secondary", OPERATOR_TYPOGRAPHY.label)}>
                Start from role
              </label>
              <Select value={startFromRole} onValueChange={(value) => setStartFromRole(value as typeof startFromRole)}>
                <SelectTrigger id="start-from-role" className="mt-1" aria-label="Start from role">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CUSTOM_ROLE_START_FROM_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button
              type="button"
              onClick={() => requestCreateCustomRole(newRoleName, permissionsForStartFrom(startFromRole))}
              disabled={createBlockedReason !== null}
            >
              Create custom role
            </Button>
          </div>
          {createBlockedReason !== null ? (
            <p
              className={cn("m-0 mt-2 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}
              data-testid="settings-roles-create-readiness"
            >
              {createBlockedReason}
            </p>
          ) : null}
        </div>
        )}

        <SettingsRolesMatrixTable
          readOnly={readOnly}
          columns={columns}
          baseline={matrix.baseline}
          collapsedGroups={collapsedGroups}
          savingRoleId={savingRoleId}
          onToggleGroupCollapsed={toggleGroupCollapsed}
          onTogglePermission={togglePermission}
          onRequestSaveRole={requestSaveRole}
          onDiscardRoleEdits={discardRoleEdits}
          onPrefillCloneOfRole={prefillCloneOfRole}
        />

        <p
          className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.micro)}
          data-testid="settings-roles-matrix-legend"
        >
          {ROLES_MATRIX_LEGEND_COPY}
        </p>

        <AlertDialog open={pendingHighRisk !== null} onOpenChange={(open) => !open && setPendingHighRisk(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Grant high-risk permissions?</AlertDialogTitle>
              <AlertDialogDescription asChild>
                <div className="space-y-2">
                  <p className={cn("m-0", OPERATOR_TYPOGRAPHY.body)}>
                    This role includes sensitive workspace controls. Confirm only if the assignee should manage billing,
                    tenants, identity providers, or the admin console.
                  </p>
                  {pendingHighRiskLabels.length > 0 ? (
                    <ul className={cn("m-0 list-disc space-y-1 pl-5", OPERATOR_TYPOGRAPHY.body)}>
                      {pendingHighRiskLabels.map((label) => (
                        <li key={label}>{label}</li>
                      ))}
                    </ul>
                  ) : null}
                </div>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={() => void confirmHighRiskAction()}>
                {pendingHighRisk?.kind === "save" ? "Save role" : "Create custom role"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
        <LivelihoodDocumentGuardDialog
          open={documentGuards.dialogOpen}
          message={documentGuards.dialogMessage}
          onConfirmLeave={documentGuards.confirmLeave}
          onCancelLeave={documentGuards.cancelLeave}
        />
      </section>
  );
}
