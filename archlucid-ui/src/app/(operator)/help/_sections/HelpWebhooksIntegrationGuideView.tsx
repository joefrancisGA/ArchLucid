import Link from "next/link";

import { HelpTopicHashScroll } from "@/app/(operator)/help/HelpTopicHashScroll";
import { HelpWebhooksIntegrationHeaderActions } from "@/app/(operator)/help/_sections/HelpWebhooksIntegrationHeaderActions";
import { HelpWebhooksIntegrationSourcesOrientationStrip } from "@/app/(operator)/help/_sections/HelpWebhooksIntegrationSourcesOrientationStrip";
import { WebhooksIntegrationHelpClaimDisciplineStrip } from "@/components/help/WebhooksIntegrationHelpClaimDisciplineStrip";
import { WebhooksIntegrationHelpEvidenceOrientationStrip } from "@/components/help/WebhooksIntegrationHelpEvidenceOrientationStrip";
import { HelpTopicGuidePageHeader } from "@/components/help/HelpTopicGuidePageHeader";
import { HelpTopicRegistryProvenanceLine } from "@/components/help/HelpTopicRegistryProvenanceLine";
import { HelpTopicTableOfContents } from "@/components/help/HelpTopicTableOfContents";
import { Button } from "@/components/ui/button";
import { operatorPageContainerClass } from "@/components/operator/OperatorPageContainer";
import { resolveGuideHeadingsForStrip } from "@/lib/claim-discipline-policy";
import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";
import {
  OPERATOR_LAYOUT,
  OPERATOR_SHELL_SCROLL_OFFSET_CLASS,
  OPERATOR_TYPOGRAPHY,
} from "@/lib/design-tokens";
import { HELP_PAGE_LAYOUT, resolveHelpPageContentGridClass } from "@/lib/help/help-page-layout";
import type { ProductDocumentationEntry } from "@/lib/product-documentation-registry";
import { WEBHOOKS_INTEGRATION_HELP_CANONICAL_PATH, WEBHOOKS_INTEGRATION_HELP_CLAIM_DISCIPLINE } from "@/lib/webhooks-integration-help-evidence-copy";
import {
  WEBHOOKS_INTEGRATION_HELP_DELIVERY_SECTION_ID,
  WEBHOOKS_INTEGRATION_HELP_FEATURE_ITEMS,
  WEBHOOKS_INTEGRATION_HELP_GUIDE_HEADINGS,
  WEBHOOKS_INTEGRATION_HELP_HOW_TO_READ_STEPS,
  WEBHOOKS_INTEGRATION_HELP_MUTATION_PREREQUISITE_NOTICE,
  WEBHOOKS_INTEGRATION_HELP_OVERVIEW,
  WEBHOOKS_INTEGRATION_HELP_PAGE_SUBTITLE,
  WEBHOOKS_INTEGRATION_HELP_PAGE_TITLE,
  WEBHOOKS_INTEGRATION_HELP_PRIMARY_ACTION,
  WEBHOOKS_INTEGRATION_HELP_START_HERE_CARD_TITLE,
  WEBHOOKS_INTEGRATION_HELP_CLAIM_HEADING_ID,
} from "@/lib/webhooks-integration-help-guide-content";
import {
  WEBHOOKS_INTEGRATION_HELP_FIRST_VIEWPORT_TEST_ID,
  WEBHOOKS_INTEGRATION_HELP_HEADER_CLAIM_DISCIPLINE_TEST_ID,
  WEBHOOKS_INTEGRATION_HELP_PRIMARY_CONTENT_ID,
  WEBHOOKS_INTEGRATION_HELP_SKIP_LINK_LABEL,
  WEBHOOKS_INTEGRATION_HELP_SKIP_TARGET_ID,
} from "@/lib/webhooks-integration-help-page-copy";
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

function WebhooksIntegrationStartHerePanel(props: { readonly showPrimaryAction: boolean }): React.ReactElement {
  return (
    <section
      className="space-y-3 rounded-md border border-neutral-200 bg-neutral-50/80 p-4 dark:border-neutral-700 dark:bg-neutral-900/40"
      data-testid="help-webhooks-integration-action-panel"
      aria-labelledby="help-webhooks-integration-action-panel-heading"
    >
      <h2
        id="help-webhooks-integration-action-panel-heading"
        className={cn("m-0 text-al-text-primary", OPERATOR_TYPOGRAPHY.sectionTitle)}
      >
        {WEBHOOKS_INTEGRATION_HELP_START_HERE_CARD_TITLE}
      </h2>
      <p
        className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}
        data-testid="help-webhooks-integration-mutation-prerequisite"
      >
        {WEBHOOKS_INTEGRATION_HELP_MUTATION_PREREQUISITE_NOTICE}
      </p>
      {props.showPrimaryAction ? (
        <Button asChild data-testid="help-webhooks-integration-primary-cta" size="sm" variant="primary">
          <Link href={WEBHOOKS_INTEGRATION_HELP_PRIMARY_ACTION.href}>
            {WEBHOOKS_INTEGRATION_HELP_PRIMARY_ACTION.label}
          </Link>
        </Button>
      ) : null}
    </section>
  );
}

