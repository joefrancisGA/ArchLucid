"use client";

import { ChevronDown } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useCallback, useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SettingsRolesMatrixConfirmDialog } from "./SettingsRolesMatrixConfirmDialog";
import { SeverityTag } from "@/components/ui/severity-tag";
import { OperatorEmptyState } from "@/components/operator/OperatorShellMessage";
import { GOVERNANCE_AUDIT_PATH } from "@/lib/governance/governance-route-paths";
import { mergeRegistrationScopeForProxy } from "@/lib/proxy-fetch-registration-scope";
import { roleClaimCaption, roleDisplayLabel } from "@/lib/role-display-labels";
import { SETTINGS_USERS_USERS_TAB_PATH } from "@/lib/settings-admin-route-paths";
import { showError, showSuccess } from "@/lib/toast";
import { OPERATOR_NAV_GROUP_LABEL, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

import { CUSTOM_ROLE_PERMISSION_GROUPS, ALL_MATRIX_PERMISSION_IDS } from "./custom-role-permission-groups";
import {
  baselinePermissionsByKey,
  clonedRoleName,
  countDirtyPermissions,
  dirtyRoles,
  type DraftRole,
  dirtyRoleDisplayNames,
  hasUnsavedRoleEdits,
  isRoleDirty,
  mergeUnsavedRoleEdits,
  newlyGrantedHighRiskPermissionIds,
  newlyGrantedHighRiskPermissionIdsFromList,
  permissionChangesForRole,
  restoreRoleToBaseline,
  roleMatrixKey,
  type RolePermissionBaseline,
  toggleRolePermission,
  totalUnsavedPermissionChanges,
} from "./custom-role-draft-state";
import { type CustomRoleFailureKind, customRoleFailureCopy } from "./custom-role-failure-copy";
import { CustomRoleRequestError, customRoleRequestStatus } from "./custom-role-request-error";
import {
  formatRoleAssignmentDisplay,
} from "./roles-matrix-assignment-counts";
import {
  EMPTY_ROLES_MATRIX_PERMISSION_FILTER,
  filterPermissionGroupsForMatrix,
} from "./roles-matrix-permission-filter";
import {
  CUSTOM_ROLE_START_FROM_OPTIONS,
  type CustomRoleStartFromValue,
  HIGH_RISK_PERMISSION_IDS,
  permissionLabelsFromIds,
  ROLES_MATRIX_CLONE_VS_CREATE_COPY,
  ROLES_MATRIX_CONFIRMATION_DIALOG,
  ROLES_MATRIX_CREATE_READINESS_COPY,
  ROLES_MATRIX_HELPER_COPY,
  ROLES_MATRIX_PERMISSION_LEGEND,
  formatRoleLastUpdated,
  sortMatrixRoles,
  unsavedRoleEditsNotice,
} from "./roles-matrix-constants";

function showCustomRoleFailure(kind: CustomRoleFailureKind, error: unknown): void {
  const copy = customRoleFailureCopy(kind, customRoleRequestStatus(error));

  showError(copy.title, copy.description);
}

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

type PendingRoleConfirmation =
  | { kind: "save"; role: DraftRole }
  | { kind: "create"; name: string; permissions: string[] }
  | { kind: "clone"; source: DraftRole; permissions: string[] };

type SettingsRolesMatrixSectionProps = {
  readonly assignmentCountsByRole?: ReadonlyMap<string, number>;
  readonly assignmentCountsReliable?: boolean;
};

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
        <Checkbox
          checked={checked}
          aria-label={`${permissionLabel} for ${roleName}`}
          className="accent-teal-700 dark:accent-teal-300"
          onCheckedChange={() => onToggle()}
        />
      </div>
    );
  }

  return (
    <div className="flex h-10 items-center justify-center px-2">
      <span
        className={cn(
          "inline-flex min-w-[2rem] items-center justify-center rounded-sm px-1 text-base font-semibold leading-none",
          allowed ? "text-teal-700 dark:text-teal-300" : "text-neutral-600 dark:text-neutral-400",
        )}
        aria-label={`${permissionLabel} for ${roleName}: ${allowed ? ROLES_MATRIX_PERMISSION_LEGEND.allowed : ROLES_MATRIX_PERMISSION_LEGEND.denied}`}
      >
        <span aria-hidden="true">{allowed ? "✓" : "—"}</span>
        <span className="sr-only">{allowed ? ROLES_MATRIX_PERMISSION_LEGEND.allowed : ROLES_MATRIX_PERMISSION_LEGEND.denied}</span>
      </span>
    </div>
  );
}

