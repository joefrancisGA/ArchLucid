"use client";

import { useRef, useState, type Dispatch, type RefObject, type SetStateAction } from "react";

import { type AuthDomainsPendingConfirm } from "@/app/(operator)/administration/auth-domains/AuthDomainsActionConfirmDialog";
import { useOperatorNavAuthority } from "@/components/operator/OperatorNavAuthorityProvider";
import {
  type TenantAuthDomainEnforcementReadiness,
  type TenantAuthDomainRecord,
  type TenantAuthDomainRecoveryAdminRecord,
} from "@/lib/admin-auth-domains-api";
import {
  AUTH_DOMAINS_ADMIN_AUTHORITY_READY_LABEL,
  authDomainsAdminAuthorityPresentation,
  authDomainsTenantScopeLine,
  authDomainsTenantSignInPosture,
  isPlausibleAuthDomainInput,
  resolveAuthDomainsJourneyStep,
  type AuthDomainsJourneyStepId,
} from "@/lib/auth-domains-page-copy";
import { AUTHORITY_RANK } from "@/lib/nav-authority";
import { whyDisabledNeedsRole, type WhyDisabledCtaReason } from "@/lib/why-disabled-cta";

import { useAuthDomainsPageActions } from "./use-auth-domains-page-actions";
import { useAuthDomainsPageEnforcement, type EnforcementModeRequest } from "./use-auth-domains-page-enforcement";
import { useAuthDomainsPageRefresh, type AuthDomainsInlineError } from "./use-auth-domains-page-refresh";

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

  const { refreshDomains, refreshRecoveryAdmins, refreshReadiness } = useAuthDomainsPageRefresh({
    selectedDomain,
    setDomains,
    setLoading,
    setErrorState,
    setRecoveryAdmins,
    setReadiness,
    setCurrentWorkspaceLabel,
    pendingJourneyScrollRef,
  });

  const selected = domains.find((row) => row.normalizedDomain === selectedDomain) ?? null;
  const currentJourneyStep = resolveAuthDomainsJourneyStep({
    domainCount: domains.length,
    selectedDomain: selected,
    domains,
  });

  const {
    handleProposeDomain,
    runForSelected,
    handlePreviewRouting,
    handleMarkRoutingTested,
    handleRemoveRecoveryAdmin,
    handleAddRecoveryAdmin,
    scrollToJourneySection,
  } = useAuthDomainsPageActions({
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
  });

  const { requestEnableEnforcement, requestSetEnforcementMode, handleConfirmPendingAction } =
    useAuthDomainsPageEnforcement({
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
    });

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
