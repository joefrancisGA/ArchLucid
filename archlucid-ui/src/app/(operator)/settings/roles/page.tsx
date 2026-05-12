"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import Link from "next/link";

import { ContextualHelp } from "@/components/ContextualHelp";
import { OperatorEmptyState } from "@/components/OperatorShellMessage";
import { useOperatorNavAuthority } from "@/components/OperatorNavAuthorityProvider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { requestPrincipalAppRoleAssignment } from "@/lib/admin-role-assignment-request";
import {
  archLucidAppRoleFromDirectoryFields,
  parseAdminApiKeysDirectoryPayload,
  parseAdminUsersDirectoryPayload,
} from "@/lib/admin-tenant-directory-parse";
import type { ArchLucidAppRole } from "@/lib/current-principal";
import { isNextPublicDemoMode } from "@/lib/demo-ui-env";
import { AUTHORITY_RANK } from "@/lib/nav-authority";
import { isStaticDemoPayloadFallbackEnabled } from "@/lib/operator-static-demo";
import { mergeRegistrationScopeForProxy } from "@/lib/proxy-fetch-registration-scope";
import { showError, showSuccess } from "@/lib/toast";

const USERS_PATH = "/api/proxy/v1/admin/users";
const API_KEYS_PATH = "/api/proxy/v1/admin/api-keys";

const ASSIGNABLE_ROLES: readonly ArchLucidAppRole[] = ["Admin", "Operator", "Reader", "Auditor"];

/** Error / empty-result states surfaced as product copy (not developer diagnostics). */
type RolesPageNote = "api_unavailable" | "empty_response" | "load_failed";

type RoleAssignablePrincipalRow = {
  id: string;
  kind: "user" | "api_key";
  name: string;
  detail: string;
  role: ArchLucidAppRole;
};

/**
 * Admin-only role management: tenant users and API keys with ArchLucid app roles. Persist calls target
 * provisional REST paths; when the API returns 404/405/501, updates are acknowledged as UI-preview only.
 */
export default function SettingsRolesPage() {
  const isDemo = isNextPublicDemoMode() || isStaticDemoPayloadFallbackEnabled();
  const { callerAuthorityRank, isAuthorityLoading } = useOperatorNavAuthority();
  const isAdmin = callerAuthorityRank >= AUTHORITY_RANK.AdminAuthority;

  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<RoleAssignablePrincipalRow[]>([]);
  const [note, setNote] = useState<RolesPageNote | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setNote(null);

    try {
      const proxyInit = mergeRegistrationScopeForProxy({ headers: { Accept: "application/json" } });
      const [usersRes, keysRes] = await Promise.all([
        fetch(USERS_PATH, proxyInit),
        fetch(API_KEYS_PATH, proxyInit),
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

      const combined: RoleAssignablePrincipalRow[] = [
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
  }, [isDemo, isAdmin, load]);

  const onRoleChange = useCallback(async (row: RoleAssignablePrincipalRow, nextRole: ArchLucidAppRole) => {
    if (!isAdmin) {
      return;
    }

    let snapshot: RoleAssignablePrincipalRow[] = [];

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
  }, [isAdmin]);

  const sortedRows = useMemo(() => {
    return [...rows].sort((a, b) => {
      const byKind = a.kind.localeCompare(b.kind);

      if (byKind !== 0) {
        return byKind;
      }

      return a.name.localeCompare(b.name, undefined, { sensitivity: "base" });
    });
  }, [rows]);

  if (isDemo) {
    return (
      <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-6 text-sm text-neutral-600 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-400">
        <p className="m-0 font-medium text-neutral-800 dark:text-neutral-200">Role management not available in demo mode.</p>
        <p className="m-0 mt-1">Assign roles through your production workspace and identity provider.</p>
      </div>
    );
  }

  if (isAuthorityLoading) {
    return (
      <div className="mx-auto max-w-5xl space-y-6" data-testid="settings-roles-page">
        <p className="m-0 text-sm text-neutral-500">Loading…</p>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="mx-auto max-w-5xl space-y-6" data-testid="settings-roles-page">
        <p className="m-0 text-sm text-rose-800 dark:text-rose-200" role="alert" data-testid="settings-roles-forbidden">
          This page requires tenant administrator access (AdminAuthority). Sign in with an admin-ranked account or API key.
        </p>
        <p className="m-0 text-sm text-neutral-600 dark:text-neutral-400">
          <Link className="text-teal-800 underline dark:text-teal-300" href="/">
            Return to home
          </Link>
        </p>
      </div>
    );
  }

  function emptyStateTitle(kind: RolesPageNote): string {
    if (kind === "api_unavailable") {
      return "Directory unavailable";
    }

    if (kind === "empty_response") {
      return "No principals found";
    }

    return "Could not load principals";
  }

  function emptyStateDescription(kind: RolesPageNote): string {
    if (kind === "api_unavailable") {
      return "The user directory could not be loaded. Contact your workspace administrator if this persists.";
    }

    if (kind === "empty_response") {
      return "No users or API keys were returned for this tenant.";
    }

    return "Check your connection and reload. Contact support if the problem continues.";
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6" data-testid="settings-roles-page">
      <div>
        <div className="flex items-start gap-2">
          <h1 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">Role management</h1>
          <ContextualHelp helpKey="settings-roles-page" />
        </div>
        <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
          Assign ArchLucid app roles (Admin, Operator, Reader, Auditor) to tenant users and API keys. API policies remain
          authoritative; use{" "}
          <Link className="text-teal-800 underline dark:text-teal-300" href="/admin/users">
            Users &amp; roles
          </Link>{" "}
          for a read-only directory.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Users and API keys</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? <p className="m-0 text-sm text-neutral-500">Loading…</p> : null}
          {!loading && note !== null ? (
            <div data-testid="settings-roles-api-note">
              <OperatorEmptyState title={emptyStateTitle(note)} description={emptyStateDescription(note)} />
              <div className="mt-4 flex flex-wrap gap-2">
                <Button type="button" variant="secondary" size="sm" onClick={() => void load()}>
                  Refresh
                </Button>
              </div>
            </div>
          ) : null}
          {!loading && sortedRows.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-neutral-200 text-xs uppercase text-neutral-500 dark:border-neutral-700">
                    <th className="py-2 pr-3">Type</th>
                    <th className="py-2 pr-3">Name</th>
                    <th className="py-2 pr-3">Email / hint</th>
                    <th className="py-2 pr-3">Role</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedRows.map((r) => {
                    const typeLabel = r.kind === "user" ? "User" : "API key";

                    return (
                      <tr key={`${r.kind}:${r.id}`} className="border-b border-neutral-100 dark:border-neutral-800">
                        <td className="py-2 pr-3 text-neutral-600 dark:text-neutral-300">{typeLabel}</td>
                        <td className="py-2 pr-3 font-medium text-neutral-900 dark:text-neutral-100">{r.name}</td>
                        <td className="py-2 pr-3 text-neutral-600 dark:text-neutral-300">{r.detail}</td>
                        <td className="py-2 pr-3">
                          <Select
                            value={r.role}
                            onValueChange={(v) => {
                              void onRoleChange(r, v as ArchLucidAppRole);
                            }}
                          >
                            <SelectTrigger
                              className="h-9 w-[11rem]"
                              aria-label={`Role for ${r.name}`}
                              data-testid={`settings-roles-select-${r.kind}-${r.id}`}
                            >
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {ASSIGNABLE_ROLES.map((role) => (
                                <SelectItem key={role} value={role}>
                                  {role}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
