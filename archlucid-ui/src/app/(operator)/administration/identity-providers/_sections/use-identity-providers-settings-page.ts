"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import {
  IDENTITY_PROVIDERS_CONFIG_SUMMARY_LOAD_ERROR_NOTE,
  IDENTITY_PROVIDERS_FORBIDDEN_NOTE,
  IDENTITY_PROVIDERS_STATUS_LOAD_ERROR_NOTE,
} from "@/lib/identity-providers-settings-copy";
import type { IdentityProvidersFetchNote } from "@/lib/identity-providers-fetch-note";
import { formatIdentityProvidersFetchNote } from "@/lib/identity-providers-fetch-note";
import type { IdentityProvidersOverviewModel } from "@/lib/identity-providers-settings-types";
import type { components } from "@/lib/openapi-schemas";
import { mergeRegistrationScopeForProxy } from "@/lib/proxy-fetch-registration-scope";
import { resolveIdentityProvidersOverview } from "@/lib/resolve-identity-providers-overview";

import { filterArchLucidAuthConfigRows } from "./filter-arch-lucid-auth-config-rows";
import type { IdentityProvidersSettingsPageServerLoad } from "./load-identity-providers-settings-page-data";

type AdminConfigSummaryResponse = components["schemas"]["AdminConfigSummaryResponse"];
type AdminAuthConfigurationDiagnosticsResponse =
  components["schemas"]["AdminAuthConfigurationDiagnosticsResponse"];
type AdminIdentityProviderDiagnosticsResponse =
  components["schemas"]["AdminIdentityProviderDiagnosticsResponse"];
type AdminOidcDiagnosticsResponse = components["schemas"]["AdminOidcDiagnosticsResponse"];
type AdminSamlOperationalHealthResponse = components["schemas"]["AdminSamlOperationalHealthResponse"];
type ConfigSummaryKeyRow = components["schemas"]["ConfigSummaryKeyRow"];

export type UseIdentityProvidersSettingsPageModel = {
  readonly note: string | null;
  readonly rows: ConfigSummaryKeyRow[] | null;
  readonly identityProviderDiagnostics: AdminIdentityProviderDiagnosticsResponse | null;
  readonly identityProviderDiagnosticsNote: string | null;
  readonly identityProviderDiagnosticsLoaded: boolean;
  readonly authConfigurationDiagnostics: AdminAuthConfigurationDiagnosticsResponse | null;
  readonly authConfigurationDiagnosticsNote: string | null;
  readonly authConfigurationDiagnosticsLoaded: boolean;
  readonly oidcDiagnostics: AdminOidcDiagnosticsResponse | null;
  readonly oidcDiagnosticsNote: string | null;
  readonly oidcDiagnosticsLoaded: boolean;
  readonly samlOperationalHealth: AdminSamlOperationalHealthResponse | null;
  readonly samlOperationalHealthNote: string | null;
  readonly samlOperationalHealthLoaded: boolean;
  readonly dataLoaded: boolean;
  readonly refreshing: boolean;
  readonly lastRefreshedAt: Date | null;
  readonly diagnosticsDataUnavailable: boolean;
  readonly overviewStatusFailure: IdentityProvidersFetchNote | null;
  readonly refresh: () => Promise<void>;
  readonly accessDenied: boolean;
  readonly overview: IdentityProvidersOverviewModel;
};

function isForbiddenStatus(status: number): boolean {
  return status === 401 || status === 403;
}

function diagnosticsUnavailableNote(message: string, status: number): string {
  return formatIdentityProvidersFetchNote({ message, statusCode: status });
}

