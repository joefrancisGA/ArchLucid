import Link from "next/link";

import { HelpTopicHashScroll } from "@/app/(operator)/help/HelpTopicHashScroll";
import { HelpAiUsageSourcesOrientationStrip } from "@/app/(operator)/help/_sections/HelpAiUsageSourcesOrientationStrip";
import { AiUsageHelpClaimDisciplineStrip } from "@/components/help/AiUsageHelpClaimDisciplineStrip";
import { AiUsageHelpEvidenceOrientationStrip } from "@/components/help/AiUsageHelpEvidenceOrientationStrip";
import { HelpTopicGuidePageHeader } from "@/components/help/HelpTopicGuidePageHeader";
import { HelpTopicRegistryProvenanceLine } from "@/components/help/HelpTopicRegistryProvenanceLine";
import { HelpTopicTableOfContents } from "@/components/help/HelpTopicTableOfContents";
import { Button } from "@/components/ui/button";
import { PageContextualHelpButton } from "@/components/usability/PageContextualHelpButton";
import { operatorPageContainerClass } from "@/components/operator/OperatorPageContainer";
import { resolveGuideHeadingsForStrip } from "@/lib/claim-discipline-policy";
import {
  AI_USAGE_HELP_ACCESS_PRECONDITION,
  AI_USAGE_HELP_CLAIM_HEADING_ID,
  AI_USAGE_HELP_GUIDE_HEADINGS,
  AI_USAGE_HELP_HOW_IT_WORKS_SECTION_TITLE,
  AI_USAGE_HELP_HOW_TO_READ_STEPS,
  AI_USAGE_HELP_OVERVIEW,
  AI_USAGE_HELP_PAGE_SUBTITLE,
  AI_USAGE_HELP_PAGE_TITLE,
  AI_USAGE_HELP_PRIMARY_ACTION,
  AI_USAGE_HELP_START_HERE_CARD_TITLE,
  AI_USAGE_HELP_TILE_ITEMS,
} from "@/lib/ai-usage-help-guide-content";
import {
  AI_USAGE_HELP_CANONICAL_PATH,
  AI_USAGE_HELP_CLAIM_DISCIPLINE,
} from "@/lib/ai-usage-help-evidence-copy";
import {
  AI_USAGE_HELP_BUYER_OVERVIEW,
  AI_USAGE_HELP_FIRST_VIEWPORT_TEST_ID,
  AI_USAGE_HELP_HEADER_CLAIM_DISCIPLINE_TEST_ID,
  AI_USAGE_HELP_PAGE_LEAD,
  AI_USAGE_HELP_PAGE_SUBTITLE_BUYER,
  AI_USAGE_HELP_PRIMARY_CONTENT_ID,
  AI_USAGE_HELP_SKIP_LINK_LABEL,
  AI_USAGE_HELP_SKIP_TARGET_ID,
  AI_USAGE_HELP_START_HERE_HELPER,
  AI_USAGE_HELP_WORKSPACE_TEST_ID,
} from "@/lib/ai-usage-help-page-copy";
import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";
import {
  OPERATOR_LAYOUT,
  OPERATOR_LINK,
  OPERATOR_SHELL_SCROLL_OFFSET_CLASS,
  OPERATOR_TYPOGRAPHY,
} from "@/lib/design-tokens";
import { HELP_PAGE_LAYOUT, HELP_PAGE_MIN_TOC_HEADINGS, resolveHelpPageContentGridClass } from "@/lib/help/help-page-layout";
import type { ProductDocumentationEntry } from "@/lib/product-documentation-registry";
import { cn } from "@/lib/utils";

