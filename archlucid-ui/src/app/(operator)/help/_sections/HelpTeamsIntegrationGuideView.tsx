import Link from "next/link";

import { HelpTopicHashScroll } from "@/app/(operator)/help/HelpTopicHashScroll";
import { TeamsIntegrationHelpEvidenceOrientationStrip } from "@/components/help/TeamsIntegrationHelpEvidenceOrientationStrip";
import { HelpTopicRegistryProvenanceLine } from "@/components/help/HelpTopicRegistryProvenanceLine";
import { HelpTopicTableOfContents } from "@/components/help/HelpTopicTableOfContents";
import { OperatorPageHeader } from "@/components/operator/OperatorPageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageContextualHelpButton } from "@/components/usability/PageContextualHelpButton";
import {
  OPERATOR_CARD,
  OPERATOR_LAYOUT,
  OPERATOR_LINK,
  OPERATOR_SHELL_SCROLL_OFFSET_CLASS,
  OPERATOR_TYPOGRAPHY,
} from "@/lib/design-tokens";
import { HELP_PAGE_LAYOUT, resolveHelpPageContentGridClass } from "@/lib/help/help-page-layout";
import type { ProductDocumentationEntry } from "@/lib/product-documentation-registry";
import {
  TEAMS_INTEGRATION_HELP_ALERT_RULES_HREF,
  TEAMS_INTEGRATION_HELP_FEATURE_ITEMS,
  TEAMS_INTEGRATION_HELP_GUIDE_HEADINGS,
  TEAMS_INTEGRATION_HELP_HOW_TO_READ_STEPS,
  TEAMS_INTEGRATION_HELP_OVERVIEW,
  TEAMS_INTEGRATION_HELP_PAGE_SUBTITLE,
  TEAMS_INTEGRATION_HELP_PAGE_TITLE,
  TEAMS_INTEGRATION_HELP_PRIMARY_ACTION,
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

  return (
    <article
      className={cn(OPERATOR_LAYOUT.majorSectionGap, "w-full max-w-[72rem]")}
      data-testid="help-teams-integration-guide"
    >
      <HelpTopicHashScroll />

      <OperatorPageHeader
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
          <p
            className={cn("m-0 leading-relaxed", OPERATOR_TYPOGRAPHY.body)}
            data-testid="help-teams-integration-overview"
          >
            {TEAMS_INTEGRATION_HELP_OVERVIEW}
          </p>

          <Card className="border-neutral-200 dark:border-neutral-800" data-testid="help-teams-integration-action-panel">
            <CardHeader className={OPERATOR_CARD.header}>
              <CardTitle className={cn("m-0", OPERATOR_TYPOGRAPHY.cardTitle)}>Open Teams notifications</CardTitle>
            </CardHeader>
            <CardContent className={cn(OPERATOR_CARD.content, "flex flex-wrap items-center gap-2")}>
              <Button asChild size="sm" variant="primary">
                <Link href={TEAMS_INTEGRATION_HELP_PRIMARY_ACTION.href}>
                  {TEAMS_INTEGRATION_HELP_PRIMARY_ACTION.label}
                </Link>
              </Button>
            </CardContent>
          </Card>

          <section
            aria-labelledby="what-teams-notifications-do"
            className="space-y-3 border-t border-neutral-200 pt-4 dark:border-neutral-800"
          >
            <HelpSectionHeading id="what-teams-notifications-do">What Teams notifications do</HelpSectionHeading>
            <dl
              className={cn("m-0 grid gap-3 sm:grid-cols-2", OPERATOR_TYPOGRAPHY.body)}
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
            aria-labelledby="how-teams-notifications-work"
            className="space-y-3 border-t border-neutral-200 pt-4 dark:border-neutral-800"
          >
            <HelpSectionHeading id="how-teams-notifications-work">{TEAMS_INTEGRATION_HELP_TOPIC_LABEL}</HelpSectionHeading>
            <ol
              className={cn("m-0 list-decimal space-y-2 pl-5", OPERATOR_TYPOGRAPHY.body)}
              data-testid="help-teams-integration-how-stepper"
            >
              {TEAMS_INTEGRATION_HELP_HOW_TO_READ_STEPS.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ol>
            <p className={cn("m-0", OPERATOR_TYPOGRAPHY.body)}>
              <Link className={OPERATOR_LINK.inline} href={TEAMS_INTEGRATION_HELP_ALERT_RULES_HREF}>
                Open alert rules →
              </Link>
            </p>
          </section>

          <TeamsIntegrationHelpEvidenceOrientationStrip />
        </div>

        <HelpTopicTableOfContents headings={TEAMS_INTEGRATION_HELP_GUIDE_HEADINGS} />
      </div>
    </article>
  );
}
