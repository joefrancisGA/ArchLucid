"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { mergeRegistrationScopeForProxy } from "@/lib/proxy-fetch-registration-scope";
import { roleDisplayLabel } from "@/lib/role-display-labels";
import { showError, showSuccess } from "@/lib/toast";

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
} from "./custom-role-draft-state";
import { type CustomRoleFailureCopy, customRoleFailureCopy } from "./custom-role-failure-copy";
import { CustomRoleRequestError, customRoleRequestStatus } from "./custom-role-request-error";
import {
  createCustomRoleBlockedReason,
  hasHighRiskPermissions,
  highRiskPermissionLabels,
  type CustomRoleStartFromValue,
  sortMatrixRoles,
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

async function fetchRoles(): Promise<CustomRoleDto[]> {
  const res = await fetch("/api/proxy/v1/admin/roles", mergeRegistrationScopeForProxy({ headers: { Accept: "application/json" } }));

  if (!res.ok)
    throw new CustomRoleRequestError(res.status);

  return (await res.json()) as CustomRoleDto[];
}

export function useSettingsRolesMatrix() {
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

  return {
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
    trimmedNewRoleName,
    createBlockedReason,
  };
}

export type UseSettingsRolesMatrix = ReturnType<typeof useSettingsRolesMatrix>;
