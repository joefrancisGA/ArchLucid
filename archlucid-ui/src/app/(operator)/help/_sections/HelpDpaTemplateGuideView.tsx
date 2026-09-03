import Link from "next/link";

import { HelpDpaTemplateClaimOrientationStrip } from "@/app/(operator)/help/_sections/HelpDpaTemplateClaimOrientationStrip";
import { HelpDpaTemplateHeaderActions } from "@/app/(operator)/help/_sections/HelpDpaTemplateHeaderActions";
import { HelpTopicHashScroll } from "@/app/(operator)/help/HelpTopicHashScroll";
import { HelpStaticSection } from "@/components/help/HelpStaticSection";
import { HelpTopicGuidePageHeader } from "@/components/help/HelpTopicGuidePageHeader";
import { MarketingAccessibilityMarkdownFragment } from "@/components/marketing/MarketingAccessibilityMarkdownFragment";
import { Button } from "@/components/ui/button";
import { StatusTag } from "@/components/ui/status-tag";
import {
  DPA_TEMPLATE_HELP_FULL_DISCLOSURE_CAVEAT,
  DPA_TEMPLATE_HELP_KEY_TERMS,
  DPA_TEMPLATE_HELP_KEY_TERMS_HEADING,
  DPA_TEMPLATE_HELP_OPEN_VARIABLES,
  DPA_TEMPLATE_HELP_OPEN_VARIABLES_HEADING,
  DPA_TEMPLATE_HELP_ORIENTATION,
  DPA_TEMPLATE_HELP_OVERVIEW,
  DPA_TEMPLATE_HELP_PAGE_SUBTITLE,
  DPA_TEMPLATE_HELP_PAGE_TITLE,
  DPA_TEMPLATE_HELP_PRIMARY_ACTIONS,
  DPA_TEMPLATE_HELP_CLAIM_DISCIPLINE,
  formatDpaTemplateHelpProvenanceLine,
} from "@/lib/dpa-template-help-guide-content";
import { DPA_TEMPLATE_HELP_CANONICAL_PATH } from "@/lib/dpa-template-help-evidence-copy";
import {
  DPA_TEMPLATE_HELP_FIRST_VIEWPORT_TEST_ID,
  DPA_TEMPLATE_HELP_HEADER_CLAIM_DISCIPLINE_TEST_ID,
  DPA_TEMPLATE_HELP_PRIMARY_CONTENT_ID,
  DPA_TEMPLATE_HELP_SKIP_LINK_LABEL,
  DPA_TEMPLATE_HELP_SKIP_TARGET_ID,
} from "@/lib/dpa-template-help-page-copy";
import {
  DESIGN_TOKENS,
  OPERATOR_LAYOUT,
  OPERATOR_TYPOGRAPHY,
} from "@/lib/design-tokens";
import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";
import { HELP_PAGE_LAYOUT } from "@/lib/help/help-page-layout";
import type { ProductDocumentationEntry } from "@/lib/product-documentation-registry";
import { cn } from "@/lib/utils";
import { operatorPageContainerClass } from "@/components/operator/OperatorPageContainer";

type HelpDpaTemplateGuideViewProps = {
  readonly entry: ProductDocumentationEntry;
  readonly markdown: string;
};

