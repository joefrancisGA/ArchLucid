import Link from "next/link";

import { HelpTopicHashScroll } from "@/app/(operator)/help/HelpTopicHashScroll";
import { HelpSlackIntegrationWorkspaceReadinessStrip } from "@/app/(operator)/help/_sections/HelpSlackIntegrationWorkspaceReadinessStrip";
import { SlackIntegrationHelpClaimDisciplineStrip } from "@/components/help/SlackIntegrationHelpClaimDisciplineStrip";
import { SlackIntegrationHelpEvidenceOrientationStrip } from "@/components/help/SlackIntegrationHelpEvidenceOrientationStrip";
import { HelpTopicGuidePageHeader } from "@/components/help/HelpTopicGuidePageHeader";
import { HelpTopicRegistryProvenanceLine } from "@/components/help/HelpTopicRegistryProvenanceLine";
import { HelpTopicTableOfContents } from "@/components/help/HelpTopicTableOfContents";
import { Button } from "@/components/ui/button";
import {
  OPERATOR_DISCLOSURE_TRIGGER_CLASS,
  OPERATOR_LAYOUT,
  OPERATOR_SHELL_SCROLL_OFFSET_CLASS,
  OPERATOR_TYPOGRAPHY,
} from "@/lib/design-tokens";
import { HELP_PAGE_LAYOUT, resolveHelpPageContentGridClass } from "@/lib/help/help-page-layout";
import type { ProductDocumentationEntry } from "@/lib/product-documentation-registry";
import {
  SLACK_INTEGRATION_HELP_CREDENTIAL_DISCLOSURE_BODY,
  SLACK_INTEGRATION_HELP_CREDENTIAL_DISCLOSURE_TITLE,
  SLACK_INTEGRATION_HELP_FEATURE_ITEMS,
  SLACK_INTEGRATION_HELP_GUIDE_HEADINGS,
  SLACK_INTEGRATION_HELP_HOW_TO_READ_STEPS,
  SLACK_INTEGRATION_HELP_OVERVIEW,
  SLACK_INTEGRATION_HELP_PAGE_SUBTITLE,
  SLACK_INTEGRATION_HELP_PAGE_TITLE,
  SLACK_INTEGRATION_HELP_PRIMARY_ACTION,
  SLACK_INTEGRATION_HELP_SETUP_STEPS,
  SLACK_INTEGRATION_HELP_START_HERE_CARD_TITLE,
} from "@/lib/slack-integration-help-guide-content";
import { SLACK_INTEGRATION_HELP_CANONICAL_PATH } from "@/lib/slack-integration-help-evidence-copy";
import { SLACK_INTEGRATION_HELP_TOPIC_LABEL } from "@/lib/slack-integration-evidence-copy";
import { cn } from "@/lib/utils";
import { operatorPageContainerClass } from "@/components/operator/OperatorPageContainer";

