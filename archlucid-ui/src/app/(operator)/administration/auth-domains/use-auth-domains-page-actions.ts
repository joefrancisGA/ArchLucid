"use client";

import { type Dispatch, type RefObject, type SetStateAction } from "react";

import { type AuthDomainsPendingConfirm } from "@/app/(operator)/administration/auth-domains/AuthDomainsActionConfirmDialog";
import {
  addTenantAuthDomainRecoveryAdmin,
  markTenantAuthDomainRoutingTested,
  proposeTenantAuthDomain,
  removeTenantAuthDomainRecoveryAdmin,
  testTenantAuthDomainRouting,
  type TenantAuthDomainRecord,
  type TenantAuthDomainRecoveryAdminRecord,
} from "@/lib/admin-auth-domains-api";
import {
  AUTH_DOMAINS_JOURNEY_SECTION_IDS,
  AUTH_DOMAINS_MUTATION_ERROR_SUMMARY,
  AUTH_DOMAINS_MUTATION_RECOVERY,
  successMessageForAuthDomainAction,
  type AuthDomainsJourneyStepId,
} from "@/lib/auth-domains-page-copy";
import { writeAuthDomainLastViewedId } from "@/lib/resolve-continue-last-auth-domain";

import type { AuthDomainsInlineError, AuthDomainsRefreshOptions } from "./use-auth-domains-page-refresh";

type AuthDomainSelectedAction = (domain: string) => Promise<{ dnsVerificationInstruction?: string }>;

