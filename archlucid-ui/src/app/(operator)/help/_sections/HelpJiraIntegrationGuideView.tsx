import Link from "next/link";

import { HelpTopicHashScroll } from "@/app/(operator)/help/HelpTopicHashScroll";
import { JiraIntegrationHelpEvidenceOrientationStrip } from "@/components/help/JiraIntegrationHelpEvidenceOrientationStrip";
import { HelpTopicRegistryProvenanceLine } from "@/components/help/HelpTopicRegistryProvenanceLine";
import { HelpTopicTableOfContents } from "@/components/help/HelpTopicTableOfContents";
import { OperatorPageBreadcrumb } from "@/components/operator/OperatorPageBreadcrumb";
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
import {
  JIRA_INTEGRATION_HELP_FEATURE_ITEMS,
  JIRA_INTEGRATION_HELP_GUIDE_HEADINGS,
  JIRA_INTEGRATION_HELP_HOW_TO_READ_STEPS,
  JIRA_INTEGRATION_HELP_OVERVIEW,
  JIRA_INTEGRATION_HELP_PAGE_SUBTITLE,
  JIRA_INTEGRATION_HELP_PAGE_TITLE,
  JIRA_INTEGRATION_HELP_PRIMARY_ACTION,
  JIRA_INTEGRATION_HELP_READINESS_HREF,
  JIRA_INTEGRATION_HELP_SERVICENOW_HREF,
} from "@/lib/jira-integration-help-guide-content";
import { JIRA_INTEGRATION_HELP_CANONICAL_PATH } from "@/lib/jira-integration-help-evidence-copy";
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

/** Operator Jira integration orientation for `/help/jira-integration`. */
export function HelpJiraIntegrationGuideView(props: HelpJiraIntegrationGuideViewProps): React.ReactElement {
  const { entry } = props;
  const contentGridClass = resolveHelpPageContentGridClass(JIRA_INTEGRATION_HELP_GUIDE_HEADINGS.length);

  return (
    <article
      className={cn(OPERATOR_LAYOUT.majorSectionGap, "w-full max-w-[72rem]")}
      data-testid="help-jira-integration-guide"
    >
      <HelpTopicHashScroll />

      <OperatorPageHeader
        title={JIRA_INTEGRATION_HELP_PAGE_TITLE}
        titleTestId="help-jira-integration-page-title"
        subtitle={JIRA_INTEGRATION_HELP_PAGE_SUBTITLE}
        navHref={JIRA_INTEGRATION_HELP_CANONICAL_PATH}
        headingLevel="h1"
        breadcrumb={
          <OperatorPageBreadcrumb
            data-testid="help-jira-integration-breadcrumb"
            items={[{ label: "Help", href: "/help" }, { label: JIRA_INTEGRATION_HELP_PAGE_TITLE }]}
          />
        }
        metadata={<HelpTopicRegistryProvenanceLine entry={entry} />}
        actions={<PageContextualHelpButton />}
      />

      <div className={contentGridClass}>
        <div className={cn(HELP_PAGE_LAYOUT.contentColumn, "space-y-4")}>
          <p
            className={cn("m-0 leading-relaxed", OPERATOR_TYPOGRAPHY.body)}
            data-testid="help-jira-integration-overview"
          >
            {JIRA_INTEGRATION_HELP_OVERVIEW}
          </p>

          <Card className="border-neutral-200 dark:border-neutral-800" data-testid="help-jira-integration-action-panel">
            <CardHeader className={OPERATOR_CARD.header}>
              <CardTitle className={cn("m-0", OPERATOR_TYPOGRAPHY.cardTitle)}>Open Jira integration</CardTitle>
            </CardHeader>
            <CardContent className={cn(OPERATOR_CARD.content, "flex flex-wrap items-center gap-2")}>
              <Button asChild size="sm" variant="primary">
                <Link href={JIRA_INTEGRATION_HELP_PRIMARY_ACTION.href}>
                  {JIRA_INTEGRATION_HELP_PRIMARY_ACTION.label}
                </Link>
              </Button>
            </CardContent>
          </Card>

          <section
            aria-labelledby="what-jira-integration-does"
            className="space-y-3 border-t border-neutral-200 pt-4 dark:border-neutral-800"
          >
            <HelpSectionHeading id="what-jira-integration-does">What Jira integration does</HelpSectionHeading>
            <dl
              className={cn("m-0 grid gap-3 sm:grid-cols-2", OPERATOR_TYPOGRAPHY.body)}
              data-testid="help-jira-integration-feature-items"
            >
              {JIRA_INTEGRATION_HELP_FEATURE_ITEMS.map((item) => (
                <div key={item.label}>
                  <dt className="font-medium text-al-text-primary">{item.label}</dt>
                  <dd className="m-0 mt-1 text-al-text-secondary">{item.detail}</dd>
                </div>
              ))}
            </dl>
          </section>

          <section
            aria-labelledby="how-jira-integration-works"
            className="space-y-3 border-t border-neutral-200 pt-4 dark:border-neutral-800"
          >
            <HelpSectionHeading id="how-jira-integration-works">{JIRA_INTEGRATION_HELP_TOPIC_LABEL}</HelpSectionHeading>
            <ol
              className={cn("m-0 list-decimal space-y-2 pl-5", OPERATOR_TYPOGRAPHY.body)}
              data-testid="help-jira-integration-how-stepper"
            >
              {JIRA_INTEGRATION_HELP_HOW_TO_READ_STEPS.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ol>
            <p className={cn("m-0", OPERATOR_TYPOGRAPHY.body)}>
              <Link className={OPERATOR_LINK.inline} href={JIRA_INTEGRATION_HELP_READINESS_HREF}>
                Read integration readiness help →
              </Link>
            </p>
            <p className={cn("m-0", OPERATOR_TYPOGRAPHY.body)}>
              <Link className={OPERATOR_LINK.inline} href={JIRA_INTEGRATION_HELP_SERVICENOW_HREF}>
                Open ServiceNow integration →
              </Link>
            </p>
          </section>

          <JiraIntegrationHelpEvidenceOrientationStrip />
        </div>

        <HelpTopicTableOfContents headings={JIRA_INTEGRATION_HELP_GUIDE_HEADINGS} />
      </div>
    </article>
  );
}
