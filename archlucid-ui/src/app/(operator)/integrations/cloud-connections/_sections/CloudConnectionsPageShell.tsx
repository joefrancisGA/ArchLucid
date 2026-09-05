"use client";

import { cn } from "@/lib/utils";

import { IntegrationConnectChecklist } from "@/components/integrations/IntegrationConnectChecklist";
import { OperatorPageContainer } from "@/components/operator/OperatorPageContainer";
import { PageHeading } from "@/components/PageHeading";
import { PageContextualHelpButton } from "@/components/usability/PageContextualHelpButton";
import { CloudConnectionsEvidenceOrientationStrip } from "@/components/evidence-orientation/registry/claim-and-sources-strips";
import {
  CLOUD_CONNECTIONS_OPTIONAL_NOTE,
  CLOUD_CONNECTIONS_PAGE_TITLE,
} from "@/lib/cloud-connections-copy";
import { CLOUD_CONNECTIONS_CLAIM_DISCIPLINE } from "@/lib/cloud-connections-evidence-copy";
import { CLOUD_CONNECTIONS_PATH } from "@/lib/integrations-nav-paths";
import { OPERATOR_LAYOUT, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";
import { HELP_PAGE_LAYOUT } from "@/lib/help/help-page-layout";

import { CloudConnectionsProviderList } from "./CloudConnectionsProviderList";
import {
  CLOUD_CONNECTIONS_PAGE_FIRST_VIEWPORT_TEST_ID,
  CLOUD_CONNECTIONS_PAGE_HEADER_CLAIM_DISCIPLINE_TEST_ID,
  CLOUD_CONNECTIONS_PAGE_PRIMARY_CONTENT_ID,
  CLOUD_CONNECTIONS_PAGE_SKIP_LINK_LABEL,
  CLOUD_CONNECTIONS_PAGE_SKIP_TARGET_ID,
  CLOUD_CONNECTIONS_START_HERE_CARD_TITLE,
  CLOUD_CONNECTIONS_START_HERE_LEAD,
  cloudConnectionsPageSubtitle,
} from "./cloud-connections-page-copy";
import type { CloudConnectionsPageViewModel } from "./use-cloud-connections-page";

export type CloudConnectionsPageShellProps = CloudConnectionsPageViewModel;

export function CloudConnectionsPageShell(props: CloudConnectionsPageShellProps) {
  const { showConnectionContent, cloudConnectSteps, cloudConnectEmphasizedStepId } = props;
  const buyerPolishedShell = isBuyerPolishedOperatorShellEnv();

  const checklist = showConnectionContent ? (
    <IntegrationConnectChecklist
      title="Connect cloud inventory"
      steps={cloudConnectSteps}
      emphasizedStepId={cloudConnectEmphasizedStepId}
      testIdPrefix="cloud-connections"
    />
  ) : null;

  const orientationStrip = buyerPolishedShell ? (
    <div data-testid="cloud-connections-orientation-bottom">
      <CloudConnectionsEvidenceOrientationStrip />
    </div>
  ) : (
    <CloudConnectionsEvidenceOrientationStrip />
  );

  const providerList = <CloudConnectionsProviderList {...props} />;

  if (!buyerPolishedShell) {
    return (
      <OperatorPageContainer
        variant="workflow"
        className={cn("px-1 py-4 sm:px-0", OPERATOR_LAYOUT.sectionStack)}
        data-testid="cloud-connections-page"
      >
        <PageHeading
          navHref={CLOUD_CONNECTIONS_PATH}
          title={CLOUD_CONNECTIONS_PAGE_TITLE}
          variant="integration"
          actions={<PageContextualHelpButton />}
          description={
            <>
              <p className={cn("m-0 max-w-3xl text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
                {cloudConnectionsPageSubtitle(false)}
              </p>
              <p className={cn("m-0 max-w-3xl text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
                {CLOUD_CONNECTIONS_OPTIONAL_NOTE}
              </p>
            </>
          }
        />

        {checklist}
        {orientationStrip}
        {providerList}
      </OperatorPageContainer>
    );
  }

  return (
    <OperatorPageContainer
      variant="workflow"
      className={cn("px-1 py-4 sm:px-0", OPERATOR_LAYOUT.sectionStack)}
      data-testid="cloud-connections-page"
    >
      <a
        href={`#${CLOUD_CONNECTIONS_PAGE_SKIP_TARGET_ID}`}
        className={HELP_PAGE_LAYOUT.technicalReferenceSkipLink}
      >
        {CLOUD_CONNECTIONS_PAGE_SKIP_LINK_LABEL}
      </a>

      <div
        id={CLOUD_CONNECTIONS_PAGE_PRIMARY_CONTENT_ID}
        data-testid={CLOUD_CONNECTIONS_PAGE_PRIMARY_CONTENT_ID}
        className={cn("scroll-mt-24", OPERATOR_LAYOUT.sectionStack)}
      >
        <PageHeading
          navHref={CLOUD_CONNECTIONS_PATH}
          title={CLOUD_CONNECTIONS_PAGE_TITLE}
          variant="integration"
          claimDiscipline={CLOUD_CONNECTIONS_CLAIM_DISCIPLINE}
          claimDisciplineTestId={CLOUD_CONNECTIONS_PAGE_HEADER_CLAIM_DISCIPLINE_TEST_ID}
          description={
            <p className={cn("m-0 max-w-3xl text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
              {cloudConnectionsPageSubtitle(true)}
            </p>
          }
        />

        <div
          id={CLOUD_CONNECTIONS_PAGE_SKIP_TARGET_ID}
          data-testid={CLOUD_CONNECTIONS_PAGE_FIRST_VIEWPORT_TEST_ID}
          className={cn(
            "scroll-mt-24 border-b border-neutral-200 pb-6 dark:border-neutral-800",
            OPERATOR_LAYOUT.sectionStack,
          )}
        >
          <section
            className="mb-4 space-y-3 rounded-md border border-neutral-200 bg-neutral-50/80 p-4 dark:border-neutral-700 dark:bg-neutral-900/40"
            data-testid="cloud-connections-action-panel"
            aria-labelledby="cloud-connections-action-panel-heading"
          >
            <h2
              id="cloud-connections-action-panel-heading"
              className={cn("m-0 text-al-text-primary", OPERATOR_TYPOGRAPHY.sectionTitle)}
            >
              {CLOUD_CONNECTIONS_START_HERE_CARD_TITLE}
            </h2>
            <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
              {CLOUD_CONNECTIONS_START_HERE_LEAD}
            </p>
          </section>

          {checklist}
          {providerList}
        </div>

        {orientationStrip}
      </div>
    </OperatorPageContainer>
  );
}
