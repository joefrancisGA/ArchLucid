import { Suspense } from "react";

import { ItsmAtlassianOAuthCallbackClient } from "@/app/(operator)/integrations/itsm/oauth/callback/ItsmAtlassianOAuthCallbackClient";
import { ItsmAtlassianOAuthCallbackLoadingView } from "@/app/(operator)/integrations/itsm/oauth/callback/ItsmAtlassianOAuthCallbackLoadingView";
import { OperatorPageHeader } from "@/components/operator/OperatorPageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { PageContextualHelpButton } from "@/components/usability/PageContextualHelpButton";
import { OPERATOR_CARD, OPERATOR_LAYOUT } from "@/lib/design-tokens";
import { INTEGRATIONS_JIRA_PATH } from "@/lib/integrations-nav-paths";
import {
  ITSM_ATLASSIAN_OAUTH_CALLBACK_LOADING_TITLE,
} from "@/lib/itsm/itsm-atlassian-oauth-callback-page-copy";
import { cn } from "@/lib/utils";

function ItsmOAuthCallbackLoading(): React.ReactElement {
  return (
    <div
      className={cn("w-full max-w-[68rem] px-4 py-4 sm:px-6 lg:px-8", OPERATOR_LAYOUT.majorSectionGap)}
      data-testid="itsm-oauth-callback-page"
    >
      <OperatorPageHeader
        title={ITSM_ATLASSIAN_OAUTH_CALLBACK_LOADING_TITLE}
        titleTestId="itsm-oauth-callback-page-title"
        navHref={INTEGRATIONS_JIRA_PATH}
        headingLevel="h1"
        actions={<PageContextualHelpButton />}
      />

      <Card className="max-w-[40rem] border-neutral-200/80 bg-al-surface-raised dark:border-neutral-800">
        <CardContent className={cn(OPERATOR_CARD.body)}>
          <ItsmAtlassianOAuthCallbackLoadingView />
        </CardContent>
      </Card>
    </div>
  );
}

export default function ItsmAtlassianOAuthCallbackPage(): React.ReactElement {
  return (
    <Suspense fallback={<ItsmOAuthCallbackLoading />}>
      <ItsmAtlassianOAuthCallbackClient />
    </Suspense>
  );
}
