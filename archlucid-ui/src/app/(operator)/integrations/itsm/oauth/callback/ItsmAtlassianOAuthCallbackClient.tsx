"use client";

import Link from "next/link";
import { Ban } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { ItsmAtlassianOAuthCallbackLoadingView } from "@/app/(operator)/integrations/itsm/oauth/callback/ItsmAtlassianOAuthCallbackLoadingView";
import { CopyIdButton } from "@/components/CopyIdButton";
import { ItsmOAuthCallbackEvidenceOrientationStrip } from "@/components/evidence-orientation/registry/claim-and-sources-strips";
import { OperatorPageBreadcrumb } from "@/components/operator/OperatorPageBreadcrumb";
import { OperatorPageHeader } from "@/components/operator/OperatorPageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { StatusTag } from "@/components/ui/status-tag";
import { PageContextualHelpButton } from "@/components/usability/PageContextualHelpButton";
import { completeItsmAtlassianOAuthConsent } from "@/lib/api/itsm-outbound-api";
import { isApiRequestError } from "@/lib/api-request-error";
import { DESIGN_TOKENS, OPERATOR_CARD, OPERATOR_LAYOUT, OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { INTEGRATIONS_JIRA_PATH } from "@/lib/integrations-nav-paths";
import {
  ITSM_ATLASSIAN_OAUTH_CALLBACK_INCOMPLETE_RESPONSE,
  ITSM_ATLASSIAN_OAUTH_CALLBACK_REFRESH_TOKEN_STORE_FAILED,
  ITSM_ATLASSIAN_OAUTH_CALLBACK_RETRY_LABEL,
  mapItsmAtlassianOAuthCallbackFailure,
  mapItsmAtlassianOAuthIdpError,
} from "@/lib/itsm/itsm-atlassian-oauth-callback-error-copy";
import {
  ITSM_ATLASSIAN_OAUTH_CALLBACK_BREADCRUMB_INTEGRATIONS_LABEL,
  ITSM_ATLASSIAN_OAUTH_CALLBACK_BREADCRUMB_JIRA_LABEL,
  ITSM_ATLASSIAN_OAUTH_CALLBACK_CONNECTOR_STATE_CONSENT_WITHOUT_CREDENTIAL,
  ITSM_ATLASSIAN_OAUTH_CALLBACK_CONNECTOR_STATE_UNCHANGED,
  ITSM_ATLASSIAN_OAUTH_CALLBACK_FAILURE_TITLE,
  ITSM_ATLASSIAN_OAUTH_CALLBACK_LOADING_TITLE,
  ITSM_ATLASSIAN_OAUTH_CALLBACK_OPEN_JIRA_LABEL,
  ITSM_ATLASSIAN_OAUTH_CALLBACK_SUCCESS_MESSAGE,
  ITSM_ATLASSIAN_OAUTH_CALLBACK_SUCCESS_TITLE,
  ITSM_ATLASSIAN_OAUTH_CALLBACK_SUPPORT_DISCLOSURE_SUMMARY,
} from "@/lib/itsm/itsm-atlassian-oauth-callback-page-copy";
import {
  buildItsmAtlassianOAuthCallbackSupportMailtoHref,
  formatItsmAtlassianOAuthCallbackUtcTimestamp,
  itsmAtlassianOAuthCallbackSupportLinkLabel,
  resolveItsmAtlassianOAuthCallbackWorkspaceLabel,
  type ItsmAtlassianOAuthCallbackFailureKind,
} from "@/lib/itsm/itsm-atlassian-oauth-callback-support";
import { readOperatorScopeFromStorage } from "@/lib/operator/operator-scope-storage";
import { cn } from "@/lib/utils";
import { ensureCorrelationId } from "@/lib/usability/ensure-correlation-id";

type CallbackPhase = "loading" | "success" | "failure";

function resolveConnectorStateLine(failureKind: ItsmAtlassianOAuthCallbackFailureKind | null): string | null {
  if (failureKind === null) {
    return null;
  }

  if (failureKind === "refresh-token-store-failed") {
    return ITSM_ATLASSIAN_OAUTH_CALLBACK_CONNECTOR_STATE_CONSENT_WITHOUT_CREDENTIAL;
  }

  return ITSM_ATLASSIAN_OAUTH_CALLBACK_CONNECTOR_STATE_UNCHANGED;
}

function resolvePageTitle(phase: CallbackPhase): string {
  if (phase === "success") {
    return ITSM_ATLASSIAN_OAUTH_CALLBACK_SUCCESS_TITLE;
  }

  if (phase === "failure") {
    return ITSM_ATLASSIAN_OAUTH_CALLBACK_FAILURE_TITLE;
  }

  return ITSM_ATLASSIAN_OAUTH_CALLBACK_LOADING_TITLE;
}

export function ItsmAtlassianOAuthCallbackClient(): React.ReactElement {
  const searchParams = useSearchParams();
  const outcomeRef = useRef<HTMLDivElement>(null);
  const [phase, setPhase] = useState<CallbackPhase>("loading");
  const [message, setMessage] = useState("");
  const [failureKind, setFailureKind] = useState<ItsmAtlassianOAuthCallbackFailureKind | null>(null);
  const [supportReferenceId, setSupportReferenceId] = useState<string | null>(null);
  const [supportTimestampUtc, setSupportTimestampUtc] = useState<string | null>(null);
  const [workspaceLabel, setWorkspaceLabel] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const oauthError = searchParams.get("error");
    const oauthErrorDescription = searchParams.get("error_description");
    const code = searchParams.get("code");
    const state = searchParams.get("state");

    const fail = (
      text: string,
      kind: ItsmAtlassianOAuthCallbackFailureKind,
      referenceId?: string | null,
    ) => {
      if (cancelled) {
        return;
      }

      setPhase("failure");
      setFailureKind(kind);
      setMessage(text);
      setSupportReferenceId(ensureCorrelationId(referenceId));
      setSupportTimestampUtc(formatItsmAtlassianOAuthCallbackUtcTimestamp(new Date()));
      setWorkspaceLabel(
        resolveItsmAtlassianOAuthCallbackWorkspaceLabel(readOperatorScopeFromStorage()?.workspaceLabel),
      );
    };

    if (oauthError) {
      fail(mapItsmAtlassianOAuthIdpError(oauthError, oauthErrorDescription), "idp-denial");

      return () => {
        cancelled = true;
      };
    }

    if (!code || !state) {
      fail(ITSM_ATLASSIAN_OAUTH_CALLBACK_INCOMPLETE_RESPONSE, "incomplete-response");

      return () => {
        cancelled = true;
      };
    }

    const requestCorrelationId = ensureCorrelationId(null);

    void (async () => {
      try {
        const result = await completeItsmAtlassianOAuthConsent(
          { code, state },
          { correlationId: requestCorrelationId },
        );

        if (cancelled) {
          return;
        }

        if (!result.refreshTokenStored) {
          fail(
            ITSM_ATLASSIAN_OAUTH_CALLBACK_REFRESH_TOKEN_STORE_FAILED,
            "refresh-token-store-failed",
            result.correlationId,
          );

          return;
        }

        setPhase("success");
        setMessage(ITSM_ATLASSIAN_OAUTH_CALLBACK_SUCCESS_MESSAGE);
      } catch (error: unknown) {
        if (!cancelled) {
          const referenceId = isApiRequestError(error)
            ? error.correlationId ?? requestCorrelationId
            : requestCorrelationId;
          fail(mapItsmAtlassianOAuthCallbackFailure(error), "api-failure", referenceId);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [searchParams]);

  useEffect(() => {
    if (phase === "loading") {
      return;
    }

    outcomeRef.current?.focus();
  }, [phase, message]);

  const connectorStateLine = resolveConnectorStateLine(failureKind);
  const pageTitle = resolvePageTitle(phase);
  const supportMailtoHref =
    phase === "failure" && supportTimestampUtc !== null && supportReferenceId !== null
      ? buildItsmAtlassianOAuthCallbackSupportMailtoHref({
          correlationId: supportReferenceId,
          timestampUtc: supportTimestampUtc,
          workspaceLabel,
          failureMessage: message,
        })
      : null;

  return (
    <div
      className={cn("w-full max-w-[68rem] px-4 py-4 sm:px-6 lg:px-8", OPERATOR_LAYOUT.majorSectionGap)}
      data-testid="itsm-oauth-callback-page"
    >
      <OperatorPageHeader
        title={pageTitle}
        titleTestId="itsm-oauth-callback-page-title"
        navHref={INTEGRATIONS_JIRA_PATH}
        headingLevel="h1"
        actions={<PageContextualHelpButton />}
        breadcrumb={
          <OperatorPageBreadcrumb
            data-testid="itsm-oauth-callback-breadcrumb"
            items={[
              { label: ITSM_ATLASSIAN_OAUTH_CALLBACK_BREADCRUMB_INTEGRATIONS_LABEL },
              { label: ITSM_ATLASSIAN_OAUTH_CALLBACK_BREADCRUMB_JIRA_LABEL, href: INTEGRATIONS_JIRA_PATH },
            ]}
          />
        }
      />

      <ItsmOAuthCallbackEvidenceOrientationStrip />

      <Card className="max-w-[40rem] border-neutral-200/80 bg-al-surface-raised dark:border-neutral-800">
        <CardContent className={cn(OPERATOR_CARD.body, "space-y-4")}>
          <div
            ref={outcomeRef}
            tabIndex={-1}
            className="space-y-4 outline-none"
            data-testid="itsm-oauth-callback-outcome"
          >
            {phase === "loading" ? <ItsmAtlassianOAuthCallbackLoadingView /> : null}

            {phase === "success" ? (
              <>
                <StatusTag kind="ready" label="Connected" data-testid="itsm-oauth-callback-success-status" />
                <p
                  role="status"
                  aria-live="polite"
                  className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}
                  data-testid="itsm-oauth-callback-message"
                >
                  {message}
                </p>
                <Button asChild variant="primary" data-testid="itsm-oauth-callback-open-jira">
                  <Link href={INTEGRATIONS_JIRA_PATH}>{ITSM_ATLASSIAN_OAUTH_CALLBACK_OPEN_JIRA_LABEL}</Link>
                </Button>
              </>
            ) : null}

            {phase === "failure" ? (
              <>
                <StatusTag kind="blocked" label="Consent failed" data-testid="itsm-oauth-callback-failure-status" />

                <div
                  role="alert"
                  className={cn(DESIGN_TOKENS.callout.blockedShell)}
                  data-testid="itsm-oauth-callback-failure-callout"
                >
                  <Ban
                    className={cn("mt-0.5 h-4 w-4 shrink-0", DESIGN_TOKENS.calloutSeverity.blocked.iconClass)}
                    aria-hidden
                  />
                  <div className="min-w-0 space-y-2">
                    <p className={cn("m-0", OPERATOR_TYPOGRAPHY.body)} data-testid="itsm-oauth-callback-message">
                      {message}
                    </p>
                    {connectorStateLine !== null ? (
                      <p
                        className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}
                        data-testid="itsm-oauth-callback-connector-state"
                      >
                        {connectorStateLine}
                      </p>
                    ) : null}
                  </div>
                </div>

                <div
                  className="flex flex-wrap items-center gap-3"
                  data-testid="itsm-oauth-callback-failure-actions"
                >
                  <Button asChild variant="primary" data-testid="itsm-oauth-callback-retry">
                    <Link href={INTEGRATIONS_JIRA_PATH}>{ITSM_ATLASSIAN_OAUTH_CALLBACK_RETRY_LABEL}</Link>
                  </Button>
                  {supportMailtoHref !== null ? (
                    <Link
                      href={supportMailtoHref}
                      className={OPERATOR_LINK.nav}
                      data-testid="itsm-oauth-callback-contact-support"
                    >
                      {itsmAtlassianOAuthCallbackSupportLinkLabel()}
                    </Link>
                  ) : null}
                </div>

                <details
                  className={cn("text-left", OPERATOR_TYPOGRAPHY.helper)}
                  data-testid="itsm-oauth-callback-support-details"
                >
                  <summary className="cursor-pointer select-none text-al-text-secondary hover:text-al-text-primary">
                    {ITSM_ATLASSIAN_OAUTH_CALLBACK_SUPPORT_DISCLOSURE_SUMMARY}
                  </summary>
                  <div className="mt-3 space-y-2 text-al-text-secondary">
                    {workspaceLabel !== null ? (
                      <p className="m-0">
                        <span className="font-medium text-al-text-primary">Workspace:</span> {workspaceLabel}
                      </p>
                    ) : null}
                    <p className="m-0 flex flex-wrap items-center gap-2">
                      <span className="font-medium text-al-text-primary">Reference ID:</span>
                      <code className="break-all rounded bg-neutral-100 px-1 py-0.5 font-mono dark:bg-neutral-800">
                        {supportReferenceId}
                      </code>
                      <CopyIdButton value={supportReferenceId ?? ""} aria-label="Copy reference ID" />
                    </p>
                    {supportTimestampUtc !== null ? (
                      <p className="m-0">
                        <span className="font-medium text-al-text-primary">Timestamp (UTC):</span> {supportTimestampUtc}
                      </p>
                    ) : null}
                  </div>
                </details>
              </>
            ) : null}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
