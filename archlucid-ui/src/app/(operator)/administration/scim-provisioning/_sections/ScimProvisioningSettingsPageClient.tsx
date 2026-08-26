"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

import { OperatorMutationInlineError } from "@/components/operator/OperatorMutationInlineError";
import { OperatorSuccessCallout } from "@/components/operator/OperatorSuccessCallout";
import { OperatorPageContainer } from "@/components/operator/OperatorPageContainer";
import { OperatorPageHeader } from "@/components/operator/OperatorPageHeader";
import { ScimIdentityProvidersVocabularyRail } from "@/components/ScimIdentityProvidersVocabularyRail";

import { PageContextualHelpButton } from "@/components/usability/PageContextualHelpButton";
import { ScimProvisioningSettingsEvidenceOrientationStrip } from "@/components/evidence-orientation/registry/claim-and-sources-strips";
import { ScimProvisioningCreateConfirmDialog } from "@/app/(operator)/administration/scim-provisioning/_sections/ScimProvisioningCreateConfirmDialog";
import { ScimProvisioningRevokeConfirmDialog } from "@/app/(operator)/administration/scim-provisioning/_sections/ScimProvisioningRevokeConfirmDialog";
import {
  ScimProvisioningActiveTokensTable,
  type ScimTokenSummary,
  type ScimTokensLoadState,
} from "@/app/(operator)/administration/scim-provisioning/_sections/ScimProvisioningActiveTokensTable";
import {
  ScimProvisioningIssueTokenSection,
  type ScimTokenIssueResponse,
  type VerifyState,
} from "@/app/(operator)/administration/scim-provisioning/_sections/ScimProvisioningIssueTokenSection";
import { OPERATOR_LAYOUT, OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { mergeRegistrationScopeForProxy } from "@/lib/proxy-fetch-registration-scope";
import {
  classifyScimBaseUrl,
  SCIM_SERVICE_PROVIDER_CONFIG_PATH,
  type ScimBaseUrlClassification,
} from "@/lib/scim-provisioning-base-url";
import {
  SCIM_IDENTITY_PROVIDERS_HREF,
  SCIM_PROVISIONING_PAGE_REASSURANCE,
  SCIM_PROVISIONING_PAGE_SUBTITLE,
  SCIM_PROVISIONING_PAGE_TITLE,
  SCIM_SSO_CONTEXT_NOTE_LINK,
  SCIM_SSO_CONTEXT_NOTE_PREFIX,
  SCIM_SSO_CONTEXT_NOTE_SUFFIX,
  SCIM_TOKEN_COPIED_ACTION,
  SCIM_BASE_URL_COPIED_ACTION,
  SCIM_TOKENS_LOAD_BLOCKED,
  SCIM_TOKENS_LOAD_FAILED,
  SCIM_VERIFY_MISSING_TOKEN,
  SCIM_VERIFY_STATUS_VERIFIED,
  SCIM_VERIFYING_ACTION,
} from "@/lib/scim-provisioning-page-copy";
import {
  SCIM_TOKEN_CREATE_FAILED_MESSAGE,
  SCIM_TOKEN_CREATED_SUCCESS_MESSAGE,
  SCIM_TOKEN_REVOKE_FAILED_MESSAGE,
  SCIM_TOKEN_REVOKED_SUCCESS_MESSAGE,
} from "@/lib/admin-integration-mutation-outcome-copy";
import {
  buildScimVerifyFailureDetails,
  buildScimVerifyFailureMessage,
} from "@/lib/scim-provisioning-verify-present";
import {
  resolveScimIssueTokenEmphasizedStepId,
  resolveScimIssueTokenSteps,
} from "@/lib/scim-issue-token-checklist";

const tokensPath = "/api/proxy/v1/admin/scim/tokens";

async function copyText(value: string): Promise<void> {
  if (typeof navigator === "undefined" || navigator.clipboard === undefined) {
    return;
  }

  await navigator.clipboard.writeText(value);
}

/** SCIM inbound provisioning administration — token lifecycle and connectivity verification. */
export function ScimProvisioningSettingsPageClient() {
  const [state, setState] = useState<ScimTokensLoadState>({ status: "idle" });
  const [scimBaseUrlClassification, setScimBaseUrlClassification] = useState<ScimBaseUrlClassification | null>(
    null,
  );
  const [issuedToken, setIssuedToken] = useState<ScimTokenIssueResponse | null>(null);
  const [setupSessionToken, setSetupSessionToken] = useState<string | null>(null);
  const [manualVerifyToken, setManualVerifyToken] = useState("");
  const [verifyState, setVerifyState] = useState<VerifyState>({ status: "idle" });
  const [issuing, setIssuing] = useState(false);
  const [revokingId, setRevokingId] = useState<string | null>(null);
  const [pendingRevoke, setPendingRevoke] = useState<ScimTokenSummary | null>(null);
  const [pendingCreate, setPendingCreate] = useState(false);
  const [copiedBaseUrl, setCopiedBaseUrl] = useState(false);
  const [copiedToken, setCopiedToken] = useState(false);
  const [statusAnnouncement, setStatusAnnouncement] = useState("");
  const [mutationSuccessMessage, setMutationSuccessMessage] = useState<string | null>(null);
  const [mutationErrorMessage, setMutationErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setScimBaseUrlClassification(classifyScimBaseUrl(window.location.origin));
    }
  }, []);

  const scimBaseUrl = scimBaseUrlClassification?.url ?? "";

  const load = useCallback(async () => {
    setState({ status: "loading" });

    try {
      const response = await fetch(
        tokensPath,
        mergeRegistrationScopeForProxy({ headers: { Accept: "application/json" }, cache: "no-store" }),
      );

      if (!response.ok) {
        setState({
          status: "blocked",
          message:
            response.status === 401 || response.status === 403
              ? SCIM_TOKENS_LOAD_BLOCKED
              : SCIM_TOKENS_LOAD_FAILED,
        });

        return;
      }

      const payload = (await response.json()) as { tokens?: ScimTokenSummary[] };
      setState({ status: "ready", tokens: payload.tokens ?? [] });
    } catch {
      setState({ status: "blocked", message: SCIM_TOKENS_LOAD_FAILED });
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const clearSetupSession = useCallback(() => {
    setIssuedToken(null);
    setSetupSessionToken(null);
    setManualVerifyToken("");
    setCopiedToken(false);
    setVerifyState({ status: "idle" });
  }, []);

  const createToken = useCallback(async () => {
    if (issuing || issuedToken !== null) {
      return;
    }

    setIssuing(true);
    setVerifyState({ status: "idle" });
    setMutationErrorMessage(null);
    setMutationSuccessMessage(null);

    try {
      const response = await fetch(
        tokensPath,
        mergeRegistrationScopeForProxy({ method: "POST", headers: { Accept: "application/json" } }),
      );

      if (!response.ok) {
        setMutationErrorMessage(SCIM_TOKEN_CREATE_FAILED_MESSAGE);

        return;
      }

      const payload = (await response.json()) as ScimTokenIssueResponse;
      setIssuedToken(payload);
      setSetupSessionToken(payload.plaintextToken);
      setManualVerifyToken("");
      setStatusAnnouncement(SCIM_TOKEN_CREATED_SUCCESS_MESSAGE);
      setMutationSuccessMessage(SCIM_TOKEN_CREATED_SUCCESS_MESSAGE);
      await load();
    } finally {
      setIssuing(false);
      setPendingCreate(false);
    }
  }, [issuedToken, issuing, load]);

  const verifyTokenValue = useMemo(() => {
    if (setupSessionToken !== null && setupSessionToken.trim().length > 0) {
      return setupSessionToken.trim();
    }

    return manualVerifyToken.trim();
  }, [manualVerifyToken, setupSessionToken]);

  const verifyConnection = useCallback(async () => {
    if (verifyTokenValue.length === 0) {
      setVerifyState({ status: "failed", message: SCIM_VERIFY_MISSING_TOKEN });
      setStatusAnnouncement(SCIM_VERIFY_MISSING_TOKEN);

      return;
    }

    setVerifyState({ status: "checking" });
    setStatusAnnouncement(SCIM_VERIFYING_ACTION);

    try {
      const response = await fetch(
        SCIM_SERVICE_PROVIDER_CONFIG_PATH,
        mergeRegistrationScopeForProxy({
          headers: {
            Accept: "application/scim+json, application/json",
            Authorization: `Bearer ${verifyTokenValue}`,
          },
          cache: "no-store",
        }),
      );

      if (!response.ok) {
        const details = buildScimVerifyFailureDetails(response.status);
        const message = buildScimVerifyFailureMessage();
        setVerifyState({ status: "failed", message, httpStatus: details.httpStatus });
        setStatusAnnouncement(message);

        return;
      }

      setVerifyState({ status: "verified" });
      setStatusAnnouncement(SCIM_VERIFY_STATUS_VERIFIED);
    } catch {
      const message = buildScimVerifyFailureMessage();
      setVerifyState({ status: "failed", message });
      setStatusAnnouncement(message);
    }
  }, [verifyTokenValue]);

  const revokeToken = useCallback(
    async (tokenId: string) => {
      setRevokingId(tokenId);
      setMutationErrorMessage(null);
      setMutationSuccessMessage(null);

      try {
        const response = await fetch(
          `${tokensPath}/${encodeURIComponent(tokenId)}`,
          mergeRegistrationScopeForProxy({ method: "DELETE" }),
        );

        if (!response.ok) {
          setMutationErrorMessage(SCIM_TOKEN_REVOKE_FAILED_MESSAGE);

          return;
        }

        setStatusAnnouncement(SCIM_TOKEN_REVOKED_SUCCESS_MESSAGE);
        setMutationSuccessMessage(SCIM_TOKEN_REVOKED_SUCCESS_MESSAGE);
        await load();
      } finally {
        setRevokingId(null);
        setPendingRevoke(null);
      }
    },
    [load],
  );

  const copyScimBaseUrl = useCallback(async () => {
    if (scimBaseUrl.length === 0) {
      return;
    }

    await copyText(scimBaseUrl);
    setCopiedBaseUrl(true);
    setStatusAnnouncement(SCIM_BASE_URL_COPIED_ACTION);
    window.setTimeout(() => setCopiedBaseUrl(false), 2000);
  }, [scimBaseUrl]);

  const copyIssuedToken = useCallback(async () => {
    if (issuedToken === null) {
      return;
    }

    await copyText(issuedToken.plaintextToken);
    setCopiedToken(true);
    setStatusAnnouncement(SCIM_TOKEN_COPIED_ACTION);
    window.setTimeout(() => setCopiedToken(false), 2000);
  }, [issuedToken]);

  const scimBaseUrlCopyDisabled =
    scimBaseUrl.length === 0 ||
    (scimBaseUrlClassification?.requiresExternalReachabilityWarning ?? false);
  const scimIssueChecklistInput = {
    baseUrlReady: scimBaseUrl.length > 0 && !scimBaseUrlCopyDisabled,
    tokenIssued: issuedToken !== null,
    verifyComplete: verifyState.status === "verified",
  };
  const scimIssueSteps = resolveScimIssueTokenSteps(scimIssueChecklistInput);
  const scimIssueEmphasizedStepId = resolveScimIssueTokenEmphasizedStepId(scimIssueChecklistInput);

  return (
    <OperatorPageContainer
      variant="settings"
      className={OPERATOR_LAYOUT.sectionStack}
      data-testid="scim-provisioning-settings-page"
    >
      <OperatorPageHeader
        navHref="/administration/scim-provisioning"
        title={SCIM_PROVISIONING_PAGE_TITLE}
        subtitle={SCIM_PROVISIONING_PAGE_SUBTITLE}
        titleTestId="scim-provisioning-page-title"
        actions={<PageContextualHelpButton />}
      />
      <ScimProvisioningSettingsEvidenceOrientationStrip />
      <ScimIdentityProvidersVocabularyRail currentSurfaceId="scim-provisioning" />

      <p
        className={cn(
          "m-0 rounded-lg border border-neutral-200 bg-neutral-50/70 px-4 py-3 text-al-text-primary dark:border-neutral-800 dark:bg-neutral-900/40",
          OPERATOR_TYPOGRAPHY.body,
        )}
        data-testid="scim-provisioning-reassurance"
      >
        {SCIM_PROVISIONING_PAGE_REASSURANCE}
      </p>

      <p className="sr-only" role="status" aria-live="polite" aria-atomic="true">
        {statusAnnouncement}
      </p>

      {mutationSuccessMessage !== null ? (
        <OperatorSuccessCallout message={mutationSuccessMessage} testId="scim-mutation-success-callout" />
      ) : null}

      {mutationErrorMessage !== null ? (
        <OperatorMutationInlineError message={mutationErrorMessage} testId="scim-mutation-inline-error" />
      ) : null}

      <ScimProvisioningIssueTokenSection
        scimBaseUrlClassification={scimBaseUrlClassification}
        scimBaseUrl={scimBaseUrl}
        issuedToken={issuedToken}
        setupSessionToken={setupSessionToken}
        manualVerifyToken={manualVerifyToken}
        verifyState={verifyState}
        issuing={issuing}
        copiedBaseUrl={copiedBaseUrl}
        copiedToken={copiedToken}
        scimIssueSteps={scimIssueSteps}
        scimIssueEmphasizedStepId={scimIssueEmphasizedStepId}
        onCopyScimBaseUrl={() => void copyScimBaseUrl()}
        onRequestCreate={() => setPendingCreate(true)}
        onCopyIssuedToken={() => void copyIssuedToken()}
        onClearSetupSession={clearSetupSession}
        onManualVerifyTokenChange={(value) => {
          setManualVerifyToken(value);
          setVerifyState({ status: "idle" });
        }}
        onVerifyConnection={() => void verifyConnection()}
      />

      <ScimProvisioningActiveTokensTable
        state={state}
        revokingId={revokingId}
        onRequestRevoke={setPendingRevoke}
      />

      <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)} data-testid="scim-sso-context-note">
        {SCIM_SSO_CONTEXT_NOTE_PREFIX}{" "}
        <Link className={OPERATOR_LINK.nav} href={SCIM_IDENTITY_PROVIDERS_HREF}>
          {SCIM_SSO_CONTEXT_NOTE_LINK}
        </Link>{" "}
        {SCIM_SSO_CONTEXT_NOTE_SUFFIX}
      </p>

      <ScimProvisioningCreateConfirmDialog
        open={pendingCreate}
        busy={issuing}
        onCancel={() => {
          setPendingCreate(false);
        }}
        onConfirm={() => {
          void createToken();
        }}
      />

      <ScimProvisioningRevokeConfirmDialog
        open={pendingRevoke !== null}
        busy={revokingId !== null}
        onCancel={() => {
          setPendingRevoke(null);
        }}
        onConfirm={() => {
          if (pendingRevoke !== null) {
            void revokeToken(pendingRevoke.id);
          }
        }}
      />
    </OperatorPageContainer>
  );
}
