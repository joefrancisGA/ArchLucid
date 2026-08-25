"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

import { OperatorApiProblem } from "@/components/operator/OperatorApiProblem";
import { OperatorMutationInlineError } from "@/components/operator/OperatorMutationInlineError";
import { OperatorSuccessCallout } from "@/components/operator/OperatorSuccessCallout";
import { OperatorPageContainer } from "@/components/operator/OperatorPageContainer";
import { OperatorPageHeader } from "@/components/operator/OperatorPageHeader";
import { CollapsibleSection } from "@/components/CollapsibleSection";
import { ScimIdentityProvidersVocabularyRail } from "@/components/ScimIdentityProvidersVocabularyRail";
import { StatusTag } from "@/components/StatusTag";
import { WhyDisabledCtaHint } from "@/components/usability/WhyDisabledCtaHint";

import { PageContextualHelpButton } from "@/components/usability/PageContextualHelpButton";
import { ScimProvisioningSettingsEvidenceOrientationStrip } from "@/components/evidence-orientation/registry/claim-and-sources-strips";
import { ScimProvisioningCreateConfirmDialog } from "@/app/(operator)/administration/scim-provisioning/_sections/ScimProvisioningCreateConfirmDialog";
import { ScimProvisioningRevokeConfirmDialog } from "@/app/(operator)/administration/scim-provisioning/_sections/ScimProvisioningRevokeConfirmDialog";
import { IntegrationConnectChecklist } from "@/components/integrations/IntegrationConnectChecklist";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  EnterpriseTable,
  EnterpriseTableBody,
  EnterpriseTableCell,
  EnterpriseTableHead,
  EnterpriseTableHeadRow,
  EnterpriseTableHeaderCell,
  EnterpriseTableRow,
} from "@/components/ui/enterprise-table";
import { OPERATOR_LAYOUT, OPERATOR_LINK, OPERATOR_TYPOGRAPHY, type EnterpriseStatusKind } from "@/lib/design-tokens";
import { mergeRegistrationScopeForProxy } from "@/lib/proxy-fetch-registration-scope";
import { formatRelativeTime } from "@/lib/relative-time";
import {
  classifyScimBaseUrl,
  SCIM_SERVICE_PROVIDER_CONFIG_PATH,
  type ScimBaseUrlClassification,
} from "@/lib/scim-provisioning-base-url";
import {
  SCIM_ACTIVE_TOKENS_EMPTY_DESCRIPTION,
  SCIM_ACTIVE_TOKENS_EMPTY_TITLE,
  SCIM_ACTIVE_TOKENS_SECTION_DESCRIPTION,
  SCIM_ACTIVE_TOKENS_SECTION_TITLE,
  SCIM_BASE_URL_EXTERNAL_REACHABILITY_WARNING,
  SCIM_BASE_URL_COPIED_ACTION,
  SCIM_BASE_URL_COPY_ACTION,
  SCIM_BASE_URL_LABEL,
  SCIM_CONFIGURE_SECTION_DESCRIPTION,
  SCIM_CONFIGURE_SECTION_TITLE,
  SCIM_COPY_TOKEN_ACTION,
  SCIM_CREATE_TOKEN_ACTION,
  SCIM_CREATING_TOKEN_ACTION,
  SCIM_IDENTITY_PROVIDERS_HREF,
  SCIM_ONE_TIME_TOKEN_NOTICE,
  SCIM_PROVISIONING_PAGE_REASSURANCE,
  SCIM_PROVISIONING_PAGE_SUBTITLE,
  SCIM_PROVISIONING_PAGE_TITLE,
  SCIM_REVOKE_ACTION,
  SCIM_REVOKING_ACTION,
  SCIM_SSO_CONTEXT_NOTE_LINK,
  SCIM_SSO_CONTEXT_NOTE_PREFIX,
  SCIM_SSO_CONTEXT_NOTE_SUFFIX,
  SCIM_TOKEN_COPIED_ACTION,
  SCIM_TOKEN_CREATE_FAILED,
  SCIM_TOKEN_CREATED_SUCCESS,
  SCIM_TOKEN_DONE_ACTION,
  SCIM_TOKEN_REVOKE_FAILED,
  SCIM_TOKEN_REVOKED_SUCCESS,
  SCIM_TOKEN_STATUS_ACTIVE,
  SCIM_TOKEN_STATUS_REVOKED,
  SCIM_TOKEN_TABLE_COLUMN_ACTIONS,
  SCIM_TOKEN_TABLE_COLUMN_CREATED,
  SCIM_TOKEN_TABLE_COLUMN_IDENTIFIER,
  SCIM_TOKEN_TABLE_COLUMN_STATUS,
  SCIM_TOKENS_LOAD_BLOCKED,
  SCIM_TOKENS_LOAD_FAILED,
  SCIM_VERIFY_CREATE_TOKEN_LINK,
  SCIM_VERIFY_DISABLED_MISSING_TOKEN,
  SCIM_VERIFY_MANUAL_TOKEN_HELPER_PREFIX,
  SCIM_VERIFY_MANUAL_TOKEN_HELPER_SUFFIX,
  SCIM_VERIFY_MANUAL_TOKEN_LABEL,
  SCIM_VERIFY_MISSING_TOKEN,
  SCIM_VERIFY_SECTION_DESCRIPTION,
  SCIM_VERIFY_SECTION_TITLE,
  SCIM_VERIFY_ACTION,
  SCIM_VERIFY_STATUS_FAILED,
  SCIM_VERIFY_STATUS_NOT_VERIFIED,
  SCIM_VERIFY_STATUS_VERIFIED,
  SCIM_VERIFY_TECHNICAL_DETAILS_TITLE,
  SCIM_VERIFY_USING_SESSION_TOKEN,
  SCIM_VERIFYING_ACTION,
  SCIM_VERIFY_SUCCESS_DETAIL,
} from "@/lib/scim-provisioning-page-copy";
import { whyDisabledBusy, whyDisabledIncompleteInput } from "@/lib/why-disabled-cta";
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

