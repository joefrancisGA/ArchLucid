"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState, type Dispatch, type RefObject, type SetStateAction } from "react";

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
import {
  authDomainsSelectionConfirmHrefFromSearch,
  parseAuthConfirmKindFromSearch,
  parseAuthDomainFromSearch,
  parseAuthEnforcementModeFromSearch,
  parseAuthOtpRecoveryFromSearch,
  parseAuthRecoveryEmailFromSearch,
} from "@/lib/administration/auth-domains-selection-confirm-url";
import { AUTHORITY_RANK } from "@/lib/nav-authority";
import { SETTINGS_AUTH_DOMAINS_PATH } from "@/lib/settings-admin-route-paths";
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

function resolvePendingConfirmFromUrl(
  confirmKind: ReturnType<typeof parseAuthConfirmKindFromSearch>,
  selected: TenantAuthDomainRecord | null,
  recoveryAdmins: TenantAuthDomainRecoveryAdminRecord[],
  enforcementMode: string,
  allowEmailOtpRecovery: boolean,
  recoveryAdminEmail: string,
): AuthDomainsPendingConfirm | null {
  if (confirmKind === null || selected === null) {
    return null;
  }

  if (confirmKind === "enable-enforcement") {
    return { kind: "enable-enforcement" };
  }

  if (confirmKind === "set-enforcement-mode") {
    if (enforcementMode.length === 0) {
      return null;
    }

    return {
      kind: "set-enforcement-mode",
      displayDomain: selected.displayDomain,
      enforcementMode,
      allowEmailOtpRecovery,
    };
  }

  if (recoveryAdminEmail.length === 0) {
    return null;
  }

  const recoveryAdmin =
    recoveryAdmins.find((row) => row.normalizedRecoveryAdminEmail === recoveryAdminEmail) ?? null;

  if (recoveryAdmin === null) {
    return null;
  }

  return {
    kind: "recovery-remove",
    normalizedRecoveryAdminEmail: recoveryAdmin.normalizedRecoveryAdminEmail,
    displayRecoveryAdminEmail: recoveryAdmin.displayRecoveryAdminEmail,
    warningMessage: "Confirm removal of this recovery administrator.",
  };
}

function pendingConfirmToUrlState(
  selectedDomain: string | null,
  pendingConfirm: AuthDomainsPendingConfirm | null,
): Parameters<typeof authDomainsSelectionConfirmHrefFromSearch>[1] {
  if (pendingConfirm === null) {
    return {
      selectedDomain,
      confirmKind: null,
      enforcementMode: null,
      allowEmailOtpRecovery: false,
      recoveryAdminEmail: null,
    };
  }

  if (pendingConfirm.kind === "enable-enforcement") {
    return {
      selectedDomain,
      confirmKind: "enable-enforcement",
      enforcementMode: null,
      allowEmailOtpRecovery: false,
      recoveryAdminEmail: null,
    };
  }

  if (pendingConfirm.kind === "set-enforcement-mode") {
    return {
      selectedDomain,
      confirmKind: "set-enforcement-mode",
      enforcementMode: pendingConfirm.enforcementMode,
      allowEmailOtpRecovery: pendingConfirm.allowEmailOtpRecovery,
      recoveryAdminEmail: null,
    };
  }

  return {
    selectedDomain,
    confirmKind: "recovery-remove",
    enforcementMode: null,
    allowEmailOtpRecovery: false,
    recoveryAdminEmail: pendingConfirm.normalizedRecoveryAdminEmail,
  };
}

export function useAuthDomainsPage(): UseAuthDomainsPageModel {
  const router = useRouter();
  const pathname = usePathname() ?? SETTINGS_AUTH_DOMAINS_PATH;
  const searchParams = useSearchParams();
  const urlAuthDomain = parseAuthDomainFromSearch(searchParams.get("authDomain"));
  const urlAuthConfirm = parseAuthConfirmKindFromSearch(searchParams.get("authConfirm"));
  const urlEnforcementMode = parseAuthEnforcementModeFromSearch(searchParams.get("authEnforcementMode"));
  const urlOtpRecovery = parseAuthOtpRecoveryFromSearch(searchParams.get("authOtpRecovery"));
  const urlRecoveryEmail = parseAuthRecoveryEmailFromSearch(searchParams.get("authRecoveryEmail"));

  const [domains, setDomains] = useState<TenantAuthDomainRecord[]>([]);
  const [selectedDomain, setSelectedDomainState] = useState<string | null>(null);
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
  const [pendingConfirm, setPendingConfirmState] = useState<AuthDomainsPendingConfirm | null>(null);
  const [currentWorkspaceLabel, setCurrentWorkspaceLabel] = useState<string | null>(null);
  const newDomainInputRef = useRef<HTMLInputElement>(null);
  const pendingJourneyScrollRef = useRef<AuthDomainsJourneyStepId | null>(null);
  const { callerAuthorityRank } = useOperatorNavAuthority();

  const syncAuthDomainsToUrl = useCallback(
    (nextSelectedDomain: string | null, nextPendingConfirm: AuthDomainsPendingConfirm | null) => {
      router.replace(
        authDomainsSelectionConfirmHrefFromSearch(
          searchParams.toString(),
          pendingConfirmToUrlState(nextSelectedDomain, nextPendingConfirm),
          pathname,
        ),
        { scroll: false },
      );
    },
    [pathname, router, searchParams],
  );

  const setSelectedDomain = useCallback(
    (value: SetStateAction<string | null>) => {
      setSelectedDomainState((current) => {
        const next = typeof value === "function" ? value(current) : value;
        syncAuthDomainsToUrl(next, pendingConfirm);

        return next;
      });
    },
    [pendingConfirm, syncAuthDomainsToUrl],
  );

  const setPendingConfirm = useCallback(
    (value: SetStateAction<AuthDomainsPendingConfirm | null>) => {
      setPendingConfirmState((current) => {
        const next = typeof value === "function" ? value(current) : value;
        syncAuthDomainsToUrl(selectedDomain, next);

        return next;
      });
    },
    [selectedDomain, syncAuthDomainsToUrl],
  );

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

  useEffect(() => {
    if (urlAuthDomain.length === 0 || domains.length === 0) {
      return;
    }

    const exists = domains.some((row) => row.normalizedDomain === urlAuthDomain);

    if (!exists) {
      return;
    }

    setSelectedDomainState((current) => (current === urlAuthDomain ? current : urlAuthDomain));
  }, [domains, urlAuthDomain]);

  useEffect(() => {
    if (urlAuthConfirm === null) {
      if (pendingConfirm !== null) {
        setPendingConfirmState(null);
      }

      return;
    }

    const domainForConfirm = urlAuthDomain.length > 0 ? urlAuthDomain : selectedDomain;
    const domainRow = domains.find((row) => row.normalizedDomain === domainForConfirm) ?? null;
    const nextPending = resolvePendingConfirmFromUrl(
      urlAuthConfirm,
      domainRow,
      recoveryAdmins,
      urlEnforcementMode,
      urlOtpRecovery,
      urlRecoveryEmail,
    );

    if (nextPending === null) {
      return;
    }

    if (JSON.stringify(pendingConfirm) === JSON.stringify(nextPending)) {
      return;
    }

    setPendingConfirmState(nextPending);
  }, [
    domains,
    pendingConfirm,
    recoveryAdmins,
    selectedDomain,
    urlAuthConfirm,
    urlAuthDomain,
    urlEnforcementMode,
    urlOtpRecovery,
    urlRecoveryEmail,
  ]);

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
