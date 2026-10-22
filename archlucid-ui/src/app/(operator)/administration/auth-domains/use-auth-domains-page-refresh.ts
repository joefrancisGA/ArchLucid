"use client";

import { useCallback, useEffect, type Dispatch, type RefObject, type SetStateAction } from "react";

import {
  fetchTenantAuthDomainEnforcementReadiness,
  fetchTenantAuthDomainRecoveryAdmins,
  fetchTenantAuthDomains,
  type TenantAuthDomainEnforcementReadiness,
  type TenantAuthDomainRecord,
  type TenantAuthDomainRecoveryAdminRecord,
} from "@/lib/admin-auth-domains-api";
import {
  AUTH_DOMAINS_JOURNEY_SECTION_IDS,
  AUTH_DOMAINS_LIST_LOAD_ERROR_SUMMARY,
  AUTH_DOMAINS_LIST_LOAD_RECOVERY,
  AUTH_DOMAINS_MUTATION_ERROR_SUMMARY,
  AUTH_DOMAINS_MUTATION_RECOVERY,
  resolveAuthDomainsCurrentWorkspaceLabel,
  type AuthDomainsJourneyStepId,
} from "@/lib/auth-domains-page-copy";
import { readOperatorScopeFromStorage } from "@/lib/operator/operator-scope-storage";

export type AuthDomainsRefreshOptions = {
  readonly surfaceError?: boolean;
};

export type AuthDomainsInlineError = {
  readonly summary: string;
  readonly recovery: typeof AUTH_DOMAINS_MUTATION_RECOVERY;
};

type UseAuthDomainsPageRefreshParams = {
  readonly selectedDomain: string | null;
  readonly setDomains: Dispatch<SetStateAction<TenantAuthDomainRecord[]>>;
  readonly setLoading: Dispatch<SetStateAction<boolean>>;
  readonly setErrorState: Dispatch<SetStateAction<AuthDomainsInlineError | null>>;
  readonly setRecoveryAdmins: Dispatch<SetStateAction<TenantAuthDomainRecoveryAdminRecord[]>>;
  readonly setReadiness: Dispatch<SetStateAction<TenantAuthDomainEnforcementReadiness | null>>;
  readonly setCurrentWorkspaceLabel: Dispatch<SetStateAction<string | null>>;
  readonly pendingJourneyScrollRef: RefObject<AuthDomainsJourneyStepId | null>;
};

function focusJourneySection(stepId: AuthDomainsJourneyStepId): void {
  const target = document.getElementById(AUTH_DOMAINS_JOURNEY_SECTION_IDS[stepId]);

  if (target === null) {
    return;
  }

  target.scrollIntoView({ behavior: "smooth", block: "start" });

  if (typeof target.focus === "function") {
    target.focus({ preventScroll: true });
  }
}

export function useAuthDomainsPageRefresh(params: UseAuthDomainsPageRefreshParams) {
  const {
    selectedDomain,
    setDomains,
    setLoading,
    setErrorState,
    setRecoveryAdmins,
    setReadiness,
    setCurrentWorkspaceLabel,
    pendingJourneyScrollRef,
  } = params;

  const refreshDomains = useCallback(async () => {
    setLoading(true);
    setErrorState(null);

    try {
      const rows = await fetchTenantAuthDomains();
      setDomains(rows);
    } catch {
      setErrorState({
        summary: AUTH_DOMAINS_LIST_LOAD_ERROR_SUMMARY,
        recovery: AUTH_DOMAINS_LIST_LOAD_RECOVERY,
      });
    } finally {
      setLoading(false);
    }
  }, [setDomains, setErrorState, setLoading]);

  const refreshRecoveryAdmins = useCallback(
    async (normalizedDomain: string, options?: AuthDomainsRefreshOptions) => {
      try {
        const rows = await fetchTenantAuthDomainRecoveryAdmins(normalizedDomain);
        setRecoveryAdmins(rows);
      } catch (error) {
        setRecoveryAdmins([]);

        if (options?.surfaceError) {
          setErrorState({
            summary: AUTH_DOMAINS_MUTATION_ERROR_SUMMARY,
            recovery: AUTH_DOMAINS_MUTATION_RECOVERY,
          });
          throw error;
        }
      }
    },
    [setErrorState, setRecoveryAdmins],
  );

  const refreshReadiness = useCallback(
    async (normalizedDomain: string, options?: AuthDomainsRefreshOptions) => {
      try {
        const row = await fetchTenantAuthDomainEnforcementReadiness(normalizedDomain);
        setReadiness(row);
      } catch (error) {
        setReadiness(null);

        if (options?.surfaceError) {
          setErrorState({
            summary: AUTH_DOMAINS_MUTATION_ERROR_SUMMARY,
            recovery: AUTH_DOMAINS_MUTATION_RECOVERY,
          });
          throw error;
        }
      }
    },
    [setErrorState, setReadiness],
  );

  // Scope is browser-persisted, so it is absent during the server render. Reading it after mount
  // keeps the first client paint byte-identical to the server markup instead of tripping hydration.
  useEffect(() => {
    setCurrentWorkspaceLabel(resolveAuthDomainsCurrentWorkspaceLabel(readOperatorScopeFromStorage()));
  }, [setCurrentWorkspaceLabel]);

  useEffect(() => {
    void refreshDomains();
  }, [refreshDomains]);

  useEffect(() => {
    if (selectedDomain === null) {
      setRecoveryAdmins([]);
      setReadiness(null);
      return;
    }

    void refreshRecoveryAdmins(selectedDomain);
    void refreshReadiness(selectedDomain);
  }, [refreshReadiness, refreshRecoveryAdmins, selectedDomain, setReadiness, setRecoveryAdmins]);

  useEffect(() => {
    if (pendingJourneyScrollRef.current === null || selectedDomain === null) {
      return;
    }

    const stepId = pendingJourneyScrollRef.current;
    pendingJourneyScrollRef.current = null;

    requestAnimationFrame(() => {
      focusJourneySection(stepId);
    });
  }, [pendingJourneyScrollRef, selectedDomain]);

  return {
    refreshDomains,
    refreshRecoveryAdmins,
    refreshReadiness,
  };
}