export function useIdentityProvidersSettingsPage(
  loaded: IdentityProvidersSettingsPageServerLoad,
): UseIdentityProvidersSettingsPageModel {
  void loaded;

  const [rows, setRows] = useState<ConfigSummaryKeyRow[] | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const [accessDenied, setAccessDenied] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [lastRefreshedAt, setLastRefreshedAt] = useState<Date | null>(null);
  const [overviewFailureStatusCode, setOverviewFailureStatusCode] = useState<number | undefined>(undefined);

  const [identityProviderDiagnostics, setIdentityProviderDiagnostics] =
    useState<AdminIdentityProviderDiagnosticsResponse | null>(null);
  const [identityProviderDiagnosticsNote, setIdentityProviderDiagnosticsNote] = useState<string | null>(null);
  const [identityProviderDiagnosticsLoaded, setIdentityProviderDiagnosticsLoaded] = useState(false);
  const [authConfigurationDiagnostics, setAuthConfigurationDiagnostics] =
    useState<AdminAuthConfigurationDiagnosticsResponse | null>(null);
  const [authConfigurationDiagnosticsNote, setAuthConfigurationDiagnosticsNote] = useState<string | null>(null);
  const [authConfigurationDiagnosticsLoaded, setAuthConfigurationDiagnosticsLoaded] = useState(false);

  const [oidcDiagnostics, setOidcDiagnostics] = useState<AdminOidcDiagnosticsResponse | null>(null);
  const [oidcDiagnosticsNote, setOidcDiagnosticsNote] = useState<string | null>(null);
  const [oidcDiagnosticsLoaded, setOidcDiagnosticsLoaded] = useState(false);

  const [samlOperationalHealth, setSamlOperationalHealth] = useState<AdminSamlOperationalHealthResponse | null>(null);
  const [samlOperationalHealthNote, setSamlOperationalHealthNote] = useState<string | null>(null);
  const [samlOperationalHealthLoaded, setSamlOperationalHealthLoaded] = useState(false);

  const load = useCallback(async () => {
    setRefreshing(true);
    setNote(null);
    setRows(null);
    setAccessDenied(false);
    setOverviewFailureStatusCode(undefined);
    setIdentityProviderDiagnostics(null);
    setIdentityProviderDiagnosticsNote(null);
    setIdentityProviderDiagnosticsLoaded(false);
    setAuthConfigurationDiagnostics(null);
    setAuthConfigurationDiagnosticsNote(null);
    setAuthConfigurationDiagnosticsLoaded(false);
    setOidcDiagnostics(null);
    setOidcDiagnosticsNote(null);
    setOidcDiagnosticsLoaded(false);
    setSamlOperationalHealth(null);
    setSamlOperationalHealthNote(null);
    setSamlOperationalHealthLoaded(false);

    let identityProviderDiagnosticsSucceeded = false;
    let authConfigurationDiagnosticsSucceeded = false;
    let oidcDiagnosticsSucceeded = false;
    let samlOperationalHealthSucceeded = false;

    try {
      const opts = mergeRegistrationScopeForProxy({ headers: { Accept: "application/json" }, cache: "no-store" });

      const [summaryRes, diagnosticsRes, authConfigRes, oidcRes, samlRes] = await Promise.all([
        fetch("/api/proxy/v1/internal/configuration/summary?includeEffectiveValues=true", opts),
        fetch("/api/proxy/v1/admin/diagnostics/identity-providers", opts),
        fetch("/api/proxy/v1/admin/auth/configuration-diagnostics", opts),
        fetch("/api/proxy/v1/admin/auth/oidc-diagnostics", opts),
        fetch("/api/proxy/v1/admin/auth/saml-operational-health", opts),
      ]);

      if (!summaryRes.ok) {
        setRows(null);

        if (isForbiddenStatus(summaryRes.status)) {
          setAccessDenied(true);
          setNote(IDENTITY_PROVIDERS_FORBIDDEN_NOTE);
        } else {
          setNote(
            formatIdentityProvidersFetchNote({
              message: IDENTITY_PROVIDERS_CONFIG_SUMMARY_LOAD_ERROR_NOTE,
              statusCode: summaryRes.status,
            }),
          );
        }
      } else {
        const body = (await summaryRes.json()) as AdminConfigSummaryResponse;
        const keys: ConfigSummaryKeyRow[] = body.keys ?? [];
        const authRows = filterArchLucidAuthConfigRows(keys);

        setRows(authRows);
      }

      if (!diagnosticsRes.ok) {
        setIdentityProviderDiagnostics(null);
        setOverviewFailureStatusCode((current) => current ?? diagnosticsRes.status);
        setIdentityProviderDiagnosticsNote(
          isForbiddenStatus(diagnosticsRes.status)
            ? IDENTITY_PROVIDERS_FORBIDDEN_NOTE
            : diagnosticsUnavailableNote("Identity provider diagnostics unavailable", diagnosticsRes.status),
        );
      } else {
        const body = (await diagnosticsRes.json()) as AdminIdentityProviderDiagnosticsResponse;

        setIdentityProviderDiagnostics(body);
        setIdentityProviderDiagnosticsNote(null);
        identityProviderDiagnosticsSucceeded = true;
      }

      if (!authConfigRes.ok) {
        setAuthConfigurationDiagnostics(null);
        setOverviewFailureStatusCode((current) => current ?? authConfigRes.status);
        setAuthConfigurationDiagnosticsNote(
          isForbiddenStatus(authConfigRes.status)
            ? IDENTITY_PROVIDERS_FORBIDDEN_NOTE
            : diagnosticsUnavailableNote("Auth configuration diagnostics unavailable", authConfigRes.status),
        );
      } else {
        const body = (await authConfigRes.json()) as AdminAuthConfigurationDiagnosticsResponse;

        setAuthConfigurationDiagnostics(body);
        setAuthConfigurationDiagnosticsNote(null);
        authConfigurationDiagnosticsSucceeded = true;
      }

      if (!oidcRes.ok) {
        setOidcDiagnostics(null);
        setOverviewFailureStatusCode((current) => current ?? oidcRes.status);
        setOidcDiagnosticsNote(
          isForbiddenStatus(oidcRes.status)
            ? IDENTITY_PROVIDERS_FORBIDDEN_NOTE
            : diagnosticsUnavailableNote("OIDC diagnostics unavailable", oidcRes.status),
        );
      } else {
        const body = (await oidcRes.json()) as AdminOidcDiagnosticsResponse;

        setOidcDiagnostics(body);
        setOidcDiagnosticsNote(null);
        oidcDiagnosticsSucceeded = true;
      }

      if (!samlRes.ok) {
        setSamlOperationalHealth(null);
        setOverviewFailureStatusCode((current) => current ?? samlRes.status);
        setSamlOperationalHealthNote(
          isForbiddenStatus(samlRes.status)
            ? IDENTITY_PROVIDERS_FORBIDDEN_NOTE
            : diagnosticsUnavailableNote("SAML operational health unavailable", samlRes.status),
        );
      } else {
        const body = (await samlRes.json()) as AdminSamlOperationalHealthResponse;

        setSamlOperationalHealth(body);
        setSamlOperationalHealthNote(null);
        samlOperationalHealthSucceeded = true;
      }
    } catch (e: unknown) {
      setRows(null);
      setNote(e instanceof Error ? e.message : IDENTITY_PROVIDERS_STATUS_LOAD_ERROR_NOTE);
      setIdentityProviderDiagnostics(null);
      setIdentityProviderDiagnosticsNote(IDENTITY_PROVIDERS_STATUS_LOAD_ERROR_NOTE);
      setAuthConfigurationDiagnostics(null);
      setAuthConfigurationDiagnosticsNote(IDENTITY_PROVIDERS_STATUS_LOAD_ERROR_NOTE);
      setOidcDiagnostics(null);
      setOidcDiagnosticsNote(IDENTITY_PROVIDERS_STATUS_LOAD_ERROR_NOTE);
      setSamlOperationalHealth(null);
      setSamlOperationalHealthNote(IDENTITY_PROVIDERS_STATUS_LOAD_ERROR_NOTE);
    } finally {
      setRefreshing(false);

      if (
        identityProviderDiagnosticsSucceeded
        || authConfigurationDiagnosticsSucceeded
        || oidcDiagnosticsSucceeded
        || samlOperationalHealthSucceeded
      ) {
        setLastRefreshedAt(new Date());
      }

      setIdentityProviderDiagnosticsLoaded(true);
      setAuthConfigurationDiagnosticsLoaded(true);
      setOidcDiagnosticsLoaded(true);
      setSamlOperationalHealthLoaded(true);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const dataLoaded =
    identityProviderDiagnosticsLoaded
    && authConfigurationDiagnosticsLoaded
    && oidcDiagnosticsLoaded
    && samlOperationalHealthLoaded;

  const overview = useMemo(
    () =>
      resolveIdentityProvidersOverview({
        authConfigurationDiagnostics: dataLoaded ? authConfigurationDiagnostics : null,
        authConfigurationDiagnosticsAvailable: dataLoaded && authConfigurationDiagnostics !== null,
        identityProviderDiagnostics: dataLoaded ? identityProviderDiagnostics : null,
        identityProviderDiagnosticsAvailable: dataLoaded && identityProviderDiagnostics !== null,
        oidcDiagnostics: dataLoaded ? oidcDiagnostics : null,
        oidcDiagnosticsAvailable: dataLoaded && oidcDiagnostics !== null,
      }),
    [authConfigurationDiagnostics, dataLoaded, identityProviderDiagnostics, oidcDiagnostics],
  );

  const diagnosticsDataUnavailable =
    dataLoaded
    && identityProviderDiagnostics === null
    && authConfigurationDiagnostics === null
    && oidcDiagnostics === null
    && samlOperationalHealth === null
    && identityProviderDiagnosticsNote !== null
    && authConfigurationDiagnosticsNote !== null
    && oidcDiagnosticsNote !== null
    && samlOperationalHealthNote !== null;

  const overviewStatusFailure = diagnosticsDataUnavailable
    ? {
        message: IDENTITY_PROVIDERS_STATUS_LOAD_ERROR_NOTE,
        statusCode: overviewFailureStatusCode,
      }
    : null;

  return {
    note,
    rows,
    identityProviderDiagnostics,
    identityProviderDiagnosticsNote,
    identityProviderDiagnosticsLoaded,
    authConfigurationDiagnostics,
    authConfigurationDiagnosticsNote,
    authConfigurationDiagnosticsLoaded,
    oidcDiagnostics,
    oidcDiagnosticsNote,
    oidcDiagnosticsLoaded,
    samlOperationalHealth,
    samlOperationalHealthNote,
    samlOperationalHealthLoaded,
    dataLoaded,
    refreshing,
    lastRefreshedAt,
    diagnosticsDataUnavailable,
    overviewStatusFailure,
    refresh: load,
    accessDenied,
    overview,
  };
}