/** Operator webhooks integration orientation for `/help/webhooks-integration`. */
export function HelpWebhooksIntegrationGuideView(props: HelpWebhooksIntegrationGuideViewProps): React.ReactElement {
  const { entry } = props;
  const buyerPolishedShell = isBuyerPolishedOperatorShellEnv();
  const guideHeadings = resolveGuideHeadingsForStrip(
    "help-webhooks-integration",
    WEBHOOKS_INTEGRATION_HELP_GUIDE_HEADINGS,
    WEBHOOKS_INTEGRATION_HELP_CLAIM_HEADING_ID,
  );
  const tocHeadings = buyerPolishedShell
    ? guideHeadings.filter((heading) => heading.id !== "where-to-go-next")
    : guideHeadings;
  const contentGridClass = resolveHelpPageContentGridClass(tocHeadings.length);
  const readingBodyClass = cn("m-0 leading-relaxed", HELP_PAGE_LAYOUT.readingBody);

  return (
    <article
      className={cn(operatorPageContainerClass("workflow"), OPERATOR_LAYOUT.majorSectionGap)}
      data-testid="help-webhooks-integration-guide"
    >
      {buyerPolishedShell ? (
        <a href={`#${WEBHOOKS_INTEGRATION_HELP_SKIP_TARGET_ID}`} className={HELP_PAGE_LAYOUT.technicalReferenceSkipLink}>
          {WEBHOOKS_INTEGRATION_HELP_SKIP_LINK_LABEL}
        </a>
      ) : null}
      <HelpTopicHashScroll />

      <div
        id={WEBHOOKS_INTEGRATION_HELP_PRIMARY_CONTENT_ID}
        data-testid={WEBHOOKS_INTEGRATION_HELP_PRIMARY_CONTENT_ID}
        className={cn("scroll-mt-24 space-y-6", OPERATOR_LAYOUT.sectionStack)}
      >
        {buyerPolishedShell ? (
          <HelpTopicGuidePageHeader
            title={WEBHOOKS_INTEGRATION_HELP_PAGE_TITLE}
            titleTestId="help-webhooks-integration-page-title"
            subtitle={WEBHOOKS_INTEGRATION_HELP_PAGE_SUBTITLE}
            navHref={WEBHOOKS_INTEGRATION_HELP_CANONICAL_PATH}
            headingLevel="h1"
            claimDiscipline={WEBHOOKS_INTEGRATION_HELP_CLAIM_DISCIPLINE}
            claimDisciplineTestId={WEBHOOKS_INTEGRATION_HELP_HEADER_CLAIM_DISCIPLINE_TEST_ID}
            actions={<HelpWebhooksIntegrationHeaderActions entry={entry} />}
          />
        ) : (
          <HelpTopicGuidePageHeader
            title={WEBHOOKS_INTEGRATION_HELP_PAGE_TITLE}
            titleTestId="help-webhooks-integration-page-title"
            subtitle={WEBHOOKS_INTEGRATION_HELP_PAGE_SUBTITLE}
            navHref={WEBHOOKS_INTEGRATION_HELP_CANONICAL_PATH}
            headingLevel="h1"
            metadata={<HelpTopicRegistryProvenanceLine entry={entry} />}
            actions={<HelpWebhooksIntegrationHeaderActions entry={entry} />}
          />
        )}

        {!buyerPolishedShell ? <WebhooksIntegrationHelpClaimDisciplineStrip /> : null}

        {buyerPolishedShell ? (
          <div
            id={WEBHOOKS_INTEGRATION_HELP_SKIP_TARGET_ID}
            data-testid={WEBHOOKS_INTEGRATION_HELP_FIRST_VIEWPORT_TEST_ID}
            className={cn(
              "scroll-mt-24 space-y-4 border-b border-neutral-200 pb-6 dark:border-neutral-800",
              OPERATOR_LAYOUT.sectionStack,
            )}
          >
            <WebhooksIntegrationStartHerePanel showPrimaryAction />
          </div>
        ) : null}

        <div className={contentGridClass}>
          <div className={cn(HELP_PAGE_LAYOUT.contentColumn, "space-y-4")}>
            {!buyerPolishedShell ? <WebhooksIntegrationHelpEvidenceOrientationStrip /> : null}

            <p
              className={cn(readingBodyClass, OPERATOR_TYPOGRAPHY.body)}
              data-testid="help-webhooks-integration-overview"
            >
              {WEBHOOKS_INTEGRATION_HELP_OVERVIEW}
            </p>

            {!buyerPolishedShell ? (
              <p
                className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}
                data-testid="help-webhooks-integration-mutation-prerequisite"
              >
                {WEBHOOKS_INTEGRATION_HELP_MUTATION_PREREQUISITE_NOTICE}
              </p>
            ) : null}

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
          </div>

          <HelpTopicTableOfContents headings={tocHeadings} />
        </div>

        {buyerPolishedShell ? (
          <div data-testid="help-webhooks-integration-orientation-bottom">
            <HelpWebhooksIntegrationSourcesOrientationStrip />
          </div>
        ) : null}
      </div>
    </article>
  );
}