type UseAuthDomainsPageActionsParams = {
  readonly domains: TenantAuthDomainRecord[];
  readonly selectedDomain: string | null;
  readonly selected: TenantAuthDomainRecord | null;
  readonly mutationsBlocked: boolean;
  readonly newDomain: string;
  readonly newDomainValid: boolean;
  readonly testEmail: string;
  readonly recoveryEmail: string;
  readonly setNewDomainTouched: Dispatch<SetStateAction<boolean>>;
  readonly setErrorState: Dispatch<SetStateAction<AuthDomainsInlineError | null>>;
  readonly setStatusMessage: Dispatch<SetStateAction<string | null>>;
  readonly setBusy: Dispatch<SetStateAction<boolean>>;
  readonly setDnsInstruction: Dispatch<SetStateAction<string | null>>;
  readonly setNewDomain: Dispatch<SetStateAction<string>>;
  readonly setSelectedDomain: Dispatch<SetStateAction<string | null>>;
  readonly setRecoveryEmail: Dispatch<SetStateAction<string>>;
  readonly setPendingConfirm: Dispatch<SetStateAction<AuthDomainsPendingConfirm | null>>;
  readonly newDomainInputRef: RefObject<HTMLInputElement | null>;
  readonly pendingJourneyScrollRef: RefObject<AuthDomainsJourneyStepId | null>;
  readonly refreshDomains: () => Promise<void>;
  readonly refreshRecoveryAdmins: (normalizedDomain: string, options?: AuthDomainsRefreshOptions) => Promise<void>;
  readonly refreshReadiness: (normalizedDomain: string, options?: AuthDomainsRefreshOptions) => Promise<void>;
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

export function useAuthDomainsPageActions(params: UseAuthDomainsPageActionsParams) {
  const {
    domains,
    selectedDomain,
    selected,
    mutationsBlocked,
    newDomain,
    newDomainValid,
    testEmail,
    recoveryEmail,
    setNewDomainTouched,
    setErrorState,
    setStatusMessage,
    setBusy,
    setDnsInstruction,
    setNewDomain,
    setSelectedDomain,
    setRecoveryEmail,
    setPendingConfirm,
    newDomainInputRef,
    pendingJourneyScrollRef,
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

  async function handleProposeDomain() {
    setNewDomainTouched(true);

    if (mutationsBlocked || !newDomainValid) {
      return;
    }

    setErrorState(null);
    setStatusMessage(null);

    setBusy(true);

    try {
      const response = await proposeTenantAuthDomain(newDomain.trim());
      setDnsInstruction(response.dnsVerificationInstruction);
      setNewDomain("");
      setNewDomainTouched(false);
      setSelectedDomain(response.domain.normalizedDomain);
      writeAuthDomainLastViewedId(response.domain.normalizedDomain);
      setStatusMessage(`Domain ${response.domain.displayDomain} added. Verify DNS ownership before enforcement.`);
      await refreshDomains();
    } catch {
      setMutationError();
    } finally {
      setBusy(false);
    }
  }

  async function runForSelected(action: AuthDomainSelectedAction, successLabel: string) {
    if (selectedDomain === null || mutationsBlocked || selected === null) {
      return;
    }

    setErrorState(null);
    setStatusMessage(null);

    setBusy(true);

    try {
      const response = await action(selectedDomain);
      writeAuthDomainLastViewedId(selectedDomain);

      if (response.dnsVerificationInstruction) {
        setDnsInstruction(response.dnsVerificationInstruction);
      }

      setStatusMessage(successMessageForAuthDomainAction(successLabel, selected.displayDomain));
      await refreshDomains();
    } catch {
      setMutationError();
    } finally {
      setBusy(false);
    }
  }

  async function handlePreviewRouting() {
    if (selectedDomain === null || mutationsBlocked || selected === null) {
      return;
    }

    setErrorState(null);
    setStatusMessage(null);

    setBusy(true);

    try {
      const preview = await testTenantAuthDomainRouting(selectedDomain, testEmail.trim());
      setStatusMessage(
        preview.ssoRequired
          ? `Preview for ${selected.displayDomain}: SSO would be required for this email.`
          : `Preview for ${selected.displayDomain}: email code would remain available.`,
      );
    } catch {
      setMutationError();
    } finally {
      setBusy(false);
    }
  }

  async function handleMarkRoutingTested() {
    if (selectedDomain === null || mutationsBlocked || selected === null) {
      return;
    }

    setErrorState(null);
    setStatusMessage(null);

    setBusy(true);

    try {
      await markTenantAuthDomainRoutingTested(selectedDomain, testEmail.trim());
      setStatusMessage(successMessageForAuthDomainAction("Routing test recorded", selected.displayDomain));
      await refreshDomains();
      await refreshReadiness(selectedDomain, { surfaceError: true });
      await refreshRecoveryAdmins(selectedDomain, { surfaceError: true });
    } catch {
      setMutationError();
    } finally {
      setBusy(false);
    }
  }

  async function handleRemoveRecoveryAdmin(row: TenantAuthDomainRecoveryAdminRecord) {
    if (selectedDomain === null || mutationsBlocked) {
      return;
    }

    setErrorState(null);
    setStatusMessage(null);

    setBusy(true);

    try {
      const result = await removeTenantAuthDomainRecoveryAdmin(
        selectedDomain,
        row.normalizedRecoveryAdminEmail,
        false,
      );

      if (!result.removed && result.warningMessage) {
        setPendingConfirm({
          kind: "recovery-remove",
          normalizedRecoveryAdminEmail: row.normalizedRecoveryAdminEmail,
          displayRecoveryAdminEmail: row.displayRecoveryAdminEmail,
          warningMessage: result.warningMessage,
        });
        return;
      }

      await refreshRecoveryAdmins(selectedDomain, { surfaceError: true });
      await refreshReadiness(selectedDomain, { surfaceError: true });
    } catch {
      setMutationError();
    } finally {
      setBusy(false);
    }
  }

  async function handleAddRecoveryAdmin() {
    if (selectedDomain === null || mutationsBlocked || !recoveryEmail.trim()) {
      return;
    }

    setErrorState(null);
    setStatusMessage(null);

    setBusy(true);

    try {
      await addTenantAuthDomainRecoveryAdmin(selectedDomain, recoveryEmail.trim());
      setRecoveryEmail("");
      await refreshRecoveryAdmins(selectedDomain, { surfaceError: true });
      await refreshReadiness(selectedDomain, { surfaceError: true });
    } catch {
      setMutationError();
    } finally {
      setBusy(false);
    }
  }

  function scrollToJourneySection(stepId: AuthDomainsJourneyStepId): void {
    const target = document.getElementById(AUTH_DOMAINS_JOURNEY_SECTION_IDS[stepId]);

    if (target !== null) {
      focusJourneySection(stepId);

      return;
    }

    if (stepId !== "add" && domains.length > 0 && selectedDomain === null) {
      pendingJourneyScrollRef.current = stepId;
      setSelectedDomain(domains[0]?.normalizedDomain ?? null);

      return;
    }

    if (stepId === "add") {
      newDomainInputRef.current?.focus();

      return;
    }

    document.getElementById("auth-domains-journey-target-domains")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return {
    handleProposeDomain,
    runForSelected,
    handlePreviewRouting,
    handleMarkRoutingTested,
    handleRemoveRecoveryAdmin,
    handleAddRecoveryAdmin,
    scrollToJourneySection,
  };
}
