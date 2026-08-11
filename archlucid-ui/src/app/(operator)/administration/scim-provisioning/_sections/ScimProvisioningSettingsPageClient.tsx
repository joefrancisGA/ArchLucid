"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

import { OperatorApiProblem } from "@/components/OperatorApiProblem";
import { OperatorMutationInlineError } from "@/components/operator/OperatorMutationInlineError";
import { OperatorSuccessCallout } from "@/components/operator/OperatorSuccessCallout";
import { OperatorPageHeader } from "@/components/OperatorPageHeader";
import { CollapsibleSection } from "@/components/CollapsibleSection";
import { ScimIdentityProvidersVocabularyRail } from "@/components/ScimIdentityProvidersVocabularyRail";
import { ScimUsersVocabularyRail } from "@/components/ScimUsersVocabularyRail";
import { SsoWizardScimVocabularyRail } from "@/components/SsoWizardScimVocabularyRail";

import { PageContextualHelpButton } from "@/components/usability/PageContextualHelpButton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
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
import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { mergeRegistrationScopeForProxy } from "@/lib/proxy-fetch-registration-scope";
import { formatRelativeTime } from "@/lib/relative-time";
import { resolveScimBaseUrl, SCIM_SERVICE_PROVIDER_CONFIG_PATH } from "@/lib/scim-provisioning-base-url";
import {
  SCIM_ACTIVE_TOKENS_EMPTY_DESCRIPTION,
  SCIM_ACTIVE_TOKENS_EMPTY_TITLE,
  SCIM_ACTIVE_TOKENS_SECTION_DESCRIPTION,
  SCIM_ACTIVE_TOKENS_SECTION_TITLE,
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
  SCIM_REVOKE_DIALOG_CANCEL,
  SCIM_REVOKE_DIALOG_CONFIRM,
  SCIM_REVOKE_DIALOG_DESCRIPTION,
  SCIM_REVOKE_DIALOG_TITLE,
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
  SCIM_VERIFY_ACTION,
  SCIM_VERIFY_MANUAL_TOKEN_HELPER,
  SCIM_VERIFY_MANUAL_TOKEN_LABEL,
  SCIM_VERIFY_MISSING_TOKEN,
  SCIM_VERIFY_SECTION_DESCRIPTION,
  SCIM_VERIFY_SECTION_TITLE,
  SCIM_VERIFY_STATUS_NOT_VERIFIED,
  SCIM_VERIFY_STATUS_VERIFIED,
  SCIM_VERIFY_SUCCESS_DETAIL,
  SCIM_VERIFY_TECHNICAL_DETAILS_TITLE,
  SCIM_VERIFY_USING_SESSION_TOKEN,
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

/** SCIM inbound provisioning administration — token lifecycle and connectivity verification. */
export function ScimProvisioningSettingsPageClient() {
  const [state, setState] = useState<LoadState>({ status: "idle" });
  const [scimBaseUrl, setScimBaseUrl] = useState("");
  const [issuedToken, setIssuedToken] = useState<ScimTokenIssueResponse | null>(null);
  const [setupSessionToken, setSetupSessionToken] = useState<string | null>(null);
  const [manualVerifyToken, setManualVerifyToken] = useState("");
  const [verifyState, setVerifyState] = useState<VerifyState>({ status: "idle" });
  const [issuing, setIssuing] = useState(false);
  const [revokingId, setRevokingId] = useState<string | null>(null);
  const [pendingRevoke, setPendingRevoke] = useState<ScimTokenSummary | null>(null);
  const [copiedBaseUrl, setCopiedBaseUrl] = useState(false);
  const [copiedToken, setCopiedToken] = useState(false);
  const [statusAnnouncement, setStatusAnnouncement] = useState("");
  const [mutationSuccessMessage, setMutationSuccessMessage] = useState<string | null>(null);
  const [mutationErrorMessage, setMutationErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setScimBaseUrl(resolveScimBaseUrl(window.location.origin));
    }
  }, []);

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

  const showManualVerifyField = setupSessionToken === null && issuedToken === null;
  const createDisabled = issuing || issuedToken !== null;

  return (
    <div
      className="mx-auto w-full max-w-[62rem] space-y-6"
      data-testid="scim-provisioning-settings-page"
    >
      <OperatorPageHeader
        title={SCIM_PROVISIONING_PAGE_TITLE}
        subtitle={SCIM_PROVISIONING_PAGE_SUBTITLE}
        titleTestId="scim-provisioning-page-title"
        actions={<PageContextualHelpButton />}
      />
      <ScimUsersVocabularyRail currentSurfaceId="scim" />
      <ScimIdentityProvidersVocabularyRail currentSurfaceId="scim-provisioning" />
      <SsoWizardScimVocabularyRail currentSurfaceId="scim" />

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
                disabled={scimBaseUrl.length === 0}
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
              onClick={() => void createToken()}
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
          <CardTitle className={OPERATOR_TYPOGRAPHY.cardTitle}>{SCIM_VERIFY_SECTION_TITLE}</CardTitle>
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
                {SCIM_VERIFY_MANUAL_TOKEN_HELPER}
              </p>
            </div>
          ) : null}

          {verifyState.status === "idle" ? (
            <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)} data-testid="scim-verify-status-idle">
              {SCIM_VERIFY_STATUS_NOT_VERIFIED}
            </p>
          ) : null}

          <Button
            type="button"
            variant="outline"
            onClick={() => void verifyConnection()}
            disabled={verifyState.status === "checking"}
            data-testid="scim-verify-connection"
          >
            {verifyState.status === "checking" ? SCIM_VERIFYING_ACTION : SCIM_VERIFY_ACTION}
          </Button>

          {verifyState.status === "verified" ? (
            <p
              className={cn("m-0 font-medium text-emerald-800 dark:text-emerald-300", OPERATOR_TYPOGRAPHY.body)}
              data-testid="scim-verify-success"
            >
              {SCIM_VERIFY_STATUS_VERIFIED} — {SCIM_VERIFY_SUCCESS_DETAIL}
            </p>
          ) : null}

          {verifyState.status === "failed" ? (
            <div className="space-y-2" data-testid="scim-verify-failure">
              <OperatorApiProblem fallbackMessage={verifyState.message} problem={null} variant="warning" />
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
                      <Badge variant={isTokenActive(token) ? "default" : "secondary"}>
                        {resolveTokenStatusLabel(token)}
                      </Badge>
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

      <AlertDialog
        open={pendingRevoke !== null}
        onOpenChange={(open) => {
          if (!open) {
            setPendingRevoke(null);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{SCIM_REVOKE_DIALOG_TITLE}</AlertDialogTitle>
            <AlertDialogDescription>{SCIM_REVOKE_DIALOG_DESCRIPTION}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{SCIM_REVOKE_DIALOG_CANCEL}</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 text-white hover:bg-red-700"
              disabled={pendingRevoke === null || revokingId !== null}
              onClick={(event) => {
                event.preventDefault();

                if (pendingRevoke !== null) {
                  void revokeToken(pendingRevoke.id);
                }
              }}
            >
              {SCIM_REVOKE_DIALOG_CONFIRM}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
