"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { useOperatorNavAuthority } from "@/components/operator/OperatorNavAuthorityProvider";
import { requestPrincipalAppRoleAssignment } from "@/lib/admin-role-assignment-request";
import {
  archLucidAppRoleFromDirectoryFields,
  parseAdminApiKeysDirectoryPayload,
  parseAdminUsersDirectoryPayload,
} from "@/lib/admin-tenant-directory-parse";
import { isApiKeysSettingsSurfaceEnabled } from "@/lib/api-keys-settings-access";
import type { ArchLucidAppRole } from "@/lib/current-principal";
import { AUTHORITY_RANK } from "@/lib/nav-authority";
import { mergeRegistrationScopeForProxy } from "@/lib/proxy-fetch-registration-scope";
import {
  resolveUsersMembersDirectorySource,
  scimProvisioningActiveFromTokensPayload,
  type UsersMembersDirectorySource,
} from "@/lib/vocabulary/scim-users-vocabulary";

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

const SETTINGS_ROLES_SCIM_TOKENS_PATH = "/api/proxy/v1/admin/scim/tokens";

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
  const [usersNote, setUsersNote] = useState<SettingsRolesPageNote | null>(null);
  const [keysNote, setKeysNote] = useState<SettingsRolesPageNote | null>(null);
  const [usersDirectorySource, setUsersDirectorySource] = useState<UsersMembersDirectorySource | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setUsersNote(null);
    setKeysNote(null);
    setUsersDirectorySource(null);

    try {
      const proxyInit = mergeRegistrationScopeForProxy({ headers: { Accept: "application/json" } });
      const includeApiKeys = isApiKeysSettingsSurfaceEnabled();
      const usersRes = await fetch(SETTINGS_ROLES_USERS_PATH, proxyInit);
      const keysRes = includeApiKeys
        ? await fetch(SETTINGS_ROLES_API_KEYS_PATH, proxyInit)
        : null;
      const scimRes = await fetch(SETTINGS_ROLES_SCIM_TOKENS_PATH, proxyInit);

      let userRows = parseAdminUsersDirectoryPayload({});
      let keyRows = parseAdminApiKeysDirectoryPayload({});
      let nextUsersNote: SettingsRolesPageNote | null = null;
      let nextKeysNote: SettingsRolesPageNote | null = null;

      if (!usersRes.ok) {
        userRows = [];
        // Directory list is optional for invites (POST /v1/admin/users/invite). Missing list routes
        // (404/501) must not block the invite form — treat as an empty directory.
        nextUsersNote =
          usersRes.status === 404 || usersRes.status === 501 ? "empty_response" : "api_unavailable";
      } else {
        const usersJson: unknown = await usersRes.json();
        userRows = parseAdminUsersDirectoryPayload(usersJson);

        if (userRows.length === 0) {
          nextUsersNote = "empty_response";
        }
      }

      if (keysRes !== null) {
        if (!keysRes.ok) {
          keyRows = [];
          nextKeysNote =
            keysRes.status === 404 || keysRes.status === 501 ? "empty_response" : "api_unavailable";
        } else {
          const keysJson: unknown = await keysRes.json();
          keyRows = parseAdminApiKeysDirectoryPayload(keysJson);

          if (keyRows.length === 0) {
            nextKeysNote = "empty_response";
          }
        }
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

      setRows(combined);
      setUsersNote(nextUsersNote);
      setKeysNote(nextKeysNote);

      let scimActive = false;

      if (scimRes.ok) {
        const scimJson: unknown = await scimRes.json();
        scimActive = scimProvisioningActiveFromTokensPayload(scimJson);
      }

      setUsersDirectorySource(resolveUsersMembersDirectorySource(scimActive));
    } catch {
      setRows([]);
      setUsersNote("load_failed");
      setKeysNote("load_failed");
      setUsersDirectorySource(resolveUsersMembersDirectorySource(false));
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
    async (row: SettingsRolesAssignablePrincipalRow, nextRole: ArchLucidAppRole): Promise<"saved" | "rejected"> => {
      if (!isAdmin) {
        return "rejected";
      }

      let snapshot: SettingsRolesAssignablePrincipalRow[] = [];

      setRows((current) => {
        snapshot = current;

        return current.map((r) => (r.id === row.id && r.kind === row.kind ? { ...r, role: nextRole } : r));
      });

      const outcome = await requestPrincipalAppRoleAssignment({ kind: row.kind, id: row.id }, nextRole);

      if (outcome === "saved") {
        return "saved";
      }

      setRows(snapshot);

      return "rejected";
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
    usersNote,
    keysNote,
    usersDirectorySource,
    load,
    onRoleChange,
  };
}
