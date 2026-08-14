import Link from "next/link";

import { HelpTopicHashScroll } from "@/app/(operator)/help/HelpTopicHashScroll";
import { TeamsIntegrationHelpEvidenceOrientationStrip } from "@/components/help/TeamsIntegrationHelpEvidenceOrientationStrip";
import { HelpTopicGuidePageHeader } from "@/components/help/HelpTopicGuidePageHeader";
import { HelpTopicRegistryProvenanceLine } from "@/components/help/HelpTopicRegistryProvenanceLine";
import { HelpTopicTableOfContents } from "@/components/help/HelpTopicTableOfContents";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusTag } from "@/components/ui/status-tag";
import { PageContextualHelpButton } from "@/components/usability/PageContextualHelpButton";
import {
  OPERATOR_CARD,
  OPERATOR_LAYOUT,
  OPERATOR_SHELL_SCROLL_OFFSET_CLASS,
  OPERATOR_TYPOGRAPHY,
} from "@/lib/design-tokens";
import { HELP_PAGE_LAYOUT, resolveHelpPageContentGridClass } from "@/lib/help/help-page-layout";
import type { ProductDocumentationEntry } from "@/lib/product-documentation-registry";
import {
  TEAMS_INTEGRATION_HELP_BREADCRUMB_TOPIC_TITLE,
  TEAMS_INTEGRATION_HELP_FEATURE_ITEMS,
  TEAMS_INTEGRATION_HELP_GUIDE_HEADINGS,
  TEAMS_INTEGRATION_HELP_HOW_TO_READ_STEPS,
  TEAMS_INTEGRATION_HELP_OVERVIEW,
  TEAMS_INTEGRATION_HELP_PAGE_SUBTITLE,
  TEAMS_INTEGRATION_HELP_PAGE_TITLE,
  TEAMS_INTEGRATION_HELP_PRIMARY_ACTION,
  TEAMS_INTEGRATION_HELP_SETUP_STEPS,
  TEAMS_INTEGRATION_HELP_START_HERE_CARD_TITLE,
  TEAMS_INTEGRATION_HELP_WEBHOOK_PRECONDITION,
  TEAMS_INTEGRATION_HELP_WEBHOOK_PRECONDITION_TAG,
} from "@/lib/teams-integration-help-guide-content";
import { TEAMS_INTEGRATION_HELP_CANONICAL_PATH } from "@/lib/teams-integration-help-evidence-copy";
import { TEAMS_INTEGRATION_HELP_TOPIC_LABEL } from "@/lib/teams-integration-evidence-copy";
import { cn } from "@/lib/utils";

