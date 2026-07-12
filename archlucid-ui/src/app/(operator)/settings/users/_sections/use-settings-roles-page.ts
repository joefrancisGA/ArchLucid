"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { useOperatorNavAuthority } from "@/components/OperatorNavAuthorityProvider";
import { requestPrincipalAppRoleAssignment } from "@/lib/admin-role-assignment-request";
import {
  archLucidAppRoleFromDirectoryFields,
  parseAdminApiKeysDirectoryPayload,
  parseAdminUsersDirectoryPayload,
} from "@/lib/admin-tenant-directory-parse";
import type { ArchLucidAppRole } from "@/lib/current-principal";
import { AUTHORITY_RANK } from "@/lib/nav-authority";
import { mergeRegistrationScopeForProxy } from "@/lib/proxy-fetch-registration-scope";
import { showError, showSuccess } from "@/lib/toast";

import type { SettingsRolesPageServerLoad } from "./load-settings-roles-page-data";
import {
  SETTINGS_ROLES_API_KEYS_PATH,
  SETTINGS_ROLES_USERS_PATH,
} from "./settings-roles-page-constants";
import type {
  SettingsRolesAssignablePrincipalRow,
  SettingsRolesPageNote,
  SettingsRolesPageSurface,
} from "./settings-roles-page-types";
import type { SettingsRolesPageViewModel } from "./settings-roles-page-view-model";

function resolveSurface(
  isDemo: boolean,
  isAuthorityLoading: boolean,
  isAdmin: boolean,
): SettingsRolesPageSurface {
  if (isDemo) {
    return "demo";
  }

  if (isAuthorityLoading) {
    return "authority_loading";
  }

  if (!isAdmin) {
    return "forbidden";
  }

  return "admin";
}

export function useSettingsRolesPage(loaded: SettingsRolesPageServerLoad): SettingsRolesPageViewModel {
  const isDemo = loaded.demo;
  const { callerAuthorityRank, isAuthorityLoading } = useOperatorNavAuthority();
  const isAdmin = callerAuthorityRank >= AUTHORITY_RANK.AdminAuthority;
  const surface = resolveSurface(isDemo, isAuthorityLoading, isAdmin);

  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<SettingsRolesAssignablePrincipalRow[]>([]);
  const [note, setNote] = useState<SettingsRolesPageNote | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setNote(null);

    try {
      const proxyInit = mergeRegistrationScopeForProxy({ headers: { Accept: "application/json" } });
      const [usersRes, keysRes] = await Promise.all([
        fetch(SETTINGS_ROLES_USERS_PATH, proxyInit),
        fetch(SETTINGS_ROLES_API_KEYS_PATH, proxyInit),
      ]);

      if (!usersRes.ok) {
        setRows([]);
        setNote("api_unavailable");

        return;
      }

      const usersJson: unknown = await usersRes.json();
      const userRows = parseAdminUsersDirectoryPayload(usersJson);
      let keyRows = parseAdminApiKeysDirectoryPayload({});

      if (keysRes.ok) {
        const keysJson: unknown = await keysRes.json();
        keyRows = parseAdminApiKeysDirectoryPayload(keysJson);
      }

      const combined: SettingsRolesAssignablePrincipalRow[] = [
        ...userRows.map((u) => ({
          id: u.userId,
          kind: "user" as const,
          name: u.displayName,
          detail: u.email,
          role: archLucidAppRoleFromDirectoryFields(u.authorityLabel, u.authorityRank),
        })),
        ...keyRows.map((k) => ({
          id: k.credentialId,
          kind: "api_key" as const,
          name: k.displayName,
          detail: k.hint,
          role: archLucidAppRoleFromDirectoryFields(k.authorityLabel, k.authorityRank),
        })),
      ];

      if (combined.length === 0) {
        setRows([]);
        setNote("empty_response");

        return;
      }

      setRows(combined);
    } catch {
      setRows([]);
      setNote("load_failed");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isDemo || !isAdmin) {
      return;
    }

    void load();
  }, [isAdmin, isDemo, load]);

  const onRoleChange = useCallback(
    async (row: SettingsRolesAssignablePrincipalRow, nextRole: ArchLucidAppRole) => {
      if (!isAdmin) {
        return;
      }

      let snapshot: SettingsRolesAssignablePrincipalRow[] = [];

      setRows((current) => {
        snapshot = current;

        return current.map((r) => (r.id === row.id && r.kind === row.kind ? { ...r, role: nextRole } : r));
      });

      const outcome = await requestPrincipalAppRoleAssignment({ kind: row.kind, id: row.id }, nextRole);

      if (outcome === "saved") {
        showSuccess("Role updated.");

        return;
      }

      if (outcome === "preview") {
        showSuccess("Role change recorded in the UI. The admin role API is not available on this environment yet.");

        return;
      }

      setRows(snapshot);
      showError("Could not update role", "The server rejected the role change.");
    },
    [isAdmin],
  );

  const sortedRows = useMemo(() => {
    return [...rows].sort((a, b) => {
      const byKind = a.kind.localeCompare(b.kind);

      if (byKind !== 0) {
        return byKind;
      }

      return a.name.localeCompare(b.name, undefined, { sensitivity: "base" });
    });
  }, [rows]);

  return {
    surface,
    loading,
    sortedRows,
    note,
    load,
    onRoleChange,
  };
}
