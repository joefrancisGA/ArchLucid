"use client";

import { cn } from "@/lib/utils";
import { ChevronDown, ChevronRight } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

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
import { mergeRegistrationScopeForProxy } from "@/lib/proxy-fetch-registration-scope";
import { roleClaimCaption, roleDisplayLabel } from "@/lib/role-display-labels";
import { showError, showSuccess } from "@/lib/toast";
import { OPERATOR_NAV_GROUP_LABEL, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

import { CUSTOM_ROLE_PERMISSION_GROUPS } from "./custom-role-permission-groups";
import {
  baselinePermissionsByKey,
  clonedRoleName,
  type DraftRole,
  dirtyRoleDisplayNames,
  findSystemRoleByName,
  isRoleDirty,
  matrixPermissionList,
  mergeUnsavedRoleEdits,
  restoreRoleToBaseline,
  roleMatrixKey,
  type RolePermissionBaseline,
  toggleRolePermission,
  totalUnsavedPermissionChanges,
} from "./custom-role-draft-state";
import { type CustomRoleFailureCopy, customRoleFailureCopy } from "./custom-role-failure-copy";
import { CustomRoleRequestError, customRoleRequestStatus } from "./custom-role-request-error";
import {
  BUILTIN_ROLE_SUMMARIES,
  createCustomRoleBlockedReason,
  CUSTOM_ROLE_START_FROM_OPTIONS,
  type CustomRoleStartFromValue,
  hasHighRiskPermissions,
  highRiskPermissionLabels,
  ROLES_MATRIX_HELPER_COPY,
  ROLES_MATRIX_LEGEND_COPY,
  sortMatrixRoles,
  unsavedRoleEditsNotice,
} from "./roles-matrix-constants";

type CustomRoleDto = {
  id: string;
  name: string;
  description?: string | null;
  permissions: string[];
  isSystem: boolean;
  updatedUtc: string;
};

/** Role columns and their last-saved permissions move together so dirty state can never drift apart. */
type RoleMatrixState = {
  readonly roles: readonly DraftRole[];
  readonly baseline: RolePermissionBaseline;
};

const EMPTY_MATRIX_STATE: RoleMatrixState = { roles: [], baseline: new Map() };

type PendingHighRiskAction =
  | { kind: "create"; name: string; permissions: string[] }
  | { kind: "save"; role: DraftRole };

const ROLE_COLUMN_WIDTH = "7.5rem";
const PERMISSION_COLUMN_WIDTH = "14rem";

async function fetchRoles(): Promise<CustomRoleDto[]> {
  const res = await fetch("/api/proxy/v1/admin/roles", mergeRegistrationScopeForProxy({ headers: { Accept: "application/json" } }));

  if (!res.ok)
    throw new CustomRoleRequestError(res.status);

  return (await res.json()) as CustomRoleDto[];
}

function PermissionValue({
  allowed,
  roleName,
  permissionLabel,
  editable,
  checked,
  onToggle,
}: {
  allowed: boolean;
  roleName: string;
  permissionLabel: string;
  editable: boolean;
  checked: boolean;
  onToggle: () => void;
}) {
  if (editable) {
    return (
      <div className="flex h-10 items-center justify-center px-2">
        <input
          type="checkbox"
          checked={checked}
          aria-label={`${permissionLabel} for ${roleName}`}
          className="h-4 w-4"
          onChange={onToggle}
        />
      </div>
    );
  }

  return (
    <div className="flex h-10 items-center justify-center px-2">
      <span
        className={cn(
          "inline-flex min-w-[2rem] items-center justify-center rounded-sm px-1 text-base font-semibold leading-none",
          allowed ? "text-teal-700 dark:text-teal-300" : "text-neutral-400 dark:text-neutral-500",
        )}
        aria-label={`${permissionLabel} for ${roleName}: ${allowed ? "Allowed" : "Not allowed"}`}
      >
        <span aria-hidden="true">{allowed ? "✓" : "—"}</span>
        <span className="sr-only">{allowed ? "Allowed" : "Not allowed"}</span>
      </span>
    </div>
  );
}

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

export type SettingsRolesMatrixSectionProps = {
  readonly assignmentCountsByRole?: ReadonlyMap<string, number>;
  readonly assignmentCountsReliable?: boolean;
};

export function SettingsRolesMatrixSection(_props: SettingsRolesMatrixSectionProps = {}) {
  const [matrix, setMatrix] = useState<RoleMatrixState>(EMPTY_MATRIX_STATE);
  const [loading, setLoading] = useState(true);
  const [savingRoleId, setSavingRoleId] = useState<string | null>(null);
  const [newRoleName, setNewRoleName] = useState("");
  const [startFromRole, setStartFromRole] = useState<CustomRoleStartFromValue>("Operator");
  const [collapsedGroups, setCollapsedGroups] = useState<ReadonlySet<string>>(() => new Set());
  const [pendingHighRisk, setPendingHighRisk] = useState<PendingHighRiskAction | null>(null);
  const [loadFailure, setLoadFailure] = useState<CustomRoleFailureCopy | null>(null);
  const newRoleNameRef = useRef<HTMLInputElement | null>(null);
  const roles = matrix.roles;

  const permissionLabelsById = useMemo(() => {
    const labels = new Map<string, string>();

    for (const group of CUSTOM_ROLE_PERMISSION_GROUPS) {
      for (const permission of group.permissions)
        labels.set(permission.id, permission.label);
    }

    return labels;
  }, []);

  const load = useCallback(async () => {
    setLoading(true);

    try {
      const rows = await fetchRoles();
      const reloaded: DraftRole[] = rows.map((row) => ({
        id: row.id,
        name: row.name,
        description: row.description ?? null,
        isSystem: row.isSystem,
        permissions: new Set(row.permissions),
      }));

      // Creating a role refreshes the whole matrix; unsaved edits on other columns survive it.
      setMatrix((current) => ({
        roles: mergeUnsavedRoleEdits(reloaded, current.roles, current.baseline),
        baseline: baselinePermissionsByKey(reloaded),
      }));
      setLoadFailure(null);
    } catch (error) {
      // Surfaced inline rather than as a toast: without columns the matrix is unusable until retried.
      setLoadFailure(customRoleFailureCopy("load", customRoleRequestStatus(error)));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const columns = useMemo(() => sortMatrixRoles(roles), [roles]);
  const unsavedRoleNames = useMemo(() => dirtyRoleDisplayNames(roles, matrix.baseline), [matrix.baseline, roles]);
  const unsavedChangeCount = useMemo(() => totalUnsavedPermissionChanges(roles, matrix.baseline), [matrix.baseline, roles]);
  const hasUnsavedEdits = unsavedRoleNames.length > 0;

  useEffect(() => {
    if (!hasUnsavedEdits)
      return;

    // Browser-level guard only: the App Router has no navigation-blocking API, so the per-column
    // badge and the notice above the matrix remain the in-app signal for unsaved edits.
    const warnBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };

    window.addEventListener("beforeunload", warnBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", warnBeforeUnload);
    };
  }, [hasUnsavedEdits]);

  function togglePermission(roleKey: string, permissionId: string) {
    setMatrix((current) => ({ ...current, roles: toggleRolePermission(current.roles, roleKey, permissionId) }));
  }

  function discardRoleEdits(roleKey: string) {
    setMatrix((current) => ({ ...current, roles: restoreRoleToBaseline(current.roles, roleKey, current.baseline) }));
  }

  function toggleGroupCollapsed(area: string) {
    setCollapsedGroups((prev) => {
      const next = new Set(prev);

      if (next.has(area))
        next.delete(area);
      else
        next.add(area);

      return next;
    });
  }

  async function persistRole(role: DraftRole) {
    if (role.isSystem || !role.id)
      return;

    setSavingRoleId(role.id);

    try {
      const res = await fetch(
        `/api/proxy/v1/admin/roles/${encodeURIComponent(role.id)}`,
        mergeRegistrationScopeForProxy({
          method: "PUT",
          headers: { Accept: "application/json", "Content-Type": "application/json" },
          // Description is echoed back so a permission-only save cannot blank it.
          body: JSON.stringify({
            name: role.name,
            description: role.description ?? null,
            permissions: matrixPermissionList(role.permissions),
          }),
        }),
      );

      if (!res.ok)
        throw new CustomRoleRequestError(res.status);

      showSuccess(`Saved role "${role.name}".`);
      await load();
    } catch (error) {
      const copy = customRoleFailureCopy("save", customRoleRequestStatus(error));
      showError(copy.title, copy.description);
    } finally {
      setSavingRoleId(null);
    }
  }

  async function persistCreate(name: string, permissions: string[]) {
    try {
      const res = await fetch(
        "/api/proxy/v1/admin/roles",
        mergeRegistrationScopeForProxy({
          method: "POST",
          headers: { Accept: "application/json", "Content-Type": "application/json" },
          body: JSON.stringify({ name, permissions }),
        }),
      );

      if (!res.ok)
        throw new CustomRoleRequestError(res.status);

      showSuccess(`Created custom role "${name}".`);
      setNewRoleName("");
      setStartFromRole("Operator");
      await load();
    } catch (error) {
      const copy = customRoleFailureCopy("create", customRoleRequestStatus(error));
      showError(copy.title, copy.description);
    }
  }

  function requestSaveRole(role: DraftRole) {
    if (hasHighRiskPermissions(role.permissions)) {
      setPendingHighRisk({ kind: "save", role });
      return;
    }

    void persistRole(role);
  }

  function permissionsForStartFrom(startFrom: CustomRoleStartFromValue): string[] {
    if (startFrom === "Empty")
      return [];

    const source = findSystemRoleByName(roles, startFrom);

    if (source === null)
      return [];

    return matrixPermissionList(source.permissions);
  }

  function requestCreateCustomRole(name: string, permissions: string[]) {
    const trimmed = name.trim();

    if (trimmed.length === 0)
      return;

    if (hasHighRiskPermissions(new Set(permissions))) {
      setPendingHighRisk({ kind: "create", name: trimmed, permissions });
      return;
    }

    void persistCreate(trimmed, permissions);
  }

  /**
   * Clone prefills the create form instead of writing immediately, so the administrator names the role
   * and reviews its seeded permissions before anything is persisted.
   */
  function prefillCloneOfRole(source: DraftRole) {
    setNewRoleName(clonedRoleName(source));
    // Clone is rendered on built-in columns only, and the API seeds exactly the four roles in
    // BUILTIN_ROLE_ORDER, so the source name is always one of the start-from option values.
    setStartFromRole(source.name as CustomRoleStartFromValue);
    newRoleNameRef.current?.focus();
  }

  async function confirmHighRiskAction() {
    if (!pendingHighRisk)
      return;

    const action = pendingHighRisk;
    setPendingHighRisk(null);

    if (action.kind === "save") {
      await persistRole(action.role);

      return;
    }

    await persistCreate(action.name, action.permissions);
  }

  const pendingHighRiskLabels = useMemo(() => {
    if (pendingHighRisk === null)
      return [];

    if (pendingHighRisk.kind === "save")
      return highRiskPermissionLabels(pendingHighRisk.role.permissions, permissionLabelsById);

    return highRiskPermissionLabels(new Set(pendingHighRisk.permissions), permissionLabelsById);
  }, [pendingHighRisk, permissionLabelsById]);

  const trimmedNewRoleName = newRoleName.trim();
  const createBlockedReason = createCustomRoleBlockedReason({
    hasName: trimmedNewRoleName.length > 0,
    startFromResolvable: startFromRole === "Empty" || findSystemRoleByName(roles, startFromRole) !== null,
    startFromLabel: roleDisplayLabel(startFromRole),
  });

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
            {unsavedRoleEditsNotice(unsavedRoleNames, unsavedChangeCount)}
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
              <Select value={startFromRole} onValueChange={(value) => setStartFromRole(value as CustomRoleStartFromValue)}>
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

        <div className="rounded-md border border-neutral-200 dark:border-neutral-800">
          <div className="max-h-[70vh] overflow-auto">
            <table className={cn("w-full min-w-[48rem] table-fixed border-collapse text-left", OPERATOR_TYPOGRAPHY.body)}>
              <colgroup>
                <col style={{ width: PERMISSION_COLUMN_WIDTH }} />
                {columns.map((role) => (
                  <col key={roleMatrixKey(role)} style={{ width: ROLE_COLUMN_WIDTH }} />
                ))}
              </colgroup>
              <thead className="sticky top-0 z-30 bg-neutral-50 shadow-sm dark:bg-neutral-900/95">
                <tr>
                  <th
                    scope="col"
                    className={cn(
                      "sticky left-0 z-40 border-b border-neutral-200 bg-neutral-50 px-3 py-3 text-left font-semibold text-al-text-primary dark:border-neutral-800 dark:bg-neutral-900/95",
                      OPERATOR_TYPOGRAPHY.body,
                    )}
                  >
                    Permission
                  </th>
                  {columns.map((role) => {
                    const roleKey = roleMatrixKey(role);
                    const displayName = roleDisplayLabel(role.name);
                    const claimCaption = roleClaimCaption(role.name);
                    const isDirty = isRoleDirty(role, matrix.baseline);

                    return (
                      <th
                        key={roleKey}
                        scope="col"
                        className={cn(
                          "border-b border-neutral-200 px-2 py-3 text-center align-top font-semibold text-al-text-primary dark:border-neutral-800",
                          OPERATOR_TYPOGRAPHY.body,
                        )}
                      >
                        <div className="flex min-h-[4.5rem] flex-col items-center justify-start gap-1">
                          {/* Descriptions live in the summary cards above; a hover-only tooltip here was
                              unreachable by keyboard. `title` only reveals names clipped by line-clamp. */}
                          <span className="line-clamp-2 text-center" title={displayName}>
                            {displayName}
                          </span>
                          <span className={cn("font-normal text-al-text-secondary", OPERATOR_TYPOGRAPHY.micro)}>
                            {role.isSystem ? "Built-in role" : "Custom role"}
                          </span>
                          {claimCaption !== null ? (
                            <span className={cn("font-normal text-al-text-secondary", OPERATOR_TYPOGRAPHY.micro)}>
                              {claimCaption}
                            </span>
                          ) : null}
                          {isDirty ? (
                            <span
                              data-testid={`settings-roles-unsaved-badge-${roleKey}`}
                              className={cn("font-medium text-amber-700 dark:text-amber-300", OPERATOR_TYPOGRAPHY.micro)}
                            >
                              Unsaved
                            </span>
                          ) : null}
                          {role.isSystem ? (
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              className="h-7 px-2 text-xs"
                              onClick={() => prefillCloneOfRole(role)}
                              aria-label={`Clone ${displayName} role into the create form`}
                            >
                              Clone
                            </Button>
                          ) : (
                            <div className="flex flex-col items-center gap-1">
                              <Button
                                type="button"
                                size="sm"
                                variant="secondary"
                                className="h-7 px-2 text-xs"
                                disabled={savingRoleId === role.id || !isDirty}
                                aria-label={`Save ${displayName} role`}
                                onClick={() => requestSaveRole(role)}
                              >
                                {savingRoleId === role.id ? "Saving…" : "Save"}
                              </Button>
                              {isDirty ? (
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="outline"
                                  className="h-7 px-2 text-xs"
                                  aria-label={`Discard unsaved changes to ${displayName}`}
                                  onClick={() => discardRoleEdits(roleKey)}
                                >
                                  Discard
                                </Button>
                              ) : null}
                            </div>
                          )}
                        </div>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {CUSTOM_ROLE_PERMISSION_GROUPS.map((group) => {
                  const isCollapsed = collapsedGroups.has(group.area);

                  return [
                    <tr key={`group-${group.area}`} className="bg-neutral-100/90 dark:bg-neutral-900/60">
                      <td
                        colSpan={columns.length + 1}
                        className="sticky left-0 z-10 border-y border-neutral-200 bg-neutral-100/95 px-3 py-2 dark:border-neutral-800 dark:bg-neutral-900/80"
                      >
                        <button
                          type="button"
                          className={cn(
                            "flex w-full items-center justify-between gap-2 text-left font-semibold uppercase tracking-wide text-al-text-primary",
                            OPERATOR_NAV_GROUP_LABEL,
                          )}
                          aria-expanded={!isCollapsed}
                          aria-label={`${group.area} permissions`}
                          onClick={() => toggleGroupCollapsed(group.area)}
                        >
                          <span>{group.area}</span>
                          {isCollapsed ? (
                            <ChevronRight aria-hidden="true" className="h-4 w-4 shrink-0 text-al-text-secondary" />
                          ) : (
                            <ChevronDown aria-hidden="true" className="h-4 w-4 shrink-0 text-al-text-secondary" />
                          )}
                        </button>
                      </td>
                    </tr>,
                    ...(!isCollapsed
                      ? group.permissions.map((permission) => (
                          <tr key={permission.id} className="border-b border-neutral-100 dark:border-neutral-800">
                            <th
                              scope="row"
                              className={cn(
                                "sticky left-0 z-10 border-r border-neutral-100 bg-white px-3 py-0 text-left font-normal text-al-text-primary dark:border-neutral-800 dark:bg-neutral-950",
                                OPERATOR_TYPOGRAPHY.body,
                              )}
                            >
                              <div className="py-2 pr-2">{permission.label}</div>
                            </th>
                            {columns.map((role) => (
                              <td key={`${roleMatrixKey(role)}:${permission.id}`} className="p-0 text-center align-middle">
                                <PermissionValue
                                  allowed={role.permissions.has(permission.id)}
                                  roleName={roleDisplayLabel(role.name)}
                                  permissionLabel={permission.label}
                                  editable={!role.isSystem}
                                  checked={role.permissions.has(permission.id)}
                                  onToggle={() => togglePermission(roleMatrixKey(role), permission.id)}
                                />
                              </td>
                            ))}
                          </tr>
                        ))
                      : []),
                  ];
                })}
              </tbody>
            </table>
          </div>
        </div>

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
      </section>
  );
}
