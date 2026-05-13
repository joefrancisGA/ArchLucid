"use client";

import { useCallback, useEffect, useState } from "react";

import type { components } from "@/lib/api-types.generated";
import { mergeRegistrationScopeForProxy } from "@/lib/proxy-fetch-registration-scope";

import { filterArchLucidAuthConfigRows } from "./filter-arch-lucid-auth-config-rows";

type AdminConfigSummaryResponse = components["schemas"]["AdminConfigSummaryResponse"];
type ConfigSummaryKeyRow = components["schemas"]["ConfigSummaryKeyRow"];

export type UseIdentityProvidersSettingsPageModel = {
  note: string | null;
  rows: ConfigSummaryKeyRow[] | null;
};

export function useIdentityProvidersSettingsPage(): UseIdentityProvidersSettingsPageModel {
  const [rows, setRows] = useState<ConfigSummaryKeyRow[] | null>(null);
  const [note, setNote] = useState<string | null>(null);

  const load = useCallback(async () => {
    setNote(null);

    try {
      const res = await fetch(
        "/api/proxy/v1/admin/configuration/summary?includeEffectiveValues=true",
        mergeRegistrationScopeForProxy({ headers: { Accept: "application/json" }, cache: "no-store" }),
      );

      if (!res.ok) {
        setRows(null);
        setNote(
          res.status === 401 || res.status === 403
            ? "This page requires an Admin session to read identity settings from the configuration catalog."
            : `Configuration summary unavailable (HTTP ${res.status}).`,
        );

        return;
      }

      const body = (await res.json()) as AdminConfigSummaryResponse;
      const keys: ConfigSummaryKeyRow[] = body.keys ?? [];
      const authRows = filterArchLucidAuthConfigRows(keys);

      setRows(authRows);
    } catch (e: unknown) {
      setRows(null);
      setNote(e instanceof Error ? e.message : String(e));
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return {
    note,
    rows,
  };
}