type HelpAiUsageGuideViewProps = {
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

function aiUsageHelpPageSubtitle(buyerPolishedShell: boolean): string {
  return buyerPolishedShell ? AI_USAGE_HELP_PAGE_SUBTITLE_BUYER : AI_USAGE_HELP_PAGE_SUBTITLE;
}

function AiUsageStartHerePanel(): React.ReactElement {
  return (
    <section
      className="space-y-3 rounded-md border border-neutral-200 bg-neutral-50/80 p-4 dark:border-neutral-700 dark:bg-neutral-900/40"
      data-testid="help-ai-usage-action-panel"
      aria-labelledby="help-ai-usage-action-panel-heading"
    >
      <h2
        id="help-ai-usage-action-panel-heading"
        className={cn("m-0 text-al-text-primary", OPERATOR_TYPOGRAPHY.sectionTitle)}
      >
        {AI_USAGE_HELP_START_HERE_CARD_TITLE}
      </h2>
      <p
        className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}
        data-testid="help-ai-usage-access-precondition"
      >
        {AI_USAGE_HELP_ACCESS_PRECONDITION}
      </p>
      <div className="flex flex-wrap items-center gap-2">
        <Button asChild size="sm" variant="primary">
          <Link href={AI_USAGE_HELP_PRIMARY_ACTION.href}>{AI_USAGE_HELP_PRIMARY_ACTION.label}</Link>
        </Button>
      </div>
      <p
        className={cn("m-0 max-w-3xl text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}
        data-testid="help-ai-usage-start-here-helper"
      >
        {AI_USAGE_HELP_START_HERE_HELPER}
      </p>
    </section>
  );
}

/** Operator AI usage orientation for `/help/ai-usage`. */
export function HelpAiUsageGuideView(props: HelpAiUsageGuideViewProps): React.ReactElement {
  const { entry } = props;
  const buyerPolishedShell = isBuyerPolishedOperatorShellEnv();
  const guideHeadings = resolveGuideHeadingsForStrip(
    "help-ai-usage",
    AI_USAGE_HELP_GUIDE_HEADINGS,
    AI_USAGE_HELP_CLAIM_HEADING_ID,
  );
  const showSectionNav = !buyerPolishedShell && guideHeadings.length >= HELP_PAGE_MIN_TOC_HEADINGS;
  const contentGridClass = resolveHelpPageContentGridClass(showSectionNav ? guideHeadings.length : 0);
  const readingBodyClass = cn("m-0 leading-relaxed", HELP_PAGE_LAYOUT.readingBody);

  return (
    <article className={cn(operatorPageContainerClass("workflow"), OPERATOR_LAYOUT.majorSectionGap)} data-testid="help-ai-usage-guide">
      {buyerPolishedShell ? (
        <a href={`#${AI_USAGE_HELP_SKIP_TARGET_ID}`} className={HELP_PAGE_LAYOUT.technicalReferenceSkipLink}>
          {AI_USAGE_HELP_SKIP_LINK_LABEL}
        </a>
      ) : null}

      <HelpTopicHashScroll />

      <div
        id={buyerPolishedShell ? AI_USAGE_HELP_PRIMARY_CONTENT_ID : undefined}
        data-testid={buyerPolishedShell ? AI_USAGE_HELP_PRIMARY_CONTENT_ID : undefined}
        className={cn(buyerPolishedShell && "scroll-mt-24 space-y-6", buyerPolishedShell && OPERATOR_LAYOUT.sectionStack)}
      >
        <HelpTopicGuidePageHeader
          title={AI_USAGE_HELP_PAGE_TITLE}
          titleTestId="help-ai-usage-page-title"
          subtitle={aiUsageHelpPageSubtitle(buyerPolishedShell)}
          subtitleClassName="max-w-3xl"
          navHref={AI_USAGE_HELP_CANONICAL_PATH}
          headingLevel="h1"
          metadata={buyerPolishedShell ? undefined : <HelpTopicRegistryProvenanceLine entry={entry} />}
          claimDiscipline={buyerPolishedShell ? AI_USAGE_HELP_CLAIM_DISCIPLINE : undefined}
          claimDisciplineTestId={buyerPolishedShell ? AI_USAGE_HELP_HEADER_CLAIM_DISCIPLINE_TEST_ID : undefined}
          actions={buyerPolishedShell ? undefined : <PageContextualHelpButton />}
        />

        {buyerPolishedShell ? null : <AiUsageHelpClaimDisciplineStrip />}

        {buyerPolishedShell ? (
          <div
            id={AI_USAGE_HELP_SKIP_TARGET_ID}
            data-testid={AI_USAGE_HELP_FIRST_VIEWPORT_TEST_ID}
            className={cn(
              "scroll-mt-24 border-b border-neutral-200 pb-6 dark:border-neutral-800",
              OPERATOR_LAYOUT.sectionStack,
            )}
          >
            <div className="space-y-4" data-testid="help-ai-usage-buyer-intro">
              <p className={readingBodyClass} data-testid="help-ai-usage-intro">
                {AI_USAGE_HELP_PAGE_LEAD}
              </p>
            </div>
            <AiUsageStartHerePanel />
          </div>
        ) : null}

        {buyerPolishedShell ? (
          <p className={readingBodyClass} data-testid="help-ai-usage-overview">
            {AI_USAGE_HELP_BUYER_OVERVIEW}
          </p>
        ) : null}

        <section
          className={buyerPolishedShell ? cn("min-w-0", OPERATOR_LAYOUT.sectionStack) : undefined}
          data-testid={buyerPolishedShell ? AI_USAGE_HELP_WORKSPACE_TEST_ID : undefined}
        >
        <div className={contentGridClass}>
          <div className={cn(HELP_PAGE_LAYOUT.contentColumn, "space-y-4")}>
            {!buyerPolishedShell ? <AiUsageHelpEvidenceOrientationStrip /> : null}

            {!buyerPolishedShell ? (
              <p className={readingBodyClass} data-testid="help-ai-usage-overview">
                {AI_USAGE_HELP_OVERVIEW}
              </p>
            ) : null}

            {!buyerPolishedShell ? <AiUsageStartHerePanel /> : null}

            <section
              aria-labelledby="what-ai-usage-shows"
              className="space-y-3 border-t border-neutral-200 pt-4 dark:border-neutral-800"
            >
              <HelpSectionHeading id="what-ai-usage-shows">What AI usage shows</HelpSectionHeading>
              <dl
                className={cn("m-0 grid gap-3 sm:grid-cols-2", HELP_PAGE_LAYOUT.readingBody)}
                data-testid="help-ai-usage-tile-items"
              >
                {AI_USAGE_HELP_TILE_ITEMS.map((item) => (
                  <div key={item.label}>
                    <dt className="font-medium text-al-text-primary">
                      <Link className={OPERATOR_LINK.nav} href={item.href}>
                        {item.label}
                      </Link>
                    </dt>
                    <dd className="m-0 mt-1 text-al-text-secondary">{item.detail}</dd>
                  </div>
                ))}
              </dl>
            </section>

            <section
              aria-labelledby="how-ai-usage-works"
              className="space-y-3 border-t border-neutral-200 pt-4 dark:border-neutral-800"
            >
              <HelpSectionHeading id="how-ai-usage-works">{AI_USAGE_HELP_HOW_IT_WORKS_SECTION_TITLE}</HelpSectionHeading>
              <ol
                className={cn("m-0 list-decimal space-y-2 pl-5", HELP_PAGE_LAYOUT.readingBody)}
                data-testid="help-ai-usage-how-stepper"
              >
                {AI_USAGE_HELP_HOW_TO_READ_STEPS.map((step) => (
                  <li key={step}>{step}</li>
                ))}
              </ol>
            </section>
          </div>

          {showSectionNav ? <HelpTopicTableOfContents headings={guideHeadings} /> : null}
        </div>
        </section>

        {buyerPolishedShell ? <HelpAiUsageSourcesOrientationStrip /> : null}
      </div>
    </article>
  );
}
