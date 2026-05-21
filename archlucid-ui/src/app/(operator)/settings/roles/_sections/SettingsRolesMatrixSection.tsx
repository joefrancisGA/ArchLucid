"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { mergeRegistrationScopeForProxy } from "@/lib/proxy-fetch-registration-scope";
import { showError, showSuccess } from "@/lib/toast";

import { ALL_MATRIX_PERMISSION_IDS, CUSTOM_ROLE_PERMISSION_GROUPS } from "./custom-role-permission-groups";

type CustomRoleDto = {
  id: string;
  name: string;
  description?: string | null;
  permissions: string[];
  isSystem: boolean;
  updatedUtc: string;
};

type DraftRole = {
  id?: string;
  name: string;
  permissions: Set<string>;
  isSystem: boolean;
};

async function fetchRoles(): Promise<CustomRoleDto[]> {
  const res = await fetch("/api/proxy/v1/admin/roles", mergeRegistrationScopeForProxy({ headers: { Accept: "application/json" } }));

  if (!res.ok)
    throw new Error(`Failed to load roles (${res.status})`);

  return (await res.json()) as CustomRoleDto[];
}

export function SettingsRolesMatrixSection() {
  const [roles, setRoles] = useState<DraftRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingRoleId, setSavingRoleId] = useState<string | null>(null);
  const [newRoleName, setNewRoleName] = useState("");

  const load = useCallback(async () => {
    setLoading(true);

    try {
      const rows = await fetchRoles();
      setRoles(
        rows.map((row) => ({
          id: row.id,
          name: row.name,
          isSystem: row.isSystem,
          permissions: new Set(row.permissions),
        })),
      );
    } catch (error) {
      showError(error instanceof Error ? error.message : "Could not load custom roles.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const columns = useMemo(() => roles, [roles]);

  function togglePermission(roleIndex: number, permissionId: string) {
    setRoles((prev) =>
      prev.map((role, index) => {
        if (index !== roleIndex || role.isSystem)
          return role;

        const nextPermissions = new Set(role.permissions);

        if (nextPermissions.has(permissionId))
          nextPermissions.delete(permissionId);
        else
          nextPermissions.add(permissionId);

        return { ...role, permissions: nextPermissions };
      }),
    );
  }

  async function saveRole(role: DraftRole) {
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
        throw new Error(`Save failed (${res.status})`);

      showSuccess(`Saved role "${role.name}".`);
      await load();
    } catch (error) {
      showError(error instanceof Error ? error.message : "Could not save role.");
    } finally {
      setSavingRoleId(null);
    }
  }

  async function createCustomRole(source?: DraftRole) {
    const name = source?.name ?? newRoleName.trim();

    if (!name)
      return;

    try {
      const res = await fetch(
        "/api/proxy/v1/admin/roles",
        mergeRegistrationScopeForProxy({
          method: "POST",
          headers: { Accept: "application/json", "Content-Type": "application/json" },
          body: JSON.stringify({
            name: source ? `${name} (custom)` : name,
            permissions: source
              ? ALL_MATRIX_PERMISSION_IDS.filter((permission) => source.permissions.has(permission))
              : [],
          }),
        }),
      );

      if (!res.ok)
        throw new Error(`Create failed (${res.status})`);

      showSuccess(`Created custom role "${name}".`);
      setNewRoleName("");
      await load();
    } catch (error) {
      showError(error instanceof Error ? error.message : "Could not create role.");
    }
  }

  if (loading)
    return <p className="m-0 text-sm text-neutral-500">Loading role matrix…</p>;

  return (
    <section data-testid="settings-roles-matrix" className="space-y-4">
      <div className="flex flex-wrap items-end gap-2">
        <div className="min-w-[14rem] flex-1">
          <label htmlFor="new-custom-role-name" className="text-xs font-medium text-neutral-600 dark:text-neutral-400">
            New custom role name
          </label>
          <Input
            id="new-custom-role-name"
            value={newRoleName}
            onChange={(event) => setNewRoleName(event.target.value)}
            placeholder="Operator without Billing"
            className="mt-1"
          />
        </div>
        <Button type="button" size="sm" onClick={() => void createCustomRole()}>
          Add custom role
        </Button>
      </div>

      <div className="overflow-x-auto rounded-md border border-neutral-200 dark:border-neutral-800">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-neutral-50 dark:bg-neutral-900/60">
            <tr>
              <th className="px-3 py-2 font-semibold">Permission</th>
              {columns.map((role) => (
                <th key={role.id ?? role.name} className="px-3 py-2 font-semibold">
                  <div className="flex flex-col gap-1">
                    <span>{role.name}</span>
                    {role.isSystem ? (
                      <span className="text-xs font-normal text-neutral-500">system</span>
                    ) : (
                      <div className="flex flex-wrap gap-1">
                        <Button type="button" size="sm" variant="secondary" disabled={savingRoleId === role.id} onClick={() => void saveRole(role)}>
                          Save
                        </Button>
                      </div>
                    )}
                    {role.isSystem ? (
                      <Button type="button" size="sm" variant="ghost" onClick={() => void createCustomRole(role)}>
                        Clone to custom role
                      </Button>
                    ) : null}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {CUSTOM_ROLE_PERMISSION_GROUPS.flatMap((group) => [
              <tr key={`group-${group.area}`} className="bg-neutral-50/70 dark:bg-neutral-900/30">
                <td colSpan={columns.length + 1} className="px-3 py-2 text-xs font-semibold uppercase tracking-wide text-neutral-500">
                  {group.area}
                </td>
              </tr>,
              ...group.permissions.map((permission) => (
                <tr key={permission.id} className="border-t border-neutral-100 dark:border-neutral-800">
                  <td className="px-3 py-2">{permission.label}</td>
                  {columns.map((role, roleIndex) => (
                    <td key={`${role.id ?? role.name}:${permission.id}`} className="px-3 py-2 text-center">
                      {role.isSystem ? (
                        <span aria-label={role.permissions.has(permission.id) ? "included" : "excluded"}>
                          {role.permissions.has(permission.id) ? "✓" : "—"}
                        </span>
                      ) : (
                        <input
                          type="checkbox"
                          checked={role.permissions.has(permission.id)}
                          aria-label={`${permission.label} for ${role.name}`}
                          onChange={() => togglePermission(roleIndex, permission.id)}
                        />
                      )}
                    </td>
                  ))}
                </tr>
              )),
            ])}
          </tbody>
        </table>
      </div>
    </section>
  );
}