type ScimTokenSummary = {
  id: string;
  createdUtc: string;
  revokedUtc?: string | null;
  publicLookupKey: string;
};

type ScimTokenIssueResponse = {
  id: string;
  publicLookupKey: string;
  plaintextToken: string;
};

type VerifyState =
  | { status: "idle" }
  | { status: "checking" }
  | { status: "verified" }
  | { status: "failed"; message: string; httpStatus?: number };

type LoadState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "ready"; tokens: ScimTokenSummary[] }
  | { status: "blocked"; message: string };

const tokensPath = "/api/proxy/v1/admin/scim/tokens";

async function copyText(value: string): Promise<void> {
  if (typeof navigator === "undefined" || navigator.clipboard === undefined) {
    return;
  }

  await navigator.clipboard.writeText(value);
}

function resolveTokenStatusLabel(token: ScimTokenSummary): string {
  if (token.revokedUtc !== null && token.revokedUtc !== undefined && token.revokedUtc.length > 0) {
    return SCIM_TOKEN_STATUS_REVOKED;
  }

  return SCIM_TOKEN_STATUS_ACTIVE;
}

function isTokenActive(token: ScimTokenSummary): boolean {
  return resolveTokenStatusLabel(token) === SCIM_TOKEN_STATUS_ACTIVE;
}

function resolveTokenStatusTagKind(token: ScimTokenSummary): EnterpriseStatusKind {
  if (isTokenActive(token)) {
    return "ready";
  }

  return "neutral";
}

function resolveVerifyStatusTag(verifyState: VerifyState): { kind: EnterpriseStatusKind; label: string } {
  switch (verifyState.status) {
    case "verified":
      return { kind: "ready", label: SCIM_VERIFY_STATUS_VERIFIED };
    case "failed":
      return { kind: "blocked", label: SCIM_VERIFY_STATUS_FAILED };
    case "checking":
      return { kind: "in-progress", label: SCIM_VERIFYING_ACTION };
    case "idle":
      return { kind: "neutral", label: SCIM_VERIFY_STATUS_NOT_VERIFIED };
    default: {
      const _exhaustive: never = verifyState;
      return _exhaustive;
    }
  }
}

