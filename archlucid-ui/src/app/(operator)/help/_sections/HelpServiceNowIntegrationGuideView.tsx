import Link from "next/link";

import { HelpTopicHashScroll } from "@/app/(operator)/help/HelpTopicHashScroll";
import { ServiceNowIntegrationHelpEvidenceOrientationStrip } from "@/components/help/ServiceNowIntegrationHelpEvidenceOrientationStrip";
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
import type { ProductDocumentationEntry } from "@/lib/product-documentation-registry";
import {
  SERVICENOW_INTEGRATION_HELP_FEATURE_ITEMS,
  SERVICENOW_INTEGRATION_HELP_GUIDE_HEADINGS,
  SERVICENOW_INTEGRATION_HELP_HOW_TO_READ_STEPS,
  SERVICENOW_INTEGRATION_HELP_JIRA_HREF,
  SERVICENOW_INTEGRATION_HELP_OVERVIEW,
  SERVICENOW_INTEGRATION_HELP_PAGE_SUBTITLE,
  SERVICENOW_INTEGRATION_HELP_PAGE_TITLE,
  SERVICENOW_INTEGRATION_HELP_PRIMARY_ACTION,
  SERVICENOW_INTEGRATION_HELP_READINESS_HREF,
} from "@/lib/servicenow-integration-help-guide-content";
import { SERVICENOW_INTEGRATION_HELP_CANONICAL_PATH } from "@/lib/servicenow-integration-help-evidence-copy";
import { SERVICENOW_INTEGRATION_HELP_TOPIC_LABEL } from "@/lib/servicenow-integration-evidence-copy";
import { cn } from "@/lib/utils";

type HelpServiceNowIntegrationGuideViewProps = {
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

/** Operator ServiceNow integration orientation for `/help/servicenow-integration`. */
export function HelpServiceNowIntegrationGuideView(
  props: HelpServiceNowIntegrationGuideViewProps,
): React.ReactElement {
  const { entry } = props;
  const contentGridClass = resolveHelpPageContentGridClass(SERVICENOW_INTEGRATION_HELP_GUIDE_HEADINGS.length);

  return (
    <article
      className={cn(OPERATOR_LAYOUT.majorSectionGap, "w-full max-w-[72rem]")}
      data-testid="help-servicenow-integration-guide"
    >
      <HelpTopicHashScroll />

      <OperatorPageHeader
        title={SERVICENOW_INTEGRATION_HELP_PAGE_TITLE}
        titleTestId="help-servicenow-integration-page-title"
        subtitle={SERVICENOW_INTEGRATION_HELP_PAGE_SUBTITLE}
        navHref={SERVICENOW_INTEGRATION_HELP_CANONICAL_PATH}
        headingLevel="h1"
        breadcrumb={
          <OperatorPageBreadcrumb
            data-testid="help-servicenow-integration-breadcrumb"
            items={[{ label: "Help", href: "/help" }, { label: SERVICENOW_INTEGRATION_HELP_PAGE_TITLE }]}
          />
        }
        metadata={<HelpTopicRegistryProvenanceLine entry={entry} />}
        actions={<PageContextualHelpButton />}
      />

      <div className={contentGridClass}>
        <div className={cn(HELP_PAGE_LAYOUT.contentColumn, "space-y-4")}>
          <p
            className={cn("m-0 leading-relaxed", OPERATOR_TYPOGRAPHY.body)}
            data-testid="help-servicenow-integration-overview"
          >
            {SERVICENOW_INTEGRATION_HELP_OVERVIEW}
          </p>

          <Card
            className="border-neutral-200 dark:border-neutral-800"
            data-testid="help-servicenow-integration-action-panel"
          >
            <CardHeader className={OPERATOR_CARD.header}>
              <CardTitle className={cn("m-0", OPERATOR_TYPOGRAPHY.cardTitle)}>Open ServiceNow integration</CardTitle>
            </CardHeader>
            <CardContent className={cn(OPERATOR_CARD.content, "flex flex-wrap items-center gap-2")}>
              <Button asChild size="sm" variant="primary">
                <Link href={SERVICENOW_INTEGRATION_HELP_PRIMARY_ACTION.href}>
                  {SERVICENOW_INTEGRATION_HELP_PRIMARY_ACTION.label}
                </Link>
              </Button>
            </CardContent>
          </Card>

          <section
            aria-labelledby="what-servicenow-integration-does"
            className="space-y-3 border-t border-neutral-200 pt-4 dark:border-neutral-800"
          >
            <HelpSectionHeading id="what-servicenow-integration-does">What ServiceNow integration does</HelpSectionHeading>
            <dl
              className={cn("m-0 grid gap-3 sm:grid-cols-2", OPERATOR_TYPOGRAPHY.body)}
              data-testid="help-servicenow-integration-feature-items"
            >
              {SERVICENOW_INTEGRATION_HELP_FEATURE_ITEMS.map((item) => (
                <div key={item.label}>
                  <dt className="font-medium text-al-text-primary">{item.label}</dt>
                  <dd className="m-0 mt-1 text-al-text-secondary">{item.detail}</dd>
                </div>
              ))}
            </dl>
          </section>

          <section
            aria-labelledby="how-servicenow-integration-works"
            className="space-y-3 border-t border-neutral-200 pt-4 dark:border-neutral-800"
          >
            <HelpSectionHeading id="how-servicenow-integration-works">
              {SERVICENOW_INTEGRATION_HELP_TOPIC_LABEL}
            </HelpSectionHeading>
            <ol
              className={cn("m-0 list-decimal space-y-2 pl-5", OPERATOR_TYPOGRAPHY.body)}
              data-testid="help-servicenow-integration-how-stepper"
            >
              {SERVICENOW_INTEGRATION_HELP_HOW_TO_READ_STEPS.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ol>
            <p className={cn("m-0", OPERATOR_TYPOGRAPHY.body)}>
              <Link className={OPERATOR_LINK.inline} href={SERVICENOW_INTEGRATION_HELP_READINESS_HREF}>
                Read integration readiness help →
              </Link>
            </p>
            <p className={cn("m-0", OPERATOR_TYPOGRAPHY.body)}>
              <Link className={OPERATOR_LINK.inline} href={SERVICENOW_INTEGRATION_HELP_JIRA_HREF}>
                Open Jira integration →
              </Link>
            </p>
          </section>

          <ServiceNowIntegrationHelpEvidenceOrientationStrip />
        </div>

        <HelpTopicTableOfContents headings={SERVICENOW_INTEGRATION_HELP_GUIDE_HEADINGS} />
      </div>
    </article>
  );
}
