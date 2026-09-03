import Link from "next/link";

import { HelpServiceNowIntegrationClaimOrientationStrip } from "@/app/(operator)/help/_sections/HelpServiceNowIntegrationClaimOrientationStrip";
import { HelpServiceNowIntegrationHeaderActions } from "@/app/(operator)/help/_sections/HelpServiceNowIntegrationHeaderActions";
import { HelpTopicHashScroll } from "@/app/(operator)/help/HelpTopicHashScroll";
import { HelpTopicGuidePageHeader } from "@/components/help/HelpTopicGuidePageHeader";
import { HelpTopicRegistryProvenanceLine } from "@/components/help/HelpTopicRegistryProvenanceLine";
import { HelpTopicTableOfContents } from "@/components/help/HelpTopicTableOfContents";
import { Button } from "@/components/ui/button";
import { resolveGuideHeadingsForStrip } from "@/lib/claim-discipline-policy";
import {
  OPERATOR_LAYOUT,
  OPERATOR_SHELL_SCROLL_OFFSET_CLASS,
  OPERATOR_TYPOGRAPHY,
} from "@/lib/design-tokens";
import { HELP_PAGE_LAYOUT, resolveHelpPageContentGridClass } from "@/lib/help/help-page-layout";
import type { ProductDocumentationEntry } from "@/lib/product-documentation-registry";
import {
  SERVICENOW_INTEGRATION_HELP_BEFORE_YOU_CONNECT_BODY,
  SERVICENOW_INTEGRATION_HELP_CLAIM_HEADING_ID,
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
  SERVICENOW_INTEGRATION_HELP_CANONICAL_PATH,
  SERVICENOW_INTEGRATION_HELP_CLAIM_DISCIPLINE,
} from "@/lib/servicenow-integration-help-evidence-copy";
import {
  SERVICENOW_INTEGRATION_HELP_FIRST_VIEWPORT_TEST_ID,
  SERVICENOW_INTEGRATION_HELP_HEADER_CLAIM_DISCIPLINE_TEST_ID,
  SERVICENOW_INTEGRATION_HELP_PRIMARY_CONTENT_ID,
  SERVICENOW_INTEGRATION_HELP_SKIP_LINK_LABEL,
  SERVICENOW_INTEGRATION_HELP_SKIP_TARGET_ID,
} from "@/lib/servicenow-integration-help-page-copy";
import { SERVICENOW_INTEGRATION_HELP_TOPIC_LABEL } from "@/lib/servicenow-integration-evidence-copy";
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
  const guideHeadings = resolveGuideHeadingsForStrip(
    "help-servicenow-integration",
    SERVICENOW_INTEGRATION_HELP_GUIDE_HEADINGS,
    SERVICENOW_INTEGRATION_HELP_CLAIM_HEADING_ID,
  );
  const contentGridClass = resolveHelpPageContentGridClass(guideHeadings.length);
  const readingBodyClass = cn("m-0 max-w-3xl leading-relaxed", HELP_PAGE_LAYOUT.readingBody);

  return (
    <article
      className={cn(operatorPageContainerClass("workflow"), OPERATOR_LAYOUT.majorSectionGap)}
      data-testid="help-servicenow-integration-guide"
    >
      <a href={`#${SERVICENOW_INTEGRATION_HELP_SKIP_TARGET_ID}`} className={HELP_PAGE_LAYOUT.technicalReferenceSkipLink}>
        {SERVICENOW_INTEGRATION_HELP_SKIP_LINK_LABEL}
      </a>
      <HelpTopicHashScroll />

      <div
        id={SERVICENOW_INTEGRATION_HELP_PRIMARY_CONTENT_ID}
        data-testid={SERVICENOW_INTEGRATION_HELP_PRIMARY_CONTENT_ID}
        className={cn("scroll-mt-24 space-y-6", OPERATOR_LAYOUT.sectionStack)}
      >
        <HelpTopicGuidePageHeader
          title={SERVICENOW_INTEGRATION_HELP_PAGE_TITLE}
          titleTestId="help-servicenow-integration-page-title"
          subtitle={SERVICENOW_INTEGRATION_HELP_PAGE_SUBTITLE}
          navHref={SERVICENOW_INTEGRATION_HELP_CANONICAL_PATH}
          headingLevel="h1"
          claimDiscipline={SERVICENOW_INTEGRATION_HELP_CLAIM_DISCIPLINE}
          claimDisciplineTestId={SERVICENOW_INTEGRATION_HELP_HEADER_CLAIM_DISCIPLINE_TEST_ID}
          metadata={<HelpTopicRegistryProvenanceLine entry={entry} />}
          actions={<HelpServiceNowIntegrationHeaderActions entry={entry} />}
        />

        <div
          id={SERVICENOW_INTEGRATION_HELP_SKIP_TARGET_ID}
          data-testid={SERVICENOW_INTEGRATION_HELP_FIRST_VIEWPORT_TEST_ID}
          className={cn(
            "scroll-mt-24 space-y-6 border-b border-neutral-200 pb-6 dark:border-neutral-800",
            OPERATOR_LAYOUT.sectionStack,
          )}
        >
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
        </div>

        <div className={contentGridClass}>
          <div className={cn(HELP_PAGE_LAYOUT.contentColumn, "space-y-4")}>
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

          <HelpTopicTableOfContents headings={guideHeadings} />
        </div>

        <div data-testid="help-servicenow-integration-orientation-bottom">
          <HelpServiceNowIntegrationClaimOrientationStrip />
        </div>
      </div>
    </article>
  );
}
