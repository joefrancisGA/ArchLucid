"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

import { ItsmAtlassianOAuthCallbackLoadingView } from "@/app/(operator)/integrations/itsm/oauth/callback/ItsmAtlassianOAuthCallbackLoadingView";
import { AuthFlowShell } from "@/components/auth/AuthFlowShell";
import { Button } from "@/components/ui/button";
import { StatusTag } from "@/components/ui/status-tag";
import { completeItsmAtlassianOAuthConsent } from "@/lib/api/itsm-outbound-api";
import { cn } from "@/lib/utils";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { INTEGRATIONS_JIRA_PATH } from "@/lib/integrations-nav-paths";
import {
  ITSM_ATLASSIAN_OAUTH_CALLBACK_INCOMPLETE_RESPONSE,
  ITSM_ATLASSIAN_OAUTH_CALLBACK_REFRESH_TOKEN_STORE_FAILED,
  ITSM_ATLASSIAN_OAUTH_CALLBACK_RETRY_LABEL,
  mapItsmAtlassianOAuthCallbackFailure,
  mapItsmAtlassianOAuthIdpError,
} from "@/lib/itsm/itsm-atlassian-oauth-callback-error-copy";
import {
  ITSM_ATLASSIAN_OAUTH_CALLBACK_LOADING_DETAIL,
  ITSM_ATLASSIAN_OAUTH_CALLBACK_OPEN_JIRA_LABEL,
  ITSM_ATLASSIAN_OAUTH_CALLBACK_PAGE_TITLE,
  ITSM_ATLASSIAN_OAUTH_CALLBACK_SUCCESS_MESSAGE,
} from "@/lib/itsm/itsm-atlassian-oauth-callback-page-copy";
import { ARCHLUCID_SUPPORT_EMAIL } from "@/lib/support-workspace-present";

export function ItsmAtlassianOAuthCallbackClient(): React.ReactElement {
  const searchParams = useSearchParams();
  const [message, setMessage] = useState(ITSM_ATLASSIAN_OAUTH_CALLBACK_LOADING_DETAIL);
  const [failed, setFailed] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const oauthError = searchParams.get("error");
    const oauthErrorDescription = searchParams.get("error_description");
    const code = searchParams.get("code");
    const state = searchParams.get("state");

    const fail = (text: string) => {
      if (cancelled) {
        return;
      }

      setFailed(true);
      setMessage(text);
    };

    if (oauthError) {
      fail(mapItsmAtlassianOAuthIdpError(oauthError, oauthErrorDescription));

      return () => {
        cancelled = true;
      };
    }

    if (!code || !state) {
      fail(ITSM_ATLASSIAN_OAUTH_CALLBACK_INCOMPLETE_RESPONSE);

      return () => {
        cancelled = true;
      };
    }

    void (async () => {
      try {
        const result = await completeItsmAtlassianOAuthConsent({ code, state });

        if (cancelled) {
          return;
        }

        if (!result.refreshTokenStored) {
          fail(ITSM_ATLASSIAN_OAUTH_CALLBACK_REFRESH_TOKEN_STORE_FAILED);

          return;
        }

        setDone(true);
        setMessage(ITSM_ATLASSIAN_OAUTH_CALLBACK_SUCCESS_MESSAGE);
      } catch (error: unknown) {
        if (!cancelled) {
          fail(mapItsmAtlassianOAuthCallbackFailure(error));
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [searchParams]);

  if (!failed && !done) {
    return (
      <AuthFlowShell showEvaluationSignupLink={false}>
        <ItsmAtlassianOAuthCallbackLoadingView />
      </AuthFlowShell>
    );
  }

  return (
    <AuthFlowShell showEvaluationSignupLink={false}>
      <div className="max-w-[560px] space-y-4" data-testid="itsm-oauth-callback-page">
        <h1 className={cn("mt-0", OPERATOR_TYPOGRAPHY.pageTitle)}>{ITSM_ATLASSIAN_OAUTH_CALLBACK_PAGE_TITLE}</h1>

        {done ? (
          <StatusTag kind="ready" label="Connected" data-testid="itsm-oauth-callback-success-status" />
        ) : (
          <StatusTag kind="blocked" label="Consent failed" data-testid="itsm-oauth-callback-failure-status" />
        )}

        <p
          role={failed ? "alert" : "status"}
          aria-live="polite"
          className={cn(
            "m-0",
            failed ? "text-red-600 dark:text-red-400" : "text-al-text-secondary",
            OPERATOR_TYPOGRAPHY.body,
          )}
          data-testid="itsm-oauth-callback-message"
        >
          {message}
        </p>

        {done ? (
          <Button asChild variant="primary" data-testid="itsm-oauth-callback-open-jira">
            <Link href={INTEGRATIONS_JIRA_PATH}>{ITSM_ATLASSIAN_OAUTH_CALLBACK_OPEN_JIRA_LABEL}</Link>
          </Button>
        ) : null}

        {failed ? (
          <div className="flex flex-wrap items-center gap-3" data-testid="itsm-oauth-callback-failure-actions">
            <Link href={INTEGRATIONS_JIRA_PATH} className="text-sm font-medium text-al-accent-primary hover:underline">
              {ITSM_ATLASSIAN_OAUTH_CALLBACK_RETRY_LABEL}
            </Link>
            <Link
              href={`mailto:${ARCHLUCID_SUPPORT_EMAIL}`}
              className="text-sm font-medium text-al-accent-primary hover:underline"
            >
              Contact support
            </Link>
          </div>
        ) : null}
      </div>
    </AuthFlowShell>
  );
}
