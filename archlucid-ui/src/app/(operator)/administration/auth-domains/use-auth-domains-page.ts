"use client";

import { useCallback, useEffect, useRef, useState, type Dispatch, type RefObject, type SetStateAction } from "react";

import { type AuthDomainsPendingConfirm } from "@/app/(operator)/administration/auth-domains/AuthDomainsActionConfirmDialog";
import { useOperatorNavAuthority } from "@/components/operator/OperatorNavAuthorityProvider";
import {
  addTenantAuthDomainRecoveryAdmin,
  enableTenantAuthDomainEnforcement,
  fetchTenantAuthDomainEnforcementReadiness,
  fetchTenantAuthDomainRecoveryAdmins,
  fetchTenantAuthDomains,
  markTenantAuthDomainRoutingTested,
  proposeTenantAuthDomain,
  removeTenantAuthDomainRecoveryAdmin,
  setTenantAuthDomainEnforcement,
  testTenantAuthDomainRouting,
  type TenantAuthDomainEnforcementReadiness,
  type TenantAuthDomainRecord,
  type TenantAuthDomainRecoveryAdminRecord,
} from "@/lib/admin-auth-domains-api";
import { successMessageForAuthDomainEnforcementModeChange } from "@/lib/auth-domains-enum-labels";
import {
  AUTH_DOMAINS_ADMIN_AUTHORITY_READY_LABEL,
  AUTH_DOMAINS_JOURNEY_SECTION_IDS,
  AUTH_DOMAINS_LIST_LOAD_ERROR_SUMMARY,
  AUTH_DOMAINS_LIST_LOAD_RECOVERY,
  AUTH_DOMAINS_MUTATION_ERROR_SUMMARY,
  AUTH_DOMAINS_MUTATION_RECOVERY,
  authDomainsAdminAuthorityPresentation,
  authDomainsTenantScopeLine,
  authDomainsTenantSignInPosture,
  isPlausibleAuthDomainInput,
  resolveAuthDomainsCurrentWorkspaceLabel,
  resolveAuthDomainsJourneyStep,
  successMessageForAuthDomainAction,
  type AuthDomainsJourneyStepId,
} from "@/lib/auth-domains-page-copy";
import { AUTHORITY_RANK } from "@/lib/nav-authority";
import { readOperatorScopeFromStorage } from "@/lib/operator/operator-scope-storage";
import { whyDisabledNeedsRole, type WhyDisabledCtaReason } from "@/lib/why-disabled-cta";
import { writeAuthDomainLastViewedId } from "@/lib/resolve-continue-last-auth-domain";

type RefreshOptions = {
  readonly surfaceError?: boolean;
};

type EnforcementModeRequest = {
  readonly enforcementMode: string;
  readonly allowEmailOtpRecovery: boolean;
};

type AuthDomainsInlineError = {
  readonly summary: string;
  readonly recovery: typeof AUTH_DOMAINS_MUTATION_RECOVERY;
};

type AuthDomainSelectedAction = import("./AuthDomainsVerificationPanel").AuthDomainSelectedAction;

export type UseAuthDomainsPageModel = {
  readonly domains: TenantAuthDomainRecord[];
  readonly selectedDomain: string | null;
  readonly setSelectedDomain: Dispatch<SetStateAction<string | null>>;
  readonly recoveryAdmins: TenantAuthDomainRecoveryAdminRecord[];
  readonly readiness: TenantAuthDomainEnforcementReadiness | null;
  readonly sessionAcknowledged: boolean;
  readonly setSessionAcknowledged: Dispatch<SetStateAction<boolean>>;
  readonly newDomain: string;
  readonly setNewDomain: Dispatch<SetStateAction<string>>;
  readonly setNewDomainTouched: Dispatch<SetStateAction<boolean>>;
  readonly testEmail: string;
  readonly setTestEmail: Dispatch<SetStateAction<string>>;
  readonly recoveryEmail: string;
  readonly setRecoveryEmail: Dispatch<SetStateAction<string>>;
  readonly dnsInstruction: string | null;
  readonly setDnsInstruction: Dispatch<SetStateAction<string | null>>;
  readonly statusMessage: string | null;
  readonly errorState: AuthDomainsInlineError | null;
  readonly loading: boolean;
  readonly busy: boolean;
  readonly pendingConfirm: AuthDomainsPendingConfirm | null;
  readonly setPendingConfirm: Dispatch<SetStateAction<AuthDomainsPendingConfirm | null>>;
  readonly currentWorkspaceLabel: string | null;
  readonly newDomainInputRef: RefObject<HTMLInputElement | null>;
  readonly tenantScopeLine: string;
  readonly adminAuthorityPresentation: ReturnType<typeof authDomainsAdminAuthorityPresentation>;
  readonly adminAuthorityDisabledReason: WhyDisabledCtaReason | null;
  readonly mutationsBlocked: boolean;
  readonly signInPosture: ReturnType<typeof authDomainsTenantSignInPosture>;
  readonly newDomainValid: boolean;
  readonly showNewDomainFormatError: boolean;
  readonly selected: TenantAuthDomainRecord | null;
  readonly currentJourneyStep: ReturnType<typeof resolveAuthDomainsJourneyStep>;
  readonly handleProposeDomain: () => Promise<void>;
  readonly runForSelected: (action: AuthDomainSelectedAction, successLabel: string) => Promise<void>;
  readonly handlePreviewRouting: () => Promise<void>;
  readonly handleMarkRoutingTested: () => Promise<void>;
  readonly requestEnableEnforcement: () => void;
  readonly requestSetEnforcementMode: (request: EnforcementModeRequest) => void;
  readonly handleConfirmPendingAction: () => Promise<void>;
  readonly handleRemoveRecoveryAdmin: (row: TenantAuthDomainRecoveryAdminRecord) => Promise<void>;
  readonly handleAddRecoveryAdmin: () => Promise<void>;
  readonly scrollToJourneySection: (stepId: AuthDomainsJourneyStepId) => void;
};

