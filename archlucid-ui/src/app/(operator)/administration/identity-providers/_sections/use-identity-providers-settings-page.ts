"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { useNavCallerAuthorityRank, useOperatorNavAuthority } from "@/components/operator/OperatorNavAuthorityProvider";
import {
  IDENTITY_PROVIDERS_FORBIDDEN_NOTE,
  IDENTITY_PROVIDERS_STATUS_LOAD_ERROR_NOTE,
} from "@/lib/identity-providers-settings-copy";
import type { IdentityProvidersFetchNote } from "@/lib/identity-providers-fetch-note";
import { formatIdentityProvidersFetchNote } from "@/lib/identity-providers-fetch-note";
import { fetchIdentityProvidersPageBundle } from "@/lib/fetch-identity-providers-page-bundle-client";
import type { IdentityProvidersOverviewModel } from "@/lib/identity-providers-settings-types";
import type { components } from "@/lib/openapi-schemas";
import { AUTHORITY_RANK } from "@/lib/nav-authority";
import { resolveIdentityProvidersOverview } from "@/lib/resolve-identity-providers-overview";

import type { IdentityProvidersSettingsPageServerLoad } from "./load-identity-providers-settings-page-data";

type AdminAuthConfigurationDiagnosticsResponse =
  components["schemas"]["AdminAuthConfigurationDiagnosticsResponse"];
type AdminIdentityProviderDiagnosticsResponse =
  components["schemas"]["AdminIdentityProviderDiagnosticsResponse"];
type AdminOidcDiagnosticsResponse = components["schemas"]["AdminOidcDiagnosticsResponse"];
type AdminSamlOperationalHealthResponse = components["schemas"]["AdminSamlOperationalHealthResponse"];

export type UseIdentityProvidersSettingsPageModel = {
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

function resolveHttpStatus(error: unknown): number | undefined {
  if (typeof error !== "object" || error === null || !("status" in error)) {
    return undefined;
  }

  const status = (error as { status?: unknown }).status;

  return typeof status === "number" ? status : undefined;
}

export function useIdentityProvidersSettingsPage(
  loaded: IdentityProvidersSettingsPageServerLoad,
): UseIdentityProvidersSettingsPageModel {
  void loaded;

  const callerAuthorityRank = useNavCallerAuthorityRank();
  const { isAuthorityLoading } = useOperatorNavAuthority();
  const canLoadDiagnostics =
    !isAuthorityLoading && callerAuthorityRank >= AUTHORITY_RANK.AdminAuthority;

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

  const hasCompletedLoadRef = useRef(false);
  const inFlightLoadRef = useRef<Promise<void> | null>(null);

  const load = useCallback(async () => {
    if (!canLoadDiagnostics) {
      return;
    }

    if (inFlightLoadRef.current !== null) {
      await inFlightLoadRef.current;

      return;
    }

    const isRefresh = hasCompletedLoadRef.current;

    setRefreshing(true);

    if (!isRefresh) {
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
    }

    const loadPromise = (async (): Promise<void> => {
      let bundleSucceeded = false;

      try {
        const bundle = await fetchIdentityProvidersPageBundle();

        setIdentityProviderDiagnostics(bundle.identityProviderDiagnostics);
        setIdentityProviderDiagnosticsNote(null);
        setAuthConfigurationDiagnostics(bundle.authConfigurationDiagnostics);
        setAuthConfigurationDiagnosticsNote(null);
        setOidcDiagnostics(bundle.oidcDiagnostics);
        setOidcDiagnosticsNote(null);
        setSamlOperationalHealth(bundle.samlOperationalHealth);
        setSamlOperationalHealthNote(null);
        bundleSucceeded = true;
      } catch (error: unknown) {
        const status = resolveHttpStatus(error);

        if (status !== undefined && isForbiddenStatus(status)) {
          setAccessDenied(true);
          setOverviewFailureStatusCode((current) => current ?? status);
        }

        setIdentityProviderDiagnostics(null);
        setIdentityProviderDiagnosticsNote(
          status !== undefined && isForbiddenStatus(status)
            ? IDENTITY_PROVIDERS_FORBIDDEN_NOTE
            : status !== undefined
              ? diagnosticsUnavailableNote("Identity provider diagnostics unavailable", status)
              : IDENTITY_PROVIDERS_STATUS_LOAD_ERROR_NOTE,
        );
        setAuthConfigurationDiagnostics(null);
        setAuthConfigurationDiagnosticsNote(
          status !== undefined && isForbiddenStatus(status)
            ? IDENTITY_PROVIDERS_FORBIDDEN_NOTE
            : status !== undefined
              ? diagnosticsUnavailableNote("Auth configuration diagnostics unavailable", status)
              : IDENTITY_PROVIDERS_STATUS_LOAD_ERROR_NOTE,
        );
        setOidcDiagnostics(null);
        setOidcDiagnosticsNote(
          status !== undefined && isForbiddenStatus(status)
            ? IDENTITY_PROVIDERS_FORBIDDEN_NOTE
            : status !== undefined
              ? diagnosticsUnavailableNote("OIDC diagnostics unavailable", status)
              : IDENTITY_PROVIDERS_STATUS_LOAD_ERROR_NOTE,
        );
        setSamlOperationalHealth(null);
        setSamlOperationalHealthNote(
          status !== undefined && isForbiddenStatus(status)
            ? IDENTITY_PROVIDERS_FORBIDDEN_NOTE
            : status !== undefined
              ? diagnosticsUnavailableNote("SAML operational health unavailable", status)
              : IDENTITY_PROVIDERS_STATUS_LOAD_ERROR_NOTE,
        );
      } finally {
        setRefreshing(false);

        if (bundleSucceeded) {
          setLastRefreshedAt(new Date());
        }

        setIdentityProviderDiagnosticsLoaded(true);
        setAuthConfigurationDiagnosticsLoaded(true);
        setOidcDiagnosticsLoaded(true);
        setSamlOperationalHealthLoaded(true);
        hasCompletedLoadRef.current = true;
      }
    })();

    inFlightLoadRef.current = loadPromise;

    try {
      await loadPromise;
    } finally {
      if (inFlightLoadRef.current === loadPromise) {
        inFlightLoadRef.current = null;
      }
    }
  }, [canLoadDiagnostics]);

  useEffect(() => {
    if (!canLoadDiagnostics) {
      return;
    }

    void load();
  }, [canLoadDiagnostics, load]);

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
