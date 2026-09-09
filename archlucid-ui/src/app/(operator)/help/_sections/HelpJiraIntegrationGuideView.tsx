import Link from "next/link";

import { HelpTopicHashScroll } from "@/app/(operator)/help/HelpTopicHashScroll";
import { HelpJiraIntegrationSourcesOrientationStrip } from "@/app/(operator)/help/_sections/HelpJiraIntegrationSourcesOrientationStrip";
import { JiraIntegrationHelpClaimDisciplineStrip } from "@/components/help/JiraIntegrationHelpClaimDisciplineStrip";
import { JiraIntegrationHelpEvidenceOrientationStrip } from "@/components/help/JiraIntegrationHelpEvidenceOrientationStrip";
import { HelpTopicGuidePageHeader } from "@/components/help/HelpTopicGuidePageHeader";
import { HelpTopicRegistryProvenanceLine } from "@/components/help/HelpTopicRegistryProvenanceLine";
import { HelpTopicTableOfContents } from "@/components/help/HelpTopicTableOfContents";
import { Button } from "@/components/ui/button";
import { PageContextualHelpButton } from "@/components/usability/PageContextualHelpButton";
import { operatorPageContainerClass } from "@/components/operator/OperatorPageContainer";
import { resolveGuideHeadingsForStrip } from "@/lib/claim-discipline-policy";
import {
  OPERATOR_LAYOUT,
  OPERATOR_LINK,
  OPERATOR_SHELL_SCROLL_OFFSET_CLASS,
  OPERATOR_TYPOGRAPHY,
} from "@/lib/design-tokens";
import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";
import {
  HELP_PAGE_LAYOUT,
  HELP_PAGE_MIN_TOC_HEADINGS,
  resolveHelpPageContentGridClass,
} from "@/lib/help/help-page-layout";
import {
  JIRA_INTEGRATION_HELP_BEFORE_YOU_START_BODY,
  JIRA_INTEGRATION_HELP_CLAIM_HEADING_ID,
  JIRA_INTEGRATION_HELP_CONNECTION_PRECONDITION,
  JIRA_INTEGRATION_HELP_FEATURE_ITEMS,
  JIRA_INTEGRATION_HELP_GUIDE_HEADINGS,
  JIRA_INTEGRATION_HELP_HOW_TO_READ_STEPS,
  JIRA_INTEGRATION_HELP_OVERVIEW,
  JIRA_INTEGRATION_HELP_PAGE_SUBTITLE,
  JIRA_INTEGRATION_HELP_PAGE_TITLE,
  JIRA_INTEGRATION_HELP_PRIMARY_ACTION,
  JIRA_INTEGRATION_HELP_START_HERE_CARD_TITLE,
} from "@/lib/jira-integration-help-guide-content";
import {
  JIRA_INTEGRATION_HELP_CANONICAL_PATH,
  JIRA_INTEGRATION_HELP_CLAIM_DISCIPLINE,
} from "@/lib/jira-integration-help-evidence-copy";
import {
  JIRA_INTEGRATION_HELP_BUYER_OVERVIEW,
  JIRA_INTEGRATION_HELP_FIRST_VIEWPORT_TEST_ID,
  JIRA_INTEGRATION_HELP_HEADER_CLAIM_DISCIPLINE_TEST_ID,
  JIRA_INTEGRATION_HELP_PAGE_LEAD,
  JIRA_INTEGRATION_HELP_PAGE_SUBTITLE_BUYER,
  JIRA_INTEGRATION_HELP_PRIMARY_CONTENT_ID,
  JIRA_INTEGRATION_HELP_SKIP_LINK_LABEL,
  JIRA_INTEGRATION_HELP_SKIP_TARGET_ID,
  JIRA_INTEGRATION_HELP_START_HERE_HELPER,
  JIRA_INTEGRATION_HELP_WORKSPACE_TEST_ID,
} from "@/lib/jira-integration-help-page-copy";
import { JIRA_INTEGRATION_HELP_TOPIC_LABEL } from "@/lib/jira-integration-evidence-copy";
import type { ProductDocumentationEntry } from "@/lib/product-documentation-registry";
import { cn } from "@/lib/utils";

type HelpJiraIntegrationGuideViewProps = {
  readonly entry: ProductDocumentationEntry;
};

function HelpSectionHeading(props: { readonly id: string; readonly children: string }): React.ReactElement {
  return (
    <h2
      id={props.id}
      className={cn(OPERATOR_SHELL_SCROLL_OFFSET_CLASS, OPERATOR_TYPOGRAPHY.sectionTitle, "m-0 scroll-mt-24")}
    >
      {props.children}
    </h2>
  );
}