export function useAuthDomainsPage(): UseAuthDomainsPageModel {
  const [domains, setDomains] = useState<TenantAuthDomainRecord[]>([]);
  const [selectedDomain, setSelectedDomain] = useState<string | null>(null);
  const [recoveryAdmins, setRecoveryAdmins] = useState<TenantAuthDomainRecoveryAdminRecord[]>([]);
  const [readiness, setReadiness] = useState<TenantAuthDomainEnforcementReadiness | null>(null);
  const [sessionAcknowledged, setSessionAcknowledged] = useState(false);
  const [newDomain, setNewDomain] = useState("");
  const [newDomainTouched, setNewDomainTouched] = useState(false);
  const [testEmail, setTestEmail] = useState("");
  const [recoveryEmail, setRecoveryEmail] = useState("");
  const [dnsInstruction, setDnsInstruction] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorState, setErrorState] = useState<AuthDomainsInlineError | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [pendingConfirm, setPendingConfirm] = useState<AuthDomainsPendingConfirm | null>(null);
  const [currentWorkspaceLabel, setCurrentWorkspaceLabel] = useState<string | null>(null);
  const newDomainInputRef = useRef<HTMLInputElement>(null);
  const pendingJourneyScrollRef = useRef<AuthDomainsJourneyStepId | null>(null);
  const { callerAuthorityRank } = useOperatorNavAuthority();

  const tenantScopeLine = authDomainsTenantScopeLine(currentWorkspaceLabel);
  const hasAdminAuthority = callerAuthorityRank >= AUTHORITY_RANK.AdminAuthority;
  const adminAuthorityPresentation = authDomainsAdminAuthorityPresentation(hasAdminAuthority);
  /**
   * Every endpoint on this page lives under `/admin/identity/domains`, so a viewer below admin rank
   * cannot complete any of these actions. Disabling the controls and naming the reason is honest;
   * leaving them live only trades a clear precondition for a generic mutation error after the click.
   */
  const adminAuthorityDisabledReason = hasAdminAuthority
    ? null
    : whyDisabledNeedsRole(AUTH_DOMAINS_ADMIN_AUTHORITY_READY_LABEL);
  const mutationsBlocked = busy || !hasAdminAuthority;
  const signInPosture = authDomainsTenantSignInPosture(domains);
  const newDomainValid = isPlausibleAuthDomainInput(newDomain);
  const showNewDomainFormatError = newDomainTouched && newDomain.trim().length > 0 && !newDomainValid;

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
  }, []);

  const refreshRecoveryAdmins = useCallback(async (normalizedDomain: string, options?: RefreshOptions) => {
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
  }, []);

  const refreshReadiness = useCallback(async (normalizedDomain: string, options?: RefreshOptions) => {
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
  }, []);

  // Scope is browser-persisted, so it is absent during the server render. Reading it after mount
  // keeps the first client paint byte-identical to the server markup instead of tripping hydration.
  useEffect(() => {
    setCurrentWorkspaceLabel(resolveAuthDomainsCurrentWorkspaceLabel(readOperatorScopeFromStorage()));
  }, []);

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
  }, [refreshReadiness, refreshRecoveryAdmins, selectedDomain]);

  useEffect(() => {
    if (pendingJourneyScrollRef.current === null || selectedDomain === null) {
      return;
    }

    const stepId = pendingJourneyScrollRef.current;
    pendingJourneyScrollRef.current = null;

    requestAnimationFrame(() => {
      focusJourneySection(stepId);
    });
  }, [selectedDomain]);

  const selected = domains.find((row) => row.normalizedDomain === selectedDomain) ?? null;
  const currentJourneyStep = resolveAuthDomainsJourneyStep({
    domainCount: domains.length,
    selectedDomain: selected,
    domains,
  });

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
    domains,
    selectedDomain,
    setSelectedDomain,
    recoveryAdmins,
    readiness,
    sessionAcknowledged,
    setSessionAcknowledged,
    newDomain,
    setNewDomain,
    setNewDomainTouched,
    testEmail,
    setTestEmail,
    recoveryEmail,
    setRecoveryEmail,
    dnsInstruction,
    setDnsInstruction,
    statusMessage,
    errorState,
    loading,
    busy,
    pendingConfirm,
    setPendingConfirm,
    currentWorkspaceLabel,
    newDomainInputRef,
    tenantScopeLine,
    adminAuthorityPresentation,
    adminAuthorityDisabledReason,
    mutationsBlocked,
    signInPosture,
    newDomainValid,
    showNewDomainFormatError,
    selected,
    currentJourneyStep,
    handleProposeDomain,
    runForSelected,
    handlePreviewRouting,
    handleMarkRoutingTested,
    requestEnableEnforcement,
    requestSetEnforcementMode,
    handleConfirmPendingAction,
    handleRemoveRecoveryAdmin,
    handleAddRecoveryAdmin,
    scrollToJourneySection,
  };
}
