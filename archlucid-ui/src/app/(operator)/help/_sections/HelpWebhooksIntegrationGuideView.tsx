import Link from "next/link";

import { HelpTopicHashScroll } from "@/app/(operator)/help/HelpTopicHashScroll";
import { HelpWebhooksIntegrationHeaderActions } from "@/app/(operator)/help/_sections/HelpWebhooksIntegrationHeaderActions";
import { WebhooksIntegrationHelpEvidenceOrientationStrip } from "@/components/help/WebhooksIntegrationHelpEvidenceOrientationStrip";
import { HelpTopicGuidePageHeader } from "@/components/help/HelpTopicGuidePageHeader";
import { HelpTopicRegistryProvenanceLine } from "@/components/help/HelpTopicRegistryProvenanceLine";
import { HelpTopicTableOfContents } from "@/components/help/HelpTopicTableOfContents";
import {
  OPERATOR_LAYOUT,
  OPERATOR_SHELL_SCROLL_OFFSET_CLASS,
  OPERATOR_TYPOGRAPHY,
} from "@/lib/design-tokens";
import { HELP_PAGE_LAYOUT, resolveHelpPageContentGridClass } from "@/lib/help/help-page-layout";
import type { ProductDocumentationEntry } from "@/lib/product-documentation-registry";
import { WEBHOOKS_INTEGRATION_HELP_CANONICAL_PATH } from "@/lib/webhooks-integration-help-evidence-copy";
import {
  WEBHOOKS_INTEGRATION_HELP_DELIVERY_SECTION_ID,
  WEBHOOKS_INTEGRATION_HELP_FEATURE_ITEMS,
  WEBHOOKS_INTEGRATION_HELP_GUIDE_HEADINGS,
  WEBHOOKS_INTEGRATION_HELP_HOW_TO_READ_STEPS,
  WEBHOOKS_INTEGRATION_HELP_MUTATION_PREREQUISITE_NOTICE,
  WEBHOOKS_INTEGRATION_HELP_OVERVIEW,
  WEBHOOKS_INTEGRATION_HELP_PAGE_SUBTITLE,
  WEBHOOKS_INTEGRATION_HELP_PAGE_TITLE,
} from "@/lib/webhooks-integration-help-guide-content";
import { WEBHOOKS_INTEGRATION_HELP_TOPIC_LABEL } from "@/lib/webhooks-integration-evidence-copy";
import {
  WEBHOOKS_CLOUD_EVENTS_ENVELOPE_NOTE,
  WEBHOOKS_DELIVERY_CONTRACT_HEADING,
  WEBHOOKS_SIGNATURE_ALGORITHM,
  WEBHOOKS_SIGNATURE_HEADER_NAME,
  WEBHOOKS_SIGNATURE_KEY_SCOPE_NOTE,
  WEBHOOKS_SIGNATURE_VALUE_PREFIX,
  WEBHOOKS_SIGNATURE_VERIFICATION,
} from "@/lib/webhooks-page-copy";
import { cn } from "@/lib/utils";
import { operatorPageContainerClass } from "@/components/operator/OperatorPageContainer";

