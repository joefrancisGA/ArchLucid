"use client";

import { useCallback, useEffect, useState } from "react";

import type { components } from "@/lib/openapi-schemas";
import { mergeRegistrationScopeForProxy } from "@/lib/proxy-fetch-registration-scope";

import { filterArchLucidAuthConfigRows } from "./filter-arch-lucid-auth-config-rows";
import type { IdentityProvidersSettingsPageServerLoad } from "./load-identity-providers-settings-page-data";

type AdminConfigSummaryResponse = components["schemas"]["AdminConfigSummaryResponse"];
type AdminSamlOperationalHealthResponse = components["schemas"]["AdminSamlOperationalHealthResponse"];
type ConfigSummaryKeyRow = components["schemas"]["ConfigSummaryKeyRow"];

export type UseIdentityProvidersSettingsPageModel = {
  note: string | null;
  rows: ConfigSummaryKeyRow[] | null;
  samlOperationalHealth: AdminSamlOperationalHealthResponse | null;
  samlOperationalHealthNote: string | null;
  samlOperationalHealthLoaded: boolean;
};

export function useIdentityProvidersSettingsPage(
  loaded: IdentityProvidersSettingsPageServerLoad,
): UseIdentityProvidersSettingsPageModel {
  void loaded;

  const [rows, setRows] = useState<ConfigSummaryKeyRow[] | null>(null);
  const [note, setNote] = useState<string | null>(null);

  const [samlOperationalHealth, setSamlOperationalHealth] = useState<AdminSamlOperationalHealthResponse | null>(null);
  const [samlOperationalHealthNote, setSamlOperationalHealthNote] = useState<string | null>(null);
  const [samlOperationalHealthLoaded, setSamlOperationalHealthLoaded] = useState(false);

  const load = useCallback(async () => {
    setNote(null);
    setRows(null);
    setSamlOperationalHealth(null);
    setSamlOperationalHealthNote(null);
    setSamlOperationalHealthLoaded(false);

    try {
      const opts = mergeRegistrationScopeForProxy({ headers: { Accept: "application/json" }, cache: "no-store" });

      const [summaryRes, samlRes] = await Promise.all([
        fetch("/api/proxy/v1/admin/configuration/summary?includeEffectiveValues=true", opts),
        fetch("/api/proxy/v1/admin/auth/saml-operational-health", opts),
      ]);

      if (!summaryRes.ok) {
        setRows(null);
        setNote(
          summaryRes.status === 401 || summaryRes.status === 403
            ? "This page requires an Admin session to read identity settings from the configuration catalog."
            : `Configuration summary unavailable (HTTP ${summaryRes.status}).`,
        );
      } else {
        const body = (await summaryRes.json()) as AdminConfigSummaryResponse;
        const keys: ConfigSummaryKeyRow[] = body.keys ?? [];
        const authRows = filterArchLucidAuthConfigRows(keys);

        setRows(authRows);
      }

      if (!samlRes.ok) {
        setSamlOperationalHealth(null);
        setSamlOperationalHealthNote(
          samlRes.status === 401 || samlRes.status === 403
            ? "Admin session required to read SAML operational health signals."
            : `SAML operational health unavailable (HTTP ${samlRes.status}).`,
        );
      } else {
        const body = (await samlRes.json()) as AdminSamlOperationalHealthResponse;

        setSamlOperationalHealth(body);
        setSamlOperationalHealthNote(null);
      }
    } catch (e: unknown) {
      setRows(null);
      setNote(e instanceof Error ? e.message : String(e));
      setSamlOperationalHealth(null);
      setSamlOperationalHealthNote("SAML operational health could not be loaded.");
    } finally {
      setSamlOperationalHealthLoaded(true);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return {
    note,
    rows,
    samlOperationalHealth,
    samlOperationalHealthNote,
    samlOperationalHealthLoaded,
  };
}
