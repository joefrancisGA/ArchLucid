import Link from "next/link";

import { HelpTopicHashScroll } from "@/app/(operator)/help/HelpTopicHashScroll";
import { ServiceNowIntegrationHelpClaimDisciplineStrip } from "@/components/help/ServiceNowIntegrationHelpClaimDisciplineStrip";
import { ServiceNowIntegrationHelpEvidenceOrientationStrip } from "@/components/help/ServiceNowIntegrationHelpEvidenceOrientationStrip";
import { HelpTopicBreadcrumb } from "@/components/help/HelpTopicBreadcrumb";
import { HelpTopicGuidePageHeader } from "@/components/help/HelpTopicGuidePageHeader";
import { HelpTopicRegistryProvenanceLine } from "@/components/help/HelpTopicRegistryProvenanceLine";
import { HelpTopicTableOfContents } from "@/components/help/HelpTopicTableOfContents";
import { Button } from "@/components/ui/button";
import { PageContextualHelpButton } from "@/components/usability/PageContextualHelpButton";
import {
  OPERATOR_LAYOUT,
  OPERATOR_SHELL_SCROLL_OFFSET_CLASS,
  OPERATOR_TYPOGRAPHY,
} from "@/lib/design-tokens";
import { HELP_PAGE_LAYOUT, resolveHelpPageContentGridClass } from "@/lib/help/help-page-layout";
import type { ProductDocumentationEntry } from "@/lib/product-documentation-registry";
import {
  SERVICENOW_INTEGRATION_HELP_BEFORE_YOU_CONNECT_BODY,
  SERVICENOW_INTEGRATION_HELP_BREADCRUMB_TOPIC_TITLE,
  SERVICENOW_INTEGRATION_HELP_CONNECTION_PRECONDITION,
  SERVICENOW_INTEGRATION_HELP_FEATURE_ITEMS,
  SERVICENOW_INTEGRATION_HELP_GUIDE_HEADINGS,
  SERVICENOW_INTEGRATION_HELP_HOW_TO_READ_STEPS,
  SERVICENOW_INTEGRATION_HELP_OVERVIEW,
  SERVICENOW_INTEGRATION_HELP_PAGE_SUBTITLE,
  SERVICENOW_INTEGRATION_HELP_PAGE_TITLE,
  SERVICENOW_INTEGRATION_HELP_PRIMARY_ACTION,
  SERVICENOW_INTEGRATION_HELP_START_HERE_CARD_TITLE,
} from "@/lib/servicenow-integration-help-guide-content";
import {
  SERVICENOW_INTEGRATION_CANONICAL_PATH,
  SERVICENOW_INTEGRATION_HELP_TOPIC_LABEL,
} from "@/lib/servicenow-integration-evidence-copy";
import { cn } from "@/lib/utils";
import { operatorPageContainerClass } from "@/components/operator/OperatorPageContainer";

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
  const readingBodyClass = cn("m-0 leading-relaxed", HELP_PAGE_LAYOUT.readingBody);

  return (
    <article
      className={cn(operatorPageContainerClass("workflow"), OPERATOR_LAYOUT.majorSectionGap)}
      data-testid="help-servicenow-integration-guide"
    >
      <HelpTopicHashScroll />

      <HelpTopicGuidePageHeader
        title={SERVICENOW_INTEGRATION_HELP_PAGE_TITLE}
        titleTestId="help-servicenow-integration-page-title"
        subtitle={SERVICENOW_INTEGRATION_HELP_PAGE_SUBTITLE}
        navHref={SERVICENOW_INTEGRATION_CANONICAL_PATH}
        headingLevel="h1"
        breadcrumb={<HelpTopicBreadcrumb topicTitle={SERVICENOW_INTEGRATION_HELP_BREADCRUMB_TOPIC_TITLE} />}
        metadata={<HelpTopicRegistryProvenanceLine entry={entry} />}
        actions={<PageContextualHelpButton />}
      />

      <ServiceNowIntegrationHelpClaimDisciplineStrip />

      <div className={contentGridClass}>
        <div className={cn(HELP_PAGE_LAYOUT.contentColumn, "space-y-4")}>
          <ServiceNowIntegrationHelpEvidenceOrientationStrip readingBodyClassName={HELP_PAGE_LAYOUT.readingBody} />

          <p className={readingBodyClass} data-testid="help-servicenow-integration-overview">
            {SERVICENOW_INTEGRATION_HELP_OVERVIEW}
          </p>

          <section
            className="space-y-3 rounded-md border border-neutral-200 bg-neutral-50/80 p-4 dark:border-neutral-700 dark:bg-neutral-900/40"
            data-testid="help-servicenow-integration-action-panel"
            aria-labelledby="help-servicenow-integration-action-panel-heading"
          >
            <h2
              id="help-servicenow-integration-action-panel-heading"
              className={cn("m-0 text-al-text-primary", OPERATOR_TYPOGRAPHY.sectionTitle)}
            >
              {SERVICENOW_INTEGRATION_HELP_START_HERE_CARD_TITLE}
            </h2>
            <Button asChild size="sm" variant="primary">
              <Link href={SERVICENOW_INTEGRATION_HELP_PRIMARY_ACTION.href}>
                {SERVICENOW_INTEGRATION_HELP_PRIMARY_ACTION.label}
              </Link>
            </Button>
            <p
              className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}
              data-testid="help-servicenow-integration-connection-precondition"
            >
              <span className="font-medium text-al-text-primary">ServiceNow connection.</span>{" "}
              {SERVICENOW_INTEGRATION_HELP_CONNECTION_PRECONDITION}
            </p>
          </section>

          <section
            aria-labelledby="what-servicenow-integration-does"
            className="space-y-3 border-t border-neutral-200 pt-4 dark:border-neutral-800"
          >
            <HelpSectionHeading id="what-servicenow-integration-does">What ServiceNow integration does</HelpSectionHeading>
            <dl
              className={cn("m-0 grid gap-3 sm:grid-cols-2", HELP_PAGE_LAYOUT.readingBody)}
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
            aria-labelledby="before-you-connect"
            className="space-y-3 border-t border-neutral-200 pt-4 dark:border-neutral-800"
          >
            <HelpSectionHeading id="before-you-connect">Before you connect</HelpSectionHeading>
            <p className={readingBodyClass} data-testid="help-servicenow-integration-before-you-connect">
              {SERVICENOW_INTEGRATION_HELP_BEFORE_YOU_CONNECT_BODY}
            </p>
          </section>

          <section
            aria-labelledby="how-servicenow-integration-works"
            className="space-y-3 border-t border-neutral-200 pt-4 dark:border-neutral-800"
          >
            <HelpSectionHeading id="how-servicenow-integration-works">
              {SERVICENOW_INTEGRATION_HELP_TOPIC_LABEL}
            </HelpSectionHeading>
            <ol
              className={cn("m-0 list-decimal space-y-2 pl-5", HELP_PAGE_LAYOUT.readingBody)}
              data-testid="help-servicenow-integration-how-stepper"
            >
              {SERVICENOW_INTEGRATION_HELP_HOW_TO_READ_STEPS.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ol>
          </section>

        </div>

        <HelpTopicTableOfContents headings={SERVICENOW_INTEGRATION_HELP_GUIDE_HEADINGS} />
      </div>
    </article>
  );
}
