import { Suspense } from "react";

import { ItsmAtlassianOAuthCallbackClient } from "@/app/(operator)/integrations/itsm/oauth/callback/ItsmAtlassianOAuthCallbackClient";
import { ItsmAtlassianOAuthCallbackHeaderActions } from "@/app/(operator)/integrations/itsm/oauth/callback/ItsmAtlassianOAuthCallbackHeaderActions";
import { ItsmAtlassianOAuthCallbackLoadingView } from "@/app/(operator)/integrations/itsm/oauth/callback/ItsmAtlassianOAuthCallbackLoadingView";
import { OperatorPageContainer } from "@/components/operator/OperatorPageContainer";
import { OperatorPageHeader } from "@/components/operator/OperatorPageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { OPERATOR_CARD, OPERATOR_LAYOUT } from "@/lib/design-tokens";
import { HELP_PAGE_LAYOUT } from "@/lib/help/help-page-layout";
import { INTEGRATIONS_JIRA_PATH } from "@/lib/integrations-nav-paths";
import {
  ITSM_ATLASSIAN_OAUTH_CALLBACK_FIRST_VIEWPORT_ID,
  ITSM_ATLASSIAN_OAUTH_CALLBACK_HEADER_CLAIM_DISCIPLINE_TEST_ID,
  ITSM_ATLASSIAN_OAUTH_CALLBACK_LOADING_TITLE,
  ITSM_ATLASSIAN_OAUTH_CALLBACK_PRIMARY_CONTENT_ID,
  ITSM_ATLASSIAN_OAUTH_CALLBACK_SKIP_LINK_LABEL,
  ITSM_ATLASSIAN_OAUTH_CALLBACK_SKIP_TARGET_ID,
} from "@/lib/itsm/itsm-atlassian-oauth-callback-page-copy";
import { ITSM_OAUTH_CALLBACK_CLAIM_DISCIPLINE } from "@/lib/itsm/itsm-oauth-callback-evidence-copy";
import { cn } from "@/lib/utils";

function ItsmOAuthCallbackLoading(): React.ReactElement {
  return (
    <OperatorPageContainer
      variant="workflow"
      className={cn("px-4 py-4 sm:px-6 lg:px-8", OPERATOR_LAYOUT.majorSectionGap)}
      data-testid="itsm-oauth-callback-page"
    >
      <a
        href={`#${ITSM_ATLASSIAN_OAUTH_CALLBACK_SKIP_TARGET_ID}`}
        className={HELP_PAGE_LAYOUT.technicalReferenceSkipLink}
      >
        {ITSM_ATLASSIAN_OAUTH_CALLBACK_SKIP_LINK_LABEL}
      </a>

      <OperatorPageHeader
        title={ITSM_ATLASSIAN_OAUTH_CALLBACK_LOADING_TITLE}
        titleTestId="itsm-oauth-callback-page-title"
        navHref={INTEGRATIONS_JIRA_PATH}
        headingLevel="h1"
        claimDiscipline={ITSM_OAUTH_CALLBACK_CLAIM_DISCIPLINE}
        claimDisciplineTestId={ITSM_ATLASSIAN_OAUTH_CALLBACK_HEADER_CLAIM_DISCIPLINE_TEST_ID}
        actions={<ItsmAtlassianOAuthCallbackHeaderActions phase="loading" />}
      />

      <div
        id={ITSM_ATLASSIAN_OAUTH_CALLBACK_PRIMARY_CONTENT_ID}
        data-testid="itsm-oauth-callback-primary-content"
        className={cn("scroll-mt-24 space-y-4", OPERATOR_LAYOUT.sectionStack)}
      >
        <div
          id={ITSM_ATLASSIAN_OAUTH_CALLBACK_FIRST_VIEWPORT_ID}
          data-testid={ITSM_ATLASSIAN_OAUTH_CALLBACK_FIRST_VIEWPORT_ID}
          className="space-y-4 border-b border-neutral-200 pb-6 dark:border-neutral-800"
        >
          <Card className="max-w-[40rem] border-neutral-200/80 bg-al-surface-raised dark:border-neutral-800">
            <CardContent className={cn(OPERATOR_CARD.body)}>
              <ItsmAtlassianOAuthCallbackLoadingView />
            </CardContent>
          </Card>
        </div>
      </div>
    </OperatorPageContainer>
  );
}

export default function ItsmAtlassianOAuthCallbackPage(): React.ReactElement {
  return (
    <Suspense fallback={<ItsmOAuthCallbackLoading />}>
      <ItsmAtlassianOAuthCallbackClient />
    </Suspense>
  );
}