type HelpSlackIntegrationGuideViewProps = {
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

/** Operator Slack integration orientation for `/help/slack-integration`. */
export function HelpSlackIntegrationGuideView(props: HelpSlackIntegrationGuideViewProps): React.ReactElement {
  const { entry } = props;
  const contentGridClass = resolveHelpPageContentGridClass(SLACK_INTEGRATION_HELP_GUIDE_HEADINGS.length);
  const readingBodyClass = cn("m-0 leading-relaxed", HELP_PAGE_LAYOUT.readingBody);

  return (
    <article
      className={cn(operatorPageContainerClass("workflow"), OPERATOR_LAYOUT.majorSectionGap)}
      data-testid="help-slack-integration-guide"
    >
      <HelpTopicHashScroll />

      <HelpTopicGuidePageHeader
        title={SLACK_INTEGRATION_HELP_PAGE_TITLE}
        titleTestId="help-slack-integration-page-title"
        subtitle={SLACK_INTEGRATION_HELP_PAGE_SUBTITLE}
        navHref={SLACK_INTEGRATION_HELP_CANONICAL_PATH}
        headingLevel="h1"
        metadata={<HelpTopicRegistryProvenanceLine entry={entry} />}
        actions={
          <Button asChild size="sm" variant="primary">
            <Link href={SLACK_INTEGRATION_HELP_PRIMARY_ACTION.href}>
              {SLACK_INTEGRATION_HELP_PRIMARY_ACTION.label}
            </Link>
          </Button>
        }
      />

      <SlackIntegrationHelpClaimDisciplineStrip />

      <div className={contentGridClass}>
        <div className={cn(HELP_PAGE_LAYOUT.contentColumn, "space-y-4")}>
          <SlackIntegrationHelpEvidenceOrientationStrip readingBodyClassName={HELP_PAGE_LAYOUT.readingBody} />

          <p className={readingBodyClass} data-testid="help-slack-integration-overview">
            {SLACK_INTEGRATION_HELP_OVERVIEW}
          </p>

          <section
            className="space-y-3 rounded-md border border-neutral-200 bg-neutral-50/80 p-4 dark:border-neutral-700 dark:bg-neutral-900/40"
            data-testid="help-slack-integration-action-panel"
            aria-labelledby="help-slack-integration-action-panel-heading"
          >
            <h2
              id="help-slack-integration-action-panel-heading"
              className={cn("m-0 text-al-text-primary", OPERATOR_TYPOGRAPHY.sectionTitle)}
            >
              {SLACK_INTEGRATION_HELP_START_HERE_CARD_TITLE}
            </h2>
            <HelpSlackIntegrationWorkspaceReadinessStrip showSetupPrecondition />
          </section>

          <section
            aria-labelledby="what-slack-notifications-do"
            className="space-y-3 border-t border-neutral-200 pt-4 dark:border-neutral-800"
          >
            <HelpSectionHeading id="what-slack-notifications-do">What Slack notifications do</HelpSectionHeading>
            <dl
              className={cn("m-0 grid gap-3 sm:grid-cols-2", HELP_PAGE_LAYOUT.readingBody)}
              data-testid="help-slack-integration-feature-items"
            >
              {SLACK_INTEGRATION_HELP_FEATURE_ITEMS.map((item) => (
                <div key={item.label}>
                  <dt className="font-medium text-al-text-primary">{item.label}</dt>
                  <dd className="m-0 mt-1 text-al-text-secondary">{item.detail}</dd>
                </div>
              ))}
            </dl>
            <details
              className={HELP_PAGE_LAYOUT.details}
              data-testid="help-slack-integration-credential-handling-details"
            >
              <summary className={cn("cursor-pointer select-none", OPERATOR_DISCLOSURE_TRIGGER_CLASS)}>
                {SLACK_INTEGRATION_HELP_CREDENTIAL_DISCLOSURE_TITLE}
              </summary>
              <div className={HELP_PAGE_LAYOUT.detailsBody}>
                <p className={cn("m-0", HELP_PAGE_LAYOUT.readingBody)}>{SLACK_INTEGRATION_HELP_CREDENTIAL_DISCLOSURE_BODY}</p>
              </div>
            </details>
          </section>

          <section
            aria-labelledby="set-up-slack-notifications"
            className="space-y-3 border-t border-neutral-200 pt-4 dark:border-neutral-800"
          >
            <HelpSectionHeading id="set-up-slack-notifications">Set up Slack notifications</HelpSectionHeading>
            <ol
              className={cn("m-0 list-decimal space-y-2 pl-5", HELP_PAGE_LAYOUT.readingBody)}
              data-testid="help-slack-integration-setup-stepper"
            >
              {SLACK_INTEGRATION_HELP_SETUP_STEPS.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ol>
          </section>

          <section
            aria-labelledby="how-slack-notifications-work"
            className="space-y-3 border-t border-neutral-200 pt-4 dark:border-neutral-800"
          >
            <HelpSectionHeading id="how-slack-notifications-work">{SLACK_INTEGRATION_HELP_TOPIC_LABEL}</HelpSectionHeading>
            <ol
              className={cn("m-0 list-decimal space-y-2 pl-5", HELP_PAGE_LAYOUT.readingBody)}
              data-testid="help-slack-integration-how-stepper"
            >
              {SLACK_INTEGRATION_HELP_HOW_TO_READ_STEPS.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ol>
          </section>

        </div>

        <HelpTopicTableOfContents headings={SLACK_INTEGRATION_HELP_GUIDE_HEADINGS} />
      </div>
    </article>
  );
}