function focusCreateTokenControl(): void {
  const element = document.querySelector<HTMLElement>('[data-testid="scim-create-token"]');

  if (element === null) {
    return;
  }

  element.scrollIntoView({ behavior: "smooth", block: "center" });
  element.focus();
}

/** SCIM inbound provisioning administration — token lifecycle and connectivity verification. */
export function ScimProvisioningSettingsPageClient() {
  const [state, setState] = useState<LoadState>({ status: "idle" });
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
      const response = await fetch(SCIM_SERVICE_PROVIDER_CONFIG_PATH, {
        headers: {
          Accept: "application/scim+json, application/json",
          Authorization: `Bearer ${verifyTokenValue}`,
        },
        cache: "no-store",
      });

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

  const verifyStatusTag = resolveVerifyStatusTag(verifyState);
  const verifyDisabled =
    verifyState.status === "checking" || verifyTokenValue.length === 0;
  const verifyDisabledReason =
    verifyState.status === "checking"
      ? whyDisabledBusy(SCIM_VERIFYING_ACTION)
      : verifyTokenValue.length === 0
        ? whyDisabledIncompleteInput(SCIM_VERIFY_DISABLED_MISSING_TOKEN)
        : null;
  const scimBaseUrlCopyDisabled =
    scimBaseUrl.length === 0 ||
    (scimBaseUrlClassification?.requiresExternalReachabilityWarning ?? false);
  const showManualVerifyField = setupSessionToken === null && issuedToken === null;
  const createDisabled = issuing || issuedToken !== null;
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

      <Card data-testid="scim-configure-section">
        <CardHeader>
          <CardTitle className={OPERATOR_TYPOGRAPHY.cardTitle}>{SCIM_CONFIGURE_SECTION_TITLE}</CardTitle>
          <CardDescription>{SCIM_CONFIGURE_SECTION_DESCRIPTION}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <IntegrationConnectChecklist
            title="Issue token checklist"
            steps={scimIssueSteps}
            emphasizedStepId={scimIssueEmphasizedStepId}
            testIdPrefix="scim-issue-token"
          />
          {scimBaseUrlClassification?.requiresExternalReachabilityWarning === true ? (
            <div data-testid="scim-base-url-reachability-warning">
              <OperatorApiProblem
                fallbackMessage={SCIM_BASE_URL_EXTERNAL_REACHABILITY_WARNING}
                problem={null}
                variant="warning"
              />
            </div>
          ) : null}

          <div className="space-y-1.5">
            <Label htmlFor="scim-base-url">{SCIM_BASE_URL_LABEL}</Label>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start">
              <Input
                id="scim-base-url"
                readOnly
                value={scimBaseUrl}
                className="font-mono text-sm"
                data-testid="scim-base-url-input"
              />
              <Button
                type="button"
                variant="outline"
                className="shrink-0"
                onClick={() => void copyScimBaseUrl()}
                disabled={scimBaseUrlCopyDisabled}
                data-testid="scim-base-url-copy"
              >
                {copiedBaseUrl ? SCIM_BASE_URL_COPIED_ACTION : SCIM_BASE_URL_COPY_ACTION}
              </Button>
            </div>
          </div>

          {issuedToken === null ? (
            <Button
              type="button"
              variant="primary"
              onClick={() => setPendingCreate(true)}
              disabled={createDisabled}
              data-testid="scim-create-token"
            >
              {issuing ? SCIM_CREATING_TOKEN_ACTION : SCIM_CREATE_TOKEN_ACTION}
            </Button>
          ) : (
            <div
              className={cn(
                "space-y-3 rounded-md border border-amber-600/40 bg-al-surface-raised p-4 dark:border-amber-700/50",
                OPERATOR_TYPOGRAPHY.body,
              )}
              data-testid="scim-token-reveal"
            >
              <p className={cn("m-0 font-medium text-amber-950 dark:text-amber-100", OPERATOR_TYPOGRAPHY.body)} role="alert">
                {SCIM_ONE_TIME_TOKEN_NOTICE}
              </p>
              <label className="block space-y-1">
                <span className={cn("text-al-text-secondary", OPERATOR_TYPOGRAPHY.label)}>SCIM token</span>
                <textarea
                  className={cn(
                    "w-full rounded-md border border-neutral-300 bg-white/80 p-2 font-mono dark:border-neutral-600 dark:bg-neutral-900/80",
                    OPERATOR_TYPOGRAPHY.micro,
                  )}
                  readOnly
                  rows={2}
                  value={issuedToken.plaintextToken}
                  data-testid="scim-token-plaintext"
                />
              </label>
              <div className="flex flex-wrap gap-2">
                <Button type="button" variant="outline" onClick={() => void copyIssuedToken()}>
                  {copiedToken ? SCIM_TOKEN_COPIED_ACTION : SCIM_COPY_TOKEN_ACTION}
                </Button>
                <Button type="button" variant="primary" onClick={clearSetupSession} data-testid="scim-token-done">
                  {SCIM_TOKEN_DONE_ACTION}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card data-testid="scim-verify-section">
        <CardHeader>
          <div className="flex flex-wrap items-center gap-2">
            <CardTitle className={OPERATOR_TYPOGRAPHY.cardTitle}>{SCIM_VERIFY_SECTION_TITLE}</CardTitle>
            <StatusTag
              kind={verifyStatusTag.kind}
              label={verifyStatusTag.label}
              data-testid="scim-verify-status-tag"
            />
          </div>
          <CardDescription>{SCIM_VERIFY_SECTION_DESCRIPTION}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {setupSessionToken !== null ? (
            <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)} data-testid="scim-verify-session-hint">
              {SCIM_VERIFY_USING_SESSION_TOKEN}
            </p>
          ) : null}

          {showManualVerifyField ? (
            <div className="space-y-1.5">
              <Label htmlFor="scim-verify-token">{SCIM_VERIFY_MANUAL_TOKEN_LABEL}</Label>
              <Input
                id="scim-verify-token"
                type="password"
                autoComplete="off"
                value={manualVerifyToken}
                onChange={(event) => {
                  setManualVerifyToken(event.currentTarget.value);
                  setVerifyState({ status: "idle" });
                }}
                data-testid="scim-verify-token-input"
              />
              <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
                {SCIM_VERIFY_MANUAL_TOKEN_HELPER_PREFIX}{" "}
                <button
                  type="button"
                  className={OPERATOR_LINK.nav}
                  onClick={focusCreateTokenControl}
                  data-testid="scim-verify-create-token-link"
                >
                  {SCIM_VERIFY_CREATE_TOKEN_LINK}
                </button>{" "}
                {SCIM_VERIFY_MANUAL_TOKEN_HELPER_SUFFIX}
              </p>
            </div>
          ) : null}

          <Button
            type="button"
            variant="outline"
            onClick={() => void verifyConnection()}
            disabled={verifyDisabled}
            data-testid="scim-verify-connection"
          >
            {verifyState.status === "checking" ? SCIM_VERIFYING_ACTION : SCIM_VERIFY_ACTION}
          </Button>

          <WhyDisabledCtaHint
            id="scim-verify-connection-disabled-hint"
            reason={verifyDisabled ? verifyDisabledReason : null}
            testId="scim-verify-connection-disabled-hint"
          />

          {verifyState.status === "verified" ? (
            <p
              className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}
              data-testid="scim-verify-success"
            >
              {SCIM_VERIFY_SUCCESS_DETAIL}
            </p>
          ) : null}

          {verifyState.status === "failed" ? (
            <div className="space-y-2" data-testid="scim-verify-failure">
              <OperatorApiProblem fallbackMessage={verifyState.message} problem={null} variant="error" />
              {verifyState.httpStatus !== undefined ? (
                <CollapsibleSection title={SCIM_VERIFY_TECHNICAL_DETAILS_TITLE} defaultOpen={false}>
                  <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.micro)}>
                    Response status: {verifyState.httpStatus}
                  </p>
                </CollapsibleSection>
              ) : null}
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Card data-testid="scim-active-tokens-section">
        <CardHeader>
          <CardTitle className={OPERATOR_TYPOGRAPHY.cardTitle}>{SCIM_ACTIVE_TOKENS_SECTION_TITLE}</CardTitle>
          <CardDescription>{SCIM_ACTIVE_TOKENS_SECTION_DESCRIPTION}</CardDescription>
        </CardHeader>
        <CardContent>
          {state.status === "loading" || state.status === "idle" ? (
            <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>Loading tokens…</p>
          ) : null}
          {state.status === "blocked" ? <OperatorApiProblem fallbackMessage={state.message} problem={null} /> : null}
          {state.status === "ready" && state.tokens.length === 0 ? (
            <div
              className="rounded-md border border-dashed border-neutral-300 px-4 py-6 text-center dark:border-neutral-700"
              data-testid="scim-no-tokens-empty-state"
            >
              <p className={cn("m-0 font-medium text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}>
                {SCIM_ACTIVE_TOKENS_EMPTY_TITLE}
              </p>
              <p className={cn("m-0 mt-2 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
                {SCIM_ACTIVE_TOKENS_EMPTY_DESCRIPTION}
              </p>
            </div>
          ) : null}
          {state.status === "ready" && state.tokens.length > 0 ? (
            <EnterpriseTable ariaLabel={SCIM_ACTIVE_TOKENS_SECTION_TITLE} data-testid="scim-active-tokens-table">
              <EnterpriseTableHead>
                <EnterpriseTableHeadRow>
                  <EnterpriseTableHeaderCell>{SCIM_TOKEN_TABLE_COLUMN_IDENTIFIER}</EnterpriseTableHeaderCell>
                  <EnterpriseTableHeaderCell>{SCIM_TOKEN_TABLE_COLUMN_CREATED}</EnterpriseTableHeaderCell>
                  <EnterpriseTableHeaderCell>{SCIM_TOKEN_TABLE_COLUMN_STATUS}</EnterpriseTableHeaderCell>
                  <EnterpriseTableHeaderCell>{SCIM_TOKEN_TABLE_COLUMN_ACTIONS}</EnterpriseTableHeaderCell>
                </EnterpriseTableHeadRow>
              </EnterpriseTableHead>
              <EnterpriseTableBody>
                {state.tokens.map((token) => (
                  <EnterpriseTableRow key={token.id}>
                    <EnterpriseTableCell>
                      <span className="font-mono text-al-text-primary">{token.publicLookupKey}</span>
                    </EnterpriseTableCell>
                    <EnterpriseTableCell>{formatRelativeTime(token.createdUtc)}</EnterpriseTableCell>
                    <EnterpriseTableCell>
                      <StatusTag
                        kind={resolveTokenStatusTagKind(token)}
                        label={resolveTokenStatusLabel(token)}
                        data-testid={`scim-token-status-${token.id}`}
                      />
                    </EnterpriseTableCell>
                    <EnterpriseTableCell>
                      {isTokenActive(token) ? (
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          disabled={revokingId === token.id}
                          onClick={() => setPendingRevoke(token)}
                          data-testid={`scim-revoke-token-${token.id}`}
                        >
                          {revokingId === token.id ? SCIM_REVOKING_ACTION : SCIM_REVOKE_ACTION}
                        </Button>
                      ) : (
                        <span className={cn("text-al-text-secondary", OPERATOR_TYPOGRAPHY.micro)}>—</span>
                      )}
                    </EnterpriseTableCell>
                  </EnterpriseTableRow>
                ))}
              </EnterpriseTableBody>
            </EnterpriseTable>
          ) : null}
        </CardContent>
      </Card>

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