/** Buyer DPA negotiation template orientation for `/help/dpa-template` (TB-1676 / TB-1678 / TB-1680). */
export function HelpDpaTemplateGuideView(props: HelpDpaTemplateGuideViewProps): React.ReactElement {
  const { entry, markdown } = props;
  const buyerPolishedShell = isBuyerPolishedOperatorShellEnv();
  const sourceDocPath = entry.sourcePaths[0] ?? "";
  const readingBodyClass = cn("m-0 max-w-3xl leading-relaxed", HELP_PAGE_LAYOUT.readingBody);

  return (
    <article
      className={cn(operatorPageContainerClass("workflow"), OPERATOR_LAYOUT.majorSectionGap)}
      data-testid="help-dpa-template-guide"
    >
      <a href={`#${DPA_TEMPLATE_HELP_SKIP_TARGET_ID}`} className={HELP_PAGE_LAYOUT.technicalReferenceSkipLink}>
        {DPA_TEMPLATE_HELP_SKIP_LINK_LABEL}
      </a>
      <HelpTopicHashScroll />

      <div
        id={DPA_TEMPLATE_HELP_PRIMARY_CONTENT_ID}
        data-testid={DPA_TEMPLATE_HELP_PRIMARY_CONTENT_ID}
        className={cn("scroll-mt-24 space-y-6", OPERATOR_LAYOUT.sectionStack)}
      >
        <HelpTopicGuidePageHeader
          title={DPA_TEMPLATE_HELP_PAGE_TITLE}
          titleTestId="help-dpa-template-page-title"
          subtitle={DPA_TEMPLATE_HELP_PAGE_SUBTITLE}
          navHref={DPA_TEMPLATE_HELP_CANONICAL_PATH}
          headingLevel="h1"
          claimDiscipline={DPA_TEMPLATE_HELP_CLAIM_DISCIPLINE}
          claimDisciplineTestId={DPA_TEMPLATE_HELP_HEADER_CLAIM_DISCIPLINE_TEST_ID}
          statusBadge={
            <StatusTag
              kind="draft"
              label="Template — not executed"
              data-testid="help-dpa-template-status-tag"
            />
          }
          metadata={
            buyerPolishedShell ? undefined : (
              <p
                className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.label)}
                data-testid="help-dpa-template-provenance"
              >
                {formatDpaTemplateHelpProvenanceLine()}
              </p>
            )
          }
          actions={<HelpDpaTemplateHeaderActions entry={entry} />}
        />

        <div
          id={DPA_TEMPLATE_HELP_SKIP_TARGET_ID}
          data-testid={DPA_TEMPLATE_HELP_FIRST_VIEWPORT_TEST_ID}
          className={cn(
            "scroll-mt-24 space-y-4 border-b border-neutral-200 pb-6 dark:border-neutral-800",
            OPERATOR_LAYOUT.sectionStack,
          )}
        >
          <section
            aria-labelledby="help-dpa-template-orientation-heading"
            data-testid="help-dpa-template-how-to-use"
          >
            <h2
              id="help-dpa-template-orientation-heading"
              className={cn("m-0 text-al-text-primary", OPERATOR_TYPOGRAPHY.sectionTitle)}
            >
              How to use this template
            </h2>
            <ol className={cn("m-0 mt-2 list-decimal space-y-2 pl-5", readingBodyClass)}>
              {DPA_TEMPLATE_HELP_ORIENTATION.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ol>
          </section>

          <p className={readingBodyClass} data-testid="help-dpa-template-overview">
            {DPA_TEMPLATE_HELP_OVERVIEW}
          </p>

          <section
            className="space-y-3 rounded-md border border-neutral-200 bg-neutral-50/80 p-4 dark:border-neutral-700 dark:bg-neutral-900/40"
            data-testid="help-dpa-template-action-panel"
            aria-labelledby="help-dpa-template-action-panel-heading"
          >
            <h2
              id="help-dpa-template-action-panel-heading"
              className={cn("m-0 text-al-text-primary", OPERATOR_TYPOGRAPHY.sectionTitle)}
            >
              Continue procurement diligence
            </h2>
            <div className="flex flex-wrap items-center gap-2">
              <Button asChild size="sm" variant="outline">
                <Link href={DPA_TEMPLATE_HELP_PRIMARY_ACTIONS.openTrustCenter.href}>
                  {DPA_TEMPLATE_HELP_PRIMARY_ACTIONS.openTrustCenter.label}
                </Link>
              </Button>
              <Button asChild size="sm" variant="outline">
                <Link href={DPA_TEMPLATE_HELP_PRIMARY_ACTIONS.openSubprocessors.href}>
                  {DPA_TEMPLATE_HELP_PRIMARY_ACTIONS.openSubprocessors.label}
                </Link>
              </Button>
              <Button asChild size="sm" variant="outline">
                <Link href={DPA_TEMPLATE_HELP_PRIMARY_ACTIONS.openProcurement.href}>
                  {DPA_TEMPLATE_HELP_PRIMARY_ACTIONS.openProcurement.label}
                </Link>
              </Button>
            </div>
          </section>
        </div>

        <div className={cn("min-w-0 space-y-6", HELP_PAGE_LAYOUT.contentColumn, "max-w-[52rem]")}>
          <section
            aria-labelledby="help-dpa-template-key-terms-heading"
            className={cn(DESIGN_TOKENS.surface.card, "p-4")}
            data-testid="help-dpa-template-key-terms"
          >
            <h2
              id="help-dpa-template-key-terms-heading"
              className={cn("m-0 text-al-text-primary", OPERATOR_TYPOGRAPHY.sectionTitle)}
            >
              {DPA_TEMPLATE_HELP_KEY_TERMS_HEADING}
            </h2>
            <dl className={cn("m-0 mt-3 space-y-3", HELP_PAGE_LAYOUT.readingBody)}>
              {DPA_TEMPLATE_HELP_KEY_TERMS.map((term) => (
                <div key={term.label}>
                  <dt className="font-medium text-al-text-primary">{term.label}</dt>
                  <dd className="m-0 mt-1 text-al-text-secondary">{term.value}</dd>
                </div>
              ))}
            </dl>
            <h3
              className={cn("m-0 mt-4 text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}
              id="help-dpa-template-open-variables-heading"
            >
              {DPA_TEMPLATE_HELP_OPEN_VARIABLES_HEADING}
            </h3>
            <ul className={cn("m-0 mt-2 list-disc space-y-2 pl-5", HELP_PAGE_LAYOUT.readingBody)}>
              {DPA_TEMPLATE_HELP_OPEN_VARIABLES.map((variable) => (
                <li key={variable}>{variable}</li>
              ))}
            </ul>
          </section>

          <HelpStaticSection
            title="Show full DPA template (clauses and placeholders)"
            testId="help-dpa-template-full-disclosure"
            className="rounded-md border border-neutral-200 bg-neutral-50/60 p-3 dark:border-neutral-800 dark:bg-neutral-900/30"
            preface={
              <p className={cn("m-0 mt-2 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
                {DPA_TEMPLATE_HELP_FULL_DISCLOSURE_CAVEAT}
              </p>
            }
            bodyClassName={cn(HELP_PAGE_LAYOUT.contentColumn, "mt-4")}
          >
            <MarketingAccessibilityMarkdownFragment
              markdownBody={markdown}
              tableCaption={`${entry.title} reference table`}
              presentation="help"
              sourceDocPath={sourceDocPath}
              helpTopicSlug={entry.slug}
            />
          </HelpStaticSection>
        </div>

        <div data-testid="help-dpa-template-orientation-bottom">
          <HelpDpaTemplateClaimOrientationStrip />
        </div>
      </div>
    </article>
  );
}