type HelpTeamsIntegrationGuideViewProps = {
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

/** Operator Teams integration orientation for `/help/teams-integration`. */
export function HelpTeamsIntegrationGuideView(props: HelpTeamsIntegrationGuideViewProps): React.ReactElement {
  const { entry } = props;
  const contentGridClass = resolveHelpPageContentGridClass(TEAMS_INTEGRATION_HELP_GUIDE_HEADINGS.length);
  const readingBodyClass = cn("m-0 leading-relaxed", HELP_PAGE_LAYOUT.readingBody);

  return (
    <article
      className={cn(OPERATOR_LAYOUT.majorSectionGap, "w-full max-w-[72rem]")}
      data-testid="help-teams-integration-guide"
    >
      <HelpTopicHashScroll />

      <HelpTopicGuidePageHeader
        title={TEAMS_INTEGRATION_HELP_PAGE_TITLE}
        titleTestId="help-teams-integration-page-title"
        subtitle={TEAMS_INTEGRATION_HELP_PAGE_SUBTITLE}
        navHref={TEAMS_INTEGRATION_HELP_CANONICAL_PATH}
        headingLevel="h1"
        metadata={<HelpTopicRegistryProvenanceLine entry={entry} />}
        actions={<PageContextualHelpButton />}
      />

      <div className={contentGridClass}>
        <div className={cn(HELP_PAGE_LAYOUT.contentColumn, "space-y-4")}>
          <p className={readingBodyClass} data-testid="help-teams-integration-overview">
            {TEAMS_INTEGRATION_HELP_OVERVIEW}
          </p>

          <Card className="border-neutral-200 dark:border-neutral-800" data-testid="help-teams-integration-action-panel">
            <CardHeader className={OPERATOR_CARD.header}>
              <CardTitle as="h2" className={cn("m-0", OPERATOR_TYPOGRAPHY.cardTitle)}>
                {TEAMS_INTEGRATION_HELP_START_HERE_CARD_TITLE}
              </CardTitle>
            </CardHeader>
            <CardContent className={cn(OPERATOR_CARD.content, "space-y-2")}>
              <div className="flex flex-wrap items-center gap-2">
                <Button asChild size="sm" variant="primary">
                  <Link href={TEAMS_INTEGRATION_HELP_PRIMARY_ACTION.href}>
                    {TEAMS_INTEGRATION_HELP_PRIMARY_ACTION.label}
                  </Link>
                </Button>
                <StatusTag
                  kind="neutral"
                  label={TEAMS_INTEGRATION_HELP_WEBHOOK_PRECONDITION_TAG}
                  data-testid="help-teams-integration-webhook-precondition-tag"
                />
              </div>
              <p
                className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}
                data-testid="help-teams-integration-webhook-precondition"
              >
                {TEAMS_INTEGRATION_HELP_WEBHOOK_PRECONDITION}
              </p>
            </CardContent>
          </Card>

          <section
            aria-labelledby="what-teams-notifications-do"
            className="space-y-3 border-t border-neutral-200 pt-4 dark:border-neutral-800"
          >
            <HelpSectionHeading id="what-teams-notifications-do">What Teams notifications do</HelpSectionHeading>
            <dl
              className={cn("m-0 grid gap-3 sm:grid-cols-2", HELP_PAGE_LAYOUT.readingBody)}
              data-testid="help-teams-integration-feature-items"
            >
              {TEAMS_INTEGRATION_HELP_FEATURE_ITEMS.map((item) => (
                <div key={item.label}>
                  <dt className="font-medium text-al-text-primary">{item.label}</dt>
                  <dd className="m-0 mt-1 text-al-text-secondary">{item.detail}</dd>
                </div>
              ))}
            </dl>
          </section>

          <section
            aria-labelledby="set-up-teams-notifications"
            className="space-y-3 border-t border-neutral-200 pt-4 dark:border-neutral-800"
          >
            <HelpSectionHeading id="set-up-teams-notifications">Set up Teams notifications</HelpSectionHeading>
            <ol
              className={cn("m-0 list-decimal space-y-2 pl-5", HELP_PAGE_LAYOUT.readingBody)}
              data-testid="help-teams-integration-setup-stepper"
            >
              {TEAMS_INTEGRATION_HELP_SETUP_STEPS.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ol>
          </section>

          <section
            aria-labelledby="how-teams-notifications-work"
            className="space-y-3 border-t border-neutral-200 pt-4 dark:border-neutral-800"
          >
            <HelpSectionHeading id="how-teams-notifications-work">{TEAMS_INTEGRATION_HELP_TOPIC_LABEL}</HelpSectionHeading>
            <ol
              className={cn("m-0 list-decimal space-y-2 pl-5", HELP_PAGE_LAYOUT.readingBody)}
              data-testid="help-teams-integration-how-stepper"
            >
              {TEAMS_INTEGRATION_HELP_HOW_TO_READ_STEPS.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ol>
          </section>

          <TeamsIntegrationHelpEvidenceOrientationStrip readingBodyClassName={HELP_PAGE_LAYOUT.readingBody} />
        </div>

        <HelpTopicTableOfContents headings={TEAMS_INTEGRATION_HELP_GUIDE_HEADINGS} />
      </div>
    </article>
  );
}