type HelpWebhooksIntegrationGuideViewProps = {
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

/** Operator webhooks integration orientation for `/help/webhooks-integration`. */
export function HelpWebhooksIntegrationGuideView(props: HelpWebhooksIntegrationGuideViewProps): React.ReactElement {
  const { entry } = props;
  const contentGridClass = resolveHelpPageContentGridClass(WEBHOOKS_INTEGRATION_HELP_GUIDE_HEADINGS.length);
  const readingBodyClass = cn("m-0 leading-relaxed", HELP_PAGE_LAYOUT.readingBody);

  return (
    <article
      className={cn(operatorPageContainerClass("workflow"), OPERATOR_LAYOUT.majorSectionGap)}
      data-testid="help-webhooks-integration-guide"
    >
      <HelpTopicHashScroll />

      <HelpTopicGuidePageHeader
        title={WEBHOOKS_INTEGRATION_HELP_PAGE_TITLE}
        titleTestId="help-webhooks-integration-page-title"
        subtitle={WEBHOOKS_INTEGRATION_HELP_PAGE_SUBTITLE}
        navHref={WEBHOOKS_INTEGRATION_HELP_CANONICAL_PATH}
        headingLevel="h1"
        metadata={<HelpTopicRegistryProvenanceLine entry={entry} />}
        actions={<HelpWebhooksIntegrationHeaderActions entry={entry} />}
      />

      <div className={contentGridClass}>
        <div className={cn(HELP_PAGE_LAYOUT.contentColumn, "space-y-4")}>
          <p
            className={cn(readingBodyClass, OPERATOR_TYPOGRAPHY.body)}
            data-testid="help-webhooks-integration-overview"
          >
            {WEBHOOKS_INTEGRATION_HELP_OVERVIEW}
          </p>
          <p
            className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}
            data-testid="help-webhooks-integration-mutation-prerequisite"
          >
            {WEBHOOKS_INTEGRATION_HELP_MUTATION_PREREQUISITE_NOTICE}
          </p>

          <section
            aria-labelledby="what-webhooks-do"
            className="space-y-3 border-t border-neutral-200 pt-4 dark:border-neutral-800"
          >
            <HelpSectionHeading id="what-webhooks-do">What webhooks do</HelpSectionHeading>
            <dl
              className={cn("m-0 grid gap-3 sm:grid-cols-2", OPERATOR_TYPOGRAPHY.body)}
              data-testid="help-webhooks-integration-feature-items"
            >
              {WEBHOOKS_INTEGRATION_HELP_FEATURE_ITEMS.map((item) => (
                <div key={item.label}>
                  <dt className="font-medium text-al-text-primary">{item.label}</dt>
                  <dd className="m-0 mt-1 text-al-text-secondary">{item.detail}</dd>
                </div>
              ))}
            </dl>
          </section>

          <section
            aria-labelledby={WEBHOOKS_INTEGRATION_HELP_DELIVERY_SECTION_ID}
            className="space-y-3 border-t border-neutral-200 pt-4 dark:border-neutral-800"
            data-testid="help-webhooks-integration-delivery-section"
          >
            <HelpSectionHeading id={WEBHOOKS_INTEGRATION_HELP_DELIVERY_SECTION_ID}>
              {WEBHOOKS_DELIVERY_CONTRACT_HEADING}
            </HelpSectionHeading>
            <div className={cn("space-y-3 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
              <p className="m-0">{WEBHOOKS_SIGNATURE_VERIFICATION}</p>
              <p className="m-0 text-al-text-primary">{WEBHOOKS_SIGNATURE_KEY_SCOPE_NOTE}</p>
              <p className="m-0">{WEBHOOKS_CLOUD_EVENTS_ENVELOPE_NOTE}</p>
              <dl
                className={cn("m-0 grid gap-3 sm:grid-cols-2", OPERATOR_TYPOGRAPHY.body)}
                data-testid="help-webhooks-integration-signature-contract"
              >
                <div>
                  <dt className="font-medium text-al-text-primary">Signature header</dt>
                  <dd className="m-0 mt-1 font-mono text-al-text-secondary">{WEBHOOKS_SIGNATURE_HEADER_NAME}</dd>
                </div>
                <div>
                  <dt className="font-medium text-al-text-primary">Value format</dt>
                  <dd className="m-0 mt-1 font-mono text-al-text-secondary">
                    {WEBHOOKS_SIGNATURE_VALUE_PREFIX}
                    {"{lowercase-hex-digest}"}
                  </dd>
                </div>
                <div className="sm:col-span-2">
                  <dt className="font-medium text-al-text-primary">Algorithm</dt>
                  <dd className="m-0 mt-1 text-al-text-secondary">{WEBHOOKS_SIGNATURE_ALGORITHM}</dd>
                </div>
              </dl>
            </div>
          </section>

          <section
            aria-labelledby="how-webhooks-work"
            className="space-y-3 border-t border-neutral-200 pt-4 dark:border-neutral-800"
          >
            <HelpSectionHeading id="how-webhooks-work">{WEBHOOKS_INTEGRATION_HELP_TOPIC_LABEL}</HelpSectionHeading>
            <ol
              className={cn("m-0 list-decimal space-y-2 pl-5", OPERATOR_TYPOGRAPHY.body)}
              data-testid="help-webhooks-integration-how-stepper"
            >
              {WEBHOOKS_INTEGRATION_HELP_HOW_TO_READ_STEPS.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ol>
          </section>

          <WebhooksIntegrationHelpEvidenceOrientationStrip />
        </div>

        <HelpTopicTableOfContents headings={WEBHOOKS_INTEGRATION_HELP_GUIDE_HEADINGS} />
      </div>
    </article>
  );
}