function RolesMatrixPermissionLegend() {
  return (
    <div
      className={cn("flex flex-wrap items-center gap-x-4 gap-y-1 text-al-text-secondary", OPERATOR_TYPOGRAPHY.micro)}
      data-testid="settings-roles-matrix-legend"
      aria-label="Permission matrix legend"
    >
      <span className="inline-flex items-center gap-1.5">
        <span className="font-semibold text-teal-700 dark:text-teal-300" aria-hidden="true">
          ✓
        </span>
        {ROLES_MATRIX_PERMISSION_LEGEND.allowed}
      </span>
      <span className="inline-flex items-center gap-1.5">
        <span className="font-semibold text-neutral-600 dark:text-neutral-400" aria-hidden="true">
          —
        </span>
        {ROLES_MATRIX_PERMISSION_LEGEND.denied}
      </span>
    </div>
  );
}

type RolesMatrixCommandBarProps = {
  readonly dirtyRoleList: readonly DraftRole[];
  readonly changeCount: number;
  readonly savingRoleId: string | null;
  readonly onSaveRole: (role: DraftRole) => void;
  readonly onDiscardRole: (roleKey: string) => void;
};

function RolesMatrixCommandBar(props: RolesMatrixCommandBarProps) {
  const { dirtyRoleList, changeCount, savingRoleId, onSaveRole, onDiscardRole } = props;

  if (dirtyRoleList.length === 0)
    return null;

  const roleNames = dirtyRoleList.map((role) => roleDisplayLabel(role.name)).join(", ");

  return (
    <div
      data-testid="settings-roles-command-bar"
      className={cn(
        "sticky top-0 z-40 flex flex-wrap items-center justify-between gap-3 rounded-md border border-amber-300 bg-amber-50 px-3 py-2 dark:border-amber-700/60 dark:bg-amber-950/40",
      )}
      role="status"
    >
      <p className={cn("m-0 text-amber-900 dark:text-amber-100", OPERATOR_TYPOGRAPHY.body)}>
        {changeCount === 1
          ? `1 unsaved permission change on ${roleNames}.`
          : `${changeCount} unsaved permission changes on ${roleNames}.`}
      </p>
      <div className="flex flex-wrap items-center gap-2">
        {dirtyRoleList.map((role) => {
          const roleKey = roleMatrixKey(role);
          const displayName = roleDisplayLabel(role.name);

          return (
            <div key={roleKey} className="flex items-center gap-1">
              <Button
                type="button"
                size="sm"
                variant="secondary"
                disabled={savingRoleId === role.id}
                aria-label={`Save ${displayName} role`}
                onClick={() => onSaveRole(role)}
              >
                {savingRoleId === role.id ? "Saving…" : `Save ${displayName}`}
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                aria-label={`Discard unsaved changes to ${displayName}`}
                onClick={() => onDiscardRole(roleKey)}
              >
                Discard
              </Button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function SettingsRolesMatrixSection(props: SettingsRolesMatrixSectionProps) {
  const assignmentCountsReliable = props.assignmentCountsReliable ?? true;
  const [matrix, setMatrix] = useState<RoleMatrixState>(EMPTY_MATRIX_STATE);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [savingRoleId, setSavingRoleId] = useState<string | null>(null);
  const [newRoleName, setNewRoleName] = useState("");
  const [startFromRole, setStartFromRole] = useState<CustomRoleStartFromValue>("Operator");
  const [collapsedGroups, setCollapsedGroups] = useState<ReadonlySet<string>>(() => new Set());
  const [pendingConfirmation, setPendingConfirmation] = useState<PendingRoleConfirmation | null>(null);
  const [permissionFilter, setPermissionFilter] = useState(EMPTY_ROLES_MATRIX_PERMISSION_FILTER);
  const roles = matrix.roles;
  const trimmedRoleName = newRoleName.trim();
  const canCreateRole = trimmedRoleName.length > 0;

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
    setLoadError(false);

    try {
      const rows = await fetchRoles();
      const reloaded: DraftRole[] = rows.map((row) => ({
        id: row.id,
        name: row.name,
        isSystem: row.isSystem,
        permissions: new Set(row.permissions),
        updatedUtc: row.updatedUtc,
      }));

      // Creating or cloning a role refreshes the whole matrix; unsaved edits on other columns survive it.
      setMatrix((current) => ({
        roles: mergeUnsavedRoleEdits(reloaded, current.roles, current.baseline),
        baseline: baselinePermissionsByKey(reloaded),
      }));
    } catch (error) {
      setLoadError(true);
      showCustomRoleFailure("load", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const columns = useMemo(() => sortMatrixRoles(roles), [roles]);
  const unsavedRoleNames = useMemo(() => dirtyRoleDisplayNames(roles, matrix.baseline), [matrix.baseline, roles]);
  const dirtyRoleList = useMemo(() => dirtyRoles(roles, matrix.baseline), [matrix.baseline, roles]);
  const unsavedChangeCount = useMemo(() => totalUnsavedPermissionChanges(roles, matrix.baseline), [matrix.baseline, roles]);
  const hasUnsavedEdits = hasUnsavedRoleEdits(roles, matrix.baseline);
  const visiblePermissionGroups = useMemo(
    () => filterPermissionGroupsForMatrix(CUSTOM_ROLE_PERMISSION_GROUPS, columns, permissionFilter),
    [columns, permissionFilter],
  );

  useEffect(() => {
    if (!hasUnsavedEdits)
      return;

    // Browser-level guard only: the App Router has no navigation-blocking API, so the command bar
    // and notice above the matrix remain the in-app signal for unsaved edits.
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
          body: JSON.stringify({
            name: role.name,
            permissions: ALL_MATRIX_PERMISSION_IDS.filter((permission) => role.permissions.has(permission)),
          }),
        }),
      );

      if (!res.ok)
        throw new CustomRoleRequestError(res.status);

      showSuccess(`Saved role "${roleDisplayLabel(role.name)}".`);
      await load();
    } catch (error) {
      showCustomRoleFailure("save", error);
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
      showCustomRoleFailure("create", error);
    }
  }

  function requestSaveRole(role: DraftRole) {
    const changes = permissionChangesForRole(role, matrix.baseline);

    if (changes.added.length === 0 && changes.removed.length === 0)
      return;

    setPendingConfirmation({ kind: "save", role });
  }

  function permissionsForStartFrom(startFrom: CustomRoleStartFromValue): string[] {
    if (startFrom === "Empty")
      return [];

    const source = roles.find((role) => role.isSystem && role.name === startFrom);

    if (!source)
      return [];

    return ALL_MATRIX_PERMISSION_IDS.filter((permission) => source.permissions.has(permission));
  }

  function requestCreateCustomRole(name: string, permissions: string[]) {
    const trimmed = name.trim();

    if (!trimmed)
      return;

    setPendingConfirmation({ kind: "create", name: trimmed, permissions });
  }

  function requestCloneRole(source: DraftRole) {
    const permissions = ALL_MATRIX_PERMISSION_IDS.filter((permission) => source.permissions.has(permission));

    setPendingConfirmation({ kind: "clone", source, permissions });
  }

  async function confirmPendingAction() {
    if (!pendingConfirmation)
      return;

    const action = pendingConfirmation;
    setPendingConfirmation(null);

    if (action.kind === "save") {
      await persistRole(action.role);
      return;
    }

    if (action.kind === "create") {
      await persistCreate(action.name, action.permissions);
      return;
    }

    await persistCreate(clonedRoleName(action.source), action.permissions);
  }

  const confirmationCopy = useMemo(() => {
    if (!pendingConfirmation)
      return null;

    if (pendingConfirmation.kind === "save") {
      const changes = permissionChangesForRole(pendingConfirmation.role, matrix.baseline);
      const highRiskAdded = newlyGrantedHighRiskPermissionIds(pendingConfirmation.role, matrix.baseline);

      return {
        title: ROLES_MATRIX_CONFIRMATION_DIALOG.saveTitle,
        primaryLabel: ROLES_MATRIX_CONFIRMATION_DIALOG.savePrimary,
        addedLabels: permissionLabelsFromIds(changes.added, permissionLabelsById),
        removedLabels: permissionLabelsFromIds(changes.removed, permissionLabelsById),
        highRiskLabels: permissionLabelsFromIds(highRiskAdded, permissionLabelsById),
      };
    }

    if (pendingConfirmation.kind === "create") {
      const highRiskAdded = newlyGrantedHighRiskPermissionIdsFromList(pendingConfirmation.permissions);

      return {
        title: ROLES_MATRIX_CONFIRMATION_DIALOG.createTitle,
        primaryLabel: ROLES_MATRIX_CONFIRMATION_DIALOG.createPrimary,
        addedLabels: [],
        removedLabels: [],
        highRiskLabels: permissionLabelsFromIds(highRiskAdded, permissionLabelsById),
      };
    }

    const highRiskAdded = newlyGrantedHighRiskPermissionIdsFromList(pendingConfirmation.permissions);

    return {
      title: ROLES_MATRIX_CONFIRMATION_DIALOG.cloneTitle,
      primaryLabel: ROLES_MATRIX_CONFIRMATION_DIALOG.clonePrimary,
      addedLabels: [],
      removedLabels: [],
      highRiskLabels: permissionLabelsFromIds(highRiskAdded, permissionLabelsById),
    };
  }, [matrix.baseline, pendingConfirmation, permissionLabelsById]);

  if (loading)
    return <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>Loading role matrix…</p>;

  if (loadError) {
    return (
      <section data-testid="settings-roles-matrix" className="space-y-4">
        <OperatorEmptyState
          title="Role matrix unavailable"
          description="Custom roles and permissions could not be loaded. Refresh to try again."
        />
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="secondary" size="sm" onClick={() => void load()}>
            Refresh
          </Button>
        </div>
      </section>
    );
  }

  return (
    <section data-testid="settings-roles-matrix" className="space-y-6">
        <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>{ROLES_MATRIX_HELPER_COPY}</p>

        {hasUnsavedEdits ? (
          <p
            data-testid="settings-roles-unsaved-notice"
            className={cn(
              "m-0 rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-amber-900 dark:border-amber-700/60 dark:bg-amber-950/40 dark:text-amber-100",
              OPERATOR_TYPOGRAPHY.body,
            )}
          >
            {unsavedRoleEditsNotice(unsavedRoleNames, unsavedChangeCount)}
          </p>
        ) : null}

        <RolesMatrixCommandBar
          dirtyRoleList={dirtyRoleList}
          changeCount={unsavedChangeCount}
          savingRoleId={savingRoleId}
          onSaveRole={requestSaveRole}
          onDiscardRole={discardRoleEdits}
        />

        <div className="rounded-md border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-950">
          <h3 className={cn("m-0 font-semibold text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}>Create custom role</h3>
          <p className={cn("m-0 mt-1 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>{ROLES_MATRIX_CLONE_VS_CREATE_COPY}</p>
          <div className="mt-4 grid gap-3 md:grid-cols-[minmax(12rem,1fr)_minmax(12rem,1fr)_auto] md:items-end">
            <div>
              <label htmlFor="new-custom-role-name" className={cn("font-medium text-al-text-secondary", OPERATOR_TYPOGRAPHY.label)}>
                Role name
              </label>
              <Input
                id="new-custom-role-name"
                value={newRoleName}
                onChange={(event) => setNewRoleName(event.target.value)}
                placeholder="Architect without billing"
                className="mt-1 placeholder:text-neutral-500"
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
            <div className="space-y-1">
              <Button
                type="button"
                variant="default"
                onClick={() => requestCreateCustomRole(newRoleName, permissionsForStartFrom(startFromRole))}
                disabled={!canCreateRole}
              >
                Create custom role
              </Button>
              {!canCreateRole ? (
                <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.micro)} data-testid="settings-roles-create-readiness">
                  {ROLES_MATRIX_CREATE_READINESS_COPY}
                </p>
              ) : null}
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <RolesMatrixPermissionLegend />
            <div className="flex min-w-[12rem] flex-1 flex-wrap items-center gap-2 sm:max-w-md">
              <Input
                value={permissionFilter.searchQuery}
                onChange={(event) => {
                  setPermissionFilter((current) => ({ ...current, searchQuery: event.target.value }));
                }}
                placeholder="Filter permissions"
                aria-label="Filter permissions"
                className="min-w-[10rem] flex-1"
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              size="sm"
              variant={permissionFilter.highRiskOnly ? "secondary" : "outline"}
              aria-pressed={permissionFilter.highRiskOnly}
              onClick={() => {
                setPermissionFilter((current) => ({ ...current, highRiskOnly: !current.highRiskOnly }));
              }}
            >
              High-risk only
            </Button>
            <Button
              type="button"
              size="sm"
              variant={permissionFilter.differencesOnly ? "secondary" : "outline"}
              aria-pressed={permissionFilter.differencesOnly}
              onClick={() => {
                setPermissionFilter((current) => ({ ...current, differencesOnly: !current.differencesOnly }));
              }}
            >
              Differences only
            </Button>
          </div>

          <div className="max-h-[70vh] overflow-auto rounded-md border border-neutral-200 dark:border-neutral-800">
            <table
              aria-label="Role permissions matrix"
              className={cn("w-full min-w-[48rem] table-auto border-collapse text-left", OPERATOR_TYPOGRAPHY.body)}
            >
              <thead className="sticky top-0 z-20 bg-neutral-50 shadow-sm dark:bg-neutral-900/95">
                <tr>
                  <th
                    scope="col"
                    className={cn(
                      "sticky left-0 top-0 z-30 min-w-[14rem] border-b border-neutral-200 bg-neutral-50 px-3 py-3 text-left font-semibold text-al-text-primary dark:border-neutral-800 dark:bg-neutral-900/95",
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
                    const assignmentCount = props.assignmentCountsByRole?.get(role.name) ?? 0;
                    const assignmentDisplay = formatRoleAssignmentDisplay(assignmentCount, assignmentCountsReliable);
                    const lastUpdated = formatRoleLastUpdated(role.updatedUtc);

                    return (
                      <th
                        key={roleKey}
                        scope="col"
                        className={cn(
                          "min-w-[8rem] border-b border-neutral-200 px-2 py-3 text-center align-top font-semibold text-al-text-primary dark:border-neutral-800",
                          OPERATOR_TYPOGRAPHY.body,
                        )}
                      >
                        <div className="flex min-h-[5.5rem] flex-col items-center justify-start gap-1">
                          <span className="line-clamp-2 text-center">{displayName}</span>
                          <span className={cn("font-normal text-al-text-secondary", OPERATOR_TYPOGRAPHY.micro)}>
                            {role.isSystem ? "Built-in role" : "Custom role"}
                          </span>
                          {claimCaption !== null ? (
                            <span className={cn("font-normal text-al-text-secondary", OPERATOR_TYPOGRAPHY.micro)}>
                              {claimCaption}
                            </span>
                          ) : null}
                          {assignmentDisplay.linkable ? (
                            <Link
                              href={SETTINGS_USERS_USERS_TAB_PATH}
                              className={cn("font-normal text-teal-700 underline underline-offset-2 dark:text-teal-300", OPERATOR_TYPOGRAPHY.micro)}
                            >
                              {assignmentDisplay.text}
                            </Link>
                          ) : (
                            <span className={cn("font-normal text-al-text-secondary", OPERATOR_TYPOGRAPHY.micro)}>
                              {assignmentDisplay.text}
                            </span>
                          )}
                          {!role.isSystem && lastUpdated !== null ? (
                            <span className={cn("font-normal text-al-text-secondary", OPERATOR_TYPOGRAPHY.micro)}>
                              Last updated {lastUpdated}
                            </span>
                          ) : null}
                          {!role.isSystem ? (
                            <Link
                              href={GOVERNANCE_AUDIT_PATH}
                              className={cn("font-normal text-teal-700 underline underline-offset-2 dark:text-teal-300", OPERATOR_TYPOGRAPHY.micro)}
                            >
                              View audit trail
                            </Link>
                          ) : null}
                          {isDirty ? (
                            <span
                              data-testid={`settings-roles-unsaved-badge-${roleKey}`}
                              className={cn("font-medium text-amber-700 dark:text-amber-300", OPERATOR_TYPOGRAPHY.micro)}
                            >
                              Unsaved ({countDirtyPermissions(role, matrix.baseline)})
                            </span>
                          ) : null}
                          {role.isSystem ? (
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              className="h-7 px-2 text-xs"
                              onClick={() => requestCloneRole(role)}
                              aria-label={`Clone ${displayName} role`}
                            >
                              Clone
                            </Button>
                          ) : null}
                        </div>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {visiblePermissionGroups.length === 0 ? (
                  <tr>
                    <td
                      colSpan={columns.length + 1}
                      className="px-3 py-6 text-center text-al-text-secondary"
                    >
                      No permissions match the current filter.
                    </td>
                  </tr>
                ) : null}
                {visiblePermissionGroups.map((group) => {
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
                          <ChevronDown
                            className={cn("size-4 shrink-0 text-al-text-secondary transition-transform", !isCollapsed && "rotate-180")}
                            aria-hidden
                          />
                        </button>
                      </td>
                    </tr>,
                    ...(!isCollapsed
                      ? group.permissions.map((permission) => (
                          <tr
                            key={permission.id}
                            className="border-b border-neutral-200 hover:bg-neutral-50 dark:border-neutral-800 dark:hover:bg-neutral-900/50"
                          >
                            <th
                              scope="row"
                              className={cn(
                                "sticky left-0 z-10 border-r border-neutral-200 bg-white px-3 py-0 text-left font-normal text-al-text-primary dark:border-neutral-800 dark:bg-neutral-950",
                                OPERATOR_TYPOGRAPHY.body,
                              )}
                            >
                              <div className="flex flex-wrap items-center gap-2 py-2 pr-2">
                                <span>{permission.label}</span>
                                {HIGH_RISK_PERMISSION_IDS.has(permission.id) ? (
                                  <SeverityTag severity="High" kind="high" label="High risk" className="shrink-0" />
                                ) : null}
                              </div>
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

        <SettingsRolesMatrixConfirmDialog
          open={pendingConfirmation !== null}
          copy={confirmationCopy}
          onCancel={() => {
            setPendingConfirmation(null);
          }}
          onConfirm={() => {
            void confirmPendingAction();
          }}
        />
      </section>
  );
}
