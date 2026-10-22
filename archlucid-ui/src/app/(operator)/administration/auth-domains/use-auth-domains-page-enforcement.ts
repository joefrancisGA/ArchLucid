"use client";

import { type Dispatch, type SetStateAction } from "react";

import { type AuthDomainsPendingConfirm } from "@/app/(operator)/administration/auth-domains/AuthDomainsActionConfirmDialog";
import {
  enableTenantAuthDomainEnforcement,
  removeTenantAuthDomainRecoveryAdmin,
  setTenantAuthDomainEnforcement,
  type TenantAuthDomainRecord,
} from "@/lib/admin-auth-domains-api";
import { successMessageForAuthDomainEnforcementModeChange } from "@/lib/auth-domains-enum-labels";
import {
  AUTH_DOMAINS_MUTATION_ERROR_SUMMARY,
  AUTH_DOMAINS_MUTATION_RECOVERY,
  successMessageForAuthDomainAction,
} from "@/lib/auth-domains-page-copy";
import { writeAuthDomainLastViewedId } from "@/lib/resolve-continue-last-auth-domain";

import type { AuthDomainsInlineError, AuthDomainsRefreshOptions } from "./use-auth-domains-page-refresh";

export type EnforcementModeRequest = {
  readonly enforcementMode: string;
  readonly allowEmailOtpRecovery: boolean;
};

type UseAuthDomainsPageEnforcementParams = {
  readonly selectedDomain: string | null;
  readonly selected: TenantAuthDomainRecord | null;
  readonly mutationsBlocked: boolean;
  readonly pendingConfirm: AuthDomainsPendingConfirm | null;
  readonly setPendingConfirm: Dispatch<SetStateAction<AuthDomainsPendingConfirm | null>>;
  readonly setErrorState: Dispatch<SetStateAction<AuthDomainsInlineError | null>>;
  readonly setStatusMessage: Dispatch<SetStateAction<string | null>>;
  readonly setBusy: Dispatch<SetStateAction<boolean>>;
  readonly refreshDomains: () => Promise<void>;
  readonly refreshRecoveryAdmins: (normalizedDomain: string, options?: AuthDomainsRefreshOptions) => Promise<void>;
  readonly refreshReadiness: (normalizedDomain: string, options?: AuthDomainsRefreshOptions) => Promise<void>;
};

export function useAuthDomainsPageEnforcement(params: UseAuthDomainsPageEnforcementParams) {
  const {
    selectedDomain,
    selected,
    mutationsBlocked,
    pendingConfirm,
    setPendingConfirm,
    setErrorState,
    setStatusMessage,
    setBusy,
    refreshDomains,
    refreshRecoveryAdmins,
    refreshReadiness,
  } = params;

  function setMutationError(): void {
    setErrorState({
      summary: AUTH_DOMAINS_MUTATION_ERROR_SUMMARY,
      recovery: AUTH_DOMAINS_MUTATION_RECOVERY,
    });
  }

  function requestEnableEnforcement() {
    if (selectedDomain === null || mutationsBlocked) {
      return;
    }

    setPendingConfirm({ kind: "enable-enforcement" });
  }

  function requestSetEnforcementMode(request: EnforcementModeRequest) {
    if (selectedDomain === null || mutationsBlocked || selected === null) {
      return;
    }

    setPendingConfirm({
      kind: "set-enforcement-mode",
      displayDomain: selected.displayDomain,
      enforcementMode: request.enforcementMode,
      allowEmailOtpRecovery: request.allowEmailOtpRecovery,
    });
  }

  async function executeSetEnforcementMode(request: EnforcementModeRequest) {
    if (selectedDomain === null || mutationsBlocked || selected === null) {
      return;
    }

    setErrorState(null);
    setStatusMessage(null);

    setBusy(true);

    try {
      await setTenantAuthDomainEnforcement(
        selectedDomain,
        request.enforcementMode,
        request.allowEmailOtpRecovery,
      );
      writeAuthDomainLastViewedId(selectedDomain);
      setStatusMessage(
        successMessageForAuthDomainEnforcementModeChange(selected.displayDomain, request.enforcementMode),
      );
      await refreshDomains();
      await refreshReadiness(selectedDomain, { surfaceError: true });
    } catch {
      setMutationError();
    } finally {
      setBusy(false);
    }
  }

  async function executeEnableEnforcement() {
    if (selectedDomain === null || mutationsBlocked || selected === null) {
      return;
    }

    setErrorState(null);
    setStatusMessage(null);

    setBusy(true);

    try {
      await enableTenantAuthDomainEnforcement(selectedDomain, true);
      writeAuthDomainLastViewedId(selectedDomain);
      setStatusMessage(successMessageForAuthDomainAction("SSO enforcement enabled", selected.displayDomain));
      await refreshDomains();
      await refreshReadiness(selectedDomain, { surfaceError: true });
    } catch {
      setMutationError();
    } finally {
      setBusy(false);
    }
  }

  async function handleConfirmPendingAction() {
    if (pendingConfirm === null || mutationsBlocked) {
      return;
    }

    if (pendingConfirm.kind === "enable-enforcement") {
      setPendingConfirm(null);
      await executeEnableEnforcement();

      return;
    }

    if (pendingConfirm.kind === "set-enforcement-mode") {
      const request: EnforcementModeRequest = {
        enforcementMode: pendingConfirm.enforcementMode,
        allowEmailOtpRecovery: pendingConfirm.allowEmailOtpRecovery,
      };

      setPendingConfirm(null);
      await executeSetEnforcementMode(request);

      return;
    }

    if (selectedDomain === null) {
      setPendingConfirm(null);
      return;
    }

    setErrorState(null);
    setStatusMessage(null);

    setBusy(true);

    try {
      await removeTenantAuthDomainRecoveryAdmin(
        selectedDomain,
        pendingConfirm.normalizedRecoveryAdminEmail,
        true,
      );
      setPendingConfirm(null);
      await refreshRecoveryAdmins(selectedDomain, { surfaceError: true });
      await refreshReadiness(selectedDomain, { surfaceError: true });
    } catch {
      setMutationError();
    } finally {
      setBusy(false);
    }
  }

  return {
    requestEnableEnforcement,
    requestSetEnforcementMode,
    handleConfirmPendingAction,
  };
}
