"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

import { PageContextualHelpButton } from "@/components/usability/PageContextualHelpButton";
import { completeItsmAtlassianOAuthConsent } from "@/lib/api/itsm-outbound-api";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { INTEGRATIONS_JIRA_PATH } from "@/lib/integrations-nav-paths";
import {
  ITSM_ATLASSIAN_OAUTH_CALLBACK_INCOMPLETE_RESPONSE,
  ITSM_ATLASSIAN_OAUTH_CALLBACK_REFRESH_TOKEN_STORE_FAILED,
  ITSM_ATLASSIAN_OAUTH_CALLBACK_RETRY_LABEL,
  mapItsmAtlassianOAuthCallbackFailure,
  mapItsmAtlassianOAuthIdpError,
} from "@/lib/itsm-atlassian-oauth-callback-error-copy";
import { ARCHLUCID_SUPPORT_EMAIL } from "@/lib/support-workspace-present";

export function ItsmAtlassianOAuthCallbackClient(): React.ReactElement {
  const searchParams = useSearchParams();
  const [message, setMessage] = useState("Completing Atlassian consent…");
  const [failed, setFailed] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const oauthError = searchParams.get("error");
    const oauthErrorDescription = searchParams.get("error_description");
    const code = searchParams.get("code");
    const state = searchParams.get("state");

    const fail = (text: string) => {
      if (cancelled)
        return;

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

        if (cancelled)
          return;

        if (!result.refreshTokenStored) {
          fail(ITSM_ATLASSIAN_OAUTH_CALLBACK_REFRESH_TOKEN_STORE_FAILED);

          return;
        }

        setDone(true);
        setMessage("Jira is connected with OAuth. You can run a connector health probe from ITSM settings.");
      } catch (error: unknown) {
        if (!cancelled)
          fail(mapItsmAtlassianOAuthCallbackFailure(error));
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [searchParams]);

  return (
    <div className="max-w-[640px] space-y-4" data-testid="itsm-oauth-callback-page">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <h2 className={cn("mt-0", OPERATOR_TYPOGRAPHY.pageTitle)}>Atlassian connector consent</h2>
        <PageContextualHelpButton />
      </div>
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
        <Link href={INTEGRATIONS_JIRA_PATH} className="text-sm font-medium text-al-accent-primary hover:underline">
          Return to Jira integration settings
        </Link>
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
  );
}
