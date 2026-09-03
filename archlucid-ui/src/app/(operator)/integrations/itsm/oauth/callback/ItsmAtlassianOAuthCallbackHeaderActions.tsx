"use client";

import Link from "next/link";

import { PageContextualHelpButton } from "@/components/usability/PageContextualHelpButton";
import { Button } from "@/components/ui/button";
import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";
import { INTEGRATIONS_JIRA_PATH } from "@/lib/integrations-nav-paths";
import { ITSM_ATLASSIAN_OAUTH_CALLBACK_OPEN_JIRA_LABEL } from "@/lib/itsm/itsm-atlassian-oauth-callback-page-copy";

/** Header actions for `/integrations/itsm/oauth/callback` (IIO). */
export function ItsmAtlassianOAuthCallbackHeaderActions(): React.JSX.Element {
  const buyerPolishedShell = isBuyerPolishedOperatorShellEnv();

  return (
    <div className="flex flex-wrap items-center gap-2" data-testid="itsm-oauth-callback-header-actions">
      {buyerPolishedShell ? null : <PageContextualHelpButton />}
      {buyerPolishedShell ? (
        <Button asChild size="sm" variant="primary" data-testid="itsm-oauth-callback-open-jira-header">
          <Link href={INTEGRATIONS_JIRA_PATH}>{ITSM_ATLASSIAN_OAUTH_CALLBACK_OPEN_JIRA_LABEL}</Link>
        </Button>
      ) : null}
    </div>
  );
}
