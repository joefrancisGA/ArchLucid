"use client";

import { useCallback, useEffect, useState } from "react";

import { parseAdminUsersDirectoryPayload } from "@/lib/admin-tenant-directory-parse";
import { isNextPublicDemoMode } from "@/lib/demo-ui-env";
import { isStaticDemoPayloadFallbackEnabled } from "@/lib/operator-static-demo";
import { mergeRegistrationScopeForProxy } from "@/lib/proxy-fetch-registration-scope";

import { ADMIN_USERS_PROXY_PATH } from "./admin-users-page-constants";
import type { AdminUsersDirectoryRow, AdminUsersNote } from "./admin-users-page-types";
import type { AdminUsersPageViewModel } from "./admin-users-page-view-model";

export function useAdminUsersPage(): AdminUsersPageViewModel {
  const isDemo = isNextPublicDemoMode() || isStaticDemoPayloadFallbackEnabled();

  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<AdminUsersDirectoryRow[]>([]);
  const [note, setNote] = useState<AdminUsersNote | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setNote(null);

    try {
      const res = await fetch(ADMIN_USERS_PROXY_PATH, mergeRegistrationScopeForProxy({ headers: { Accept: "application/json" } }));

      if (!res.ok) {
        setRows([]);
        setNote("api_unavailable");

        return;
      }

      const json: unknown = await res.json();
      const parsed = parseAdminUsersDirectoryPayload(json).map(
        (r): AdminUsersDirectoryRow => ({
          userId: r.userId,
          displayName: r.displayName,
          email: r.email,
          authorityLabel: r.authorityLabel,
        }),
      );

      if (parsed.length === 0) {
        setRows([]);
        setNote("empty_response");

        return;
      }

      setRows(parsed);
    } catch {
      setRows([]);
      setNote("load_failed");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isDemo) {
      return;
    }

    void load();
  }, [isDemo, load]);

  return {
    isDemo,
    loading,
    rows,
    note,
    load,
  };
}
