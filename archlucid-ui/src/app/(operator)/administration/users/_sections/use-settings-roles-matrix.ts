"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { mergeRegistrationScopeForProxy } from "@/lib/proxy-fetch-registration-scope";
import { roleDisplayLabel } from "@/lib/role-display-labels";
import { showError, showSuccess } from "@/lib/toast";

import { CUSTOM_ROLE_PERMISSION_GROUPS, ALL_MATRIX_PERMISSION_IDS } from "./custom-role-permission-groups";
import {
  baselinePermissionsByKey,
  clonedRoleName,
  dirtyRoles,
  type DraftRole,
  dirtyRoleDisplayNames,
  hasUnsavedRoleEdits,
  mergeUnsavedRoleEdits,
  newlyGrantedHighRiskPermissionIds,
  newlyGrantedHighRiskPermissionIdsFromList,
  permissionChangesForRole,
  restoreRoleToBaseline,
  type RolePermissionBaseline,
  toggleRolePermission,
  totalUnsavedPermissionChanges,
} from "./custom-role-draft-state";
import { type CustomRoleFailureKind, customRoleFailureCopy } from "./custom-role-failure-copy";
import { CustomRoleRequestError, customRoleRequestStatus } from "./custom-role-request-error";
import {
  EMPTY_ROLES_MATRIX_PERMISSION_FILTER,
  filterPermissionGroupsForMatrix,
} from "./roles-matrix-permission-filter";
import {
  type CustomRoleStartFromValue,
  permissionLabelsFromIds,
  ROLES_MATRIX_CONFIRMATION_DIALOG,
  sortMatrixRoles,
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

export type SettingsRolesMatrixSectionProps = {
  readonly assignmentCountsByRole?: ReadonlyMap<string, number>;
  readonly assignmentCountsReliable?: boolean;
};

async function fetchRoles(): Promise<CustomRoleDto[]> {
  const res = await fetch("/api/proxy/v1/admin/roles", mergeRegistrationScopeForProxy({ headers: { Accept: "application/json" } }));

  if (!res.ok)
    throw new CustomRoleRequestError(res.status);

  return (await res.json()) as CustomRoleDto[];
}

export function useSettingsRolesMatrix(props: SettingsRolesMatrixSectionProps) {
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

  return {
    assignmentCountsByRole: props.assignmentCountsByRole,
    assignmentCountsReliable,
    loading,
    loadError,
    load,
    savingRoleId,
    newRoleName,
    setNewRoleName,
    startFromRole,
    setStartFromRole,
    collapsedGroups,
    pendingConfirmation,
    setPendingConfirmation,
    permissionFilter,
    setPermissionFilter,
    canCreateRole,
    columns,
    unsavedRoleNames,
    dirtyRoleList,
    unsavedChangeCount,
    hasUnsavedEdits,
    visiblePermissionGroups,
    baseline: matrix.baseline,
    togglePermission,
    discardRoleEdits,
    toggleGroupCollapsed,
    requestSaveRole,
    requestCreateCustomRole,
    requestCloneRole,
    confirmPendingAction,
    confirmationCopy,
    permissionsForStartFrom,
  };
}