function jiraIntegrationHelpPageSubtitle(buyerPolishedShell: boolean): string {
  return buyerPolishedShell ? JIRA_INTEGRATION_HELP_PAGE_SUBTITLE_BUYER : JIRA_INTEGRATION_HELP_PAGE_SUBTITLE;
}

function JiraIntegrationStartHerePanel(): React.ReactElement {
  return (
    <section
      className="space-y-3 rounded-md border border-neutral-200 bg-neutral-50/80 p-4 dark:border-neutral-700 dark:bg-neutral-900/40"
      data-testid="help-jira-integration-action-panel"
      aria-labelledby="help-jira-integration-action-panel-heading"
    >
      <h2
        id="help-jira-integration-action-panel-heading"
        className={cn("m-0 text-al-text-primary", OPERATOR_TYPOGRAPHY.sectionTitle)}
      >
        {JIRA_INTEGRATION_HELP_START_HERE_CARD_TITLE}
      </h2>
      <div className="flex flex-wrap items-center gap-2">
        <Button asChild size="sm" variant="primary">
          <Link href={JIRA_INTEGRATION_HELP_PRIMARY_ACTION.href}>
            {JIRA_INTEGRATION_HELP_PRIMARY_ACTION.label}
          </Link>
        </Button>
      </div>
      <p
        className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}
        data-testid="help-jira-integration-connection-precondition"
      >
        <span className="font-medium text-al-text-primary">Atlassian connection.</span>{" "}
        {JIRA_INTEGRATION_HELP_CONNECTION_PRECONDITION}
      </p>
      <p
        className={cn("m-0 max-w-3xl text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}
        data-testid="help-jira-integration-start-here-helper"
      >
        {JIRA_INTEGRATION_HELP_START_HERE_HELPER}
      </p>
    </section>
  );
}

/** Operator Jira integration orientation for `/help/jira-integration`. */
export function HelpJiraIntegrationGuideView(props: HelpJiraIntegrationGuideViewProps): React.ReactElement {
  const { entry } = props;
  const buyerPolishedShell = isBuyerPolishedOperatorShellEnv();
  const guideHeadings = resolveGuideHeadingsForStrip(
    "help-jira-integration",
    JIRA_INTEGRATION_HELP_GUIDE_HEADINGS,
    JIRA_INTEGRATION_HELP_CLAIM_HEADING_ID,
  );
  const showSectionNav = !buyerPolishedShell && guideHeadings.length >= HELP_PAGE_MIN_TOC_HEADINGS;
  const contentGridClass = resolveHelpPageContentGridClass(showSectionNav ? guideHeadings.length : 0);
  const readingBodyClass = cn("m-0 leading-relaxed", HELP_PAGE_LAYOUT.readingBody);

  return (
    <article
      className={cn(operatorPageContainerClass("workflow"), OPERATOR_LAYOUT.majorSectionGap)}
      data-testid="help-jira-integration-guide"
    >
      {buyerPolishedShell ? (
        <a href={`#${JIRA_INTEGRATION_HELP_SKIP_TARGET_ID}`} className={HELP_PAGE_LAYOUT.technicalReferenceSkipLink}>
          {JIRA_INTEGRATION_HELP_SKIP_LINK_LABEL}
        </a>
      ) : null}

      <HelpTopicHashScroll />

      <div
        id={buyerPolishedShell ? JIRA_INTEGRATION_HELP_PRIMARY_CONTENT_ID : undefined}
        data-testid={buyerPolishedShell ? JIRA_INTEGRATION_HELP_PRIMARY_CONTENT_ID : undefined}
        className={cn(buyerPolishedShell && "scroll-mt-24 space-y-6", buyerPolishedShell && OPERATOR_LAYOUT.sectionStack)}
      >
        <HelpTopicGuidePageHeader
          title={JIRA_INTEGRATION_HELP_PAGE_TITLE}
          titleTestId="help-jira-integration-page-title"
          subtitle={jiraIntegrationHelpPageSubtitle(buyerPolishedShell)}
          subtitleClassName={
            buyerPolishedShell ? cn("max-w-3xl leading-relaxed", HELP_PAGE_LAYOUT.readingBody) : "max-w-3xl"
          }
          navHref={JIRA_INTEGRATION_HELP_CANONICAL_PATH}
          headingLevel="h1"
          metadata={buyerPolishedShell ? undefined : <HelpTopicRegistryProvenanceLine entry={entry} />}
          claimDiscipline={buyerPolishedShell ? JIRA_INTEGRATION_HELP_CLAIM_DISCIPLINE : undefined}
          claimDisciplineTestId={
            buyerPolishedShell ? JIRA_INTEGRATION_HELP_HEADER_CLAIM_DISCIPLINE_TEST_ID : undefined
          }
          actions={buyerPolishedShell ? undefined : <PageContextualHelpButton />}
        />

        {buyerPolishedShell ? null : <JiraIntegrationHelpClaimDisciplineStrip />}

        {buyerPolishedShell ? (
          <div
            id={JIRA_INTEGRATION_HELP_SKIP_TARGET_ID}
            data-testid={JIRA_INTEGRATION_HELP_FIRST_VIEWPORT_TEST_ID}
            className={cn(
              "scroll-mt-24 border-b border-neutral-200 pb-6 dark:border-neutral-800",
              OPERATOR_LAYOUT.sectionStack,
            )}
          >
            <div className="space-y-4" data-testid="help-jira-integration-buyer-intro">
              <p className={readingBodyClass} data-testid="help-jira-integration-intro">
                {JIRA_INTEGRATION_HELP_PAGE_LEAD}
              </p>
            </div>
            <JiraIntegrationStartHerePanel />
          </div>
        ) : null}

        {buyerPolishedShell ? (
          <p className={readingBodyClass} data-testid="help-jira-integration-overview">
            {JIRA_INTEGRATION_HELP_BUYER_OVERVIEW}
          </p>
        ) : null}

        <section
          className={buyerPolishedShell ? cn("min-w-0", OPERATOR_LAYOUT.sectionStack) : undefined}
          data-testid={buyerPolishedShell ? JIRA_INTEGRATION_HELP_WORKSPACE_TEST_ID : undefined}
        >
          <div className={contentGridClass}>
            <div className={cn(HELP_PAGE_LAYOUT.contentColumn, "space-y-4")}>
            {!buyerPolishedShell ? (
              <JiraIntegrationHelpEvidenceOrientationStrip readingBodyClassName={HELP_PAGE_LAYOUT.readingBody} />
            ) : null}

            {!buyerPolishedShell ? (
              <p className={readingBodyClass} data-testid="help-jira-integration-overview">
                {JIRA_INTEGRATION_HELP_OVERVIEW}
              </p>
            ) : null}

            {!buyerPolishedShell ? <JiraIntegrationStartHerePanel /> : null}

            <section
              aria-labelledby="what-jira-integration-does"
              className="space-y-3 border-t border-neutral-200 pt-4 dark:border-neutral-800"
            >
              <HelpSectionHeading id="what-jira-integration-does">What Jira integration does</HelpSectionHeading>
              <dl
                className={cn("m-0 grid gap-3 sm:grid-cols-2", HELP_PAGE_LAYOUT.readingBody)}
                data-testid="help-jira-integration-feature-items"
              >
                {JIRA_INTEGRATION_HELP_FEATURE_ITEMS.map((item) => (
                  <div key={item.label}>
                    <dt className="font-medium text-al-text-primary">
                      {item.href === undefined ? (
                        item.label
                      ) : (
                        <Link className={OPERATOR_LINK.nav} href={item.href}>
                          {item.label}
                        </Link>
                      )}
                    </dt>
                    <dd className="m-0 mt-1 text-al-text-secondary">{item.detail}</dd>
                  </div>
                ))}
              </dl>
            </section>

            <section
              aria-labelledby="before-you-start"
              className="space-y-3 border-t border-neutral-200 pt-4 dark:border-neutral-800"
            >
              <HelpSectionHeading id="before-you-start">Before you start</HelpSectionHeading>
              <p className={readingBodyClass} data-testid="help-jira-integration-before-you-start">
                {JIRA_INTEGRATION_HELP_BEFORE_YOU_START_BODY}
              </p>
            </section>

            <section
              aria-labelledby="how-jira-integration-works"
              className="space-y-3 border-t border-neutral-200 pt-4 dark:border-neutral-800"
            >
              <HelpSectionHeading id="how-jira-integration-works">{JIRA_INTEGRATION_HELP_TOPIC_LABEL}</HelpSectionHeading>
              <ol
                className={cn("m-0 list-decimal space-y-2 pl-5", HELP_PAGE_LAYOUT.readingBody)}
                data-testid="help-jira-integration-how-stepper"
              >
                {JIRA_INTEGRATION_HELP_HOW_TO_READ_STEPS.map((step) => (
                  <li key={step}>{step}</li>
                ))}
              </ol>
            </section>
          </div>

            {showSectionNav ? <HelpTopicTableOfContents headings={guideHeadings} /> : null}
          </div>
        </section>

        {buyerPolishedShell ? <HelpJiraIntegrationSourcesOrientationStrip /> : null}
      </div>
    </article>
  );
}
