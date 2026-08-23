import Link from "next/link";

import { HelpTopicHashScroll } from "@/app/(operator)/help/HelpTopicHashScroll";
import { AiUsageHelpEvidenceOrientationStrip } from "@/components/help/AiUsageHelpEvidenceOrientationStrip";
import { HelpTopicGuidePageHeader } from "@/components/help/HelpTopicGuidePageHeader";
import { HelpTopicRegistryProvenanceLine } from "@/components/help/HelpTopicRegistryProvenanceLine";
import { HelpTopicTableOfContents } from "@/components/help/HelpTopicTableOfContents";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageContextualHelpButton } from "@/components/usability/PageContextualHelpButton";
import {
  AI_USAGE_HELP_ACCESS_PRECONDITION,
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
import { AI_USAGE_HELP_CANONICAL_PATH } from "@/lib/ai-usage-help-evidence-copy";
import {
  OPERATOR_CARD,
  OPERATOR_LAYOUT,
  OPERATOR_LINK,
  OPERATOR_SHELL_SCROLL_OFFSET_CLASS,
  OPERATOR_TYPOGRAPHY,
} from "@/lib/design-tokens";
import { HELP_PAGE_LAYOUT, resolveHelpPageContentGridClass } from "@/lib/help/help-page-layout";
import type { ProductDocumentationEntry } from "@/lib/product-documentation-registry";
import { cn } from "@/lib/utils";
import { operatorPageContainerClass } from "@/components/operator/OperatorPageContainer";

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

/** Operator AI usage orientation for `/help/ai-usage`. */
export function HelpAiUsageGuideView(props: HelpAiUsageGuideViewProps): React.ReactElement {
  const { entry } = props;
  const contentGridClass = resolveHelpPageContentGridClass(AI_USAGE_HELP_GUIDE_HEADINGS.length);
  const readingBodyClass = cn("m-0 leading-relaxed", HELP_PAGE_LAYOUT.readingBody);

  return (
    <article className={cn(operatorPageContainerClass("workflow"), OPERATOR_LAYOUT.majorSectionGap)} data-testid="help-ai-usage-guide">
      <HelpTopicHashScroll />

      <HelpTopicGuidePageHeader
        title={AI_USAGE_HELP_PAGE_TITLE}
        titleTestId="help-ai-usage-page-title"
        subtitle={AI_USAGE_HELP_PAGE_SUBTITLE}
        navHref={AI_USAGE_HELP_CANONICAL_PATH}
        headingLevel="h1"
        metadata={<HelpTopicRegistryProvenanceLine entry={entry} />}
        actions={<PageContextualHelpButton />}
      />

      <div className={contentGridClass}>
        <div className={cn(HELP_PAGE_LAYOUT.contentColumn, "space-y-4")}>
          <p className={readingBodyClass} data-testid="help-ai-usage-overview">
            {AI_USAGE_HELP_OVERVIEW}
          </p>

          <Card className="border-neutral-200 dark:border-neutral-800" data-testid="help-ai-usage-action-panel">
            <CardHeader className={OPERATOR_CARD.header}>
              <CardTitle as="h2" className={cn("m-0", OPERATOR_TYPOGRAPHY.cardTitle)}>
                {AI_USAGE_HELP_START_HERE_CARD_TITLE}
              </CardTitle>
            </CardHeader>
            <CardContent className={cn(OPERATOR_CARD.content, "space-y-2")}>
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
            </CardContent>
          </Card>

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

          <AiUsageHelpEvidenceOrientationStrip />
        </div>

        <HelpTopicTableOfContents headings={AI_USAGE_HELP_GUIDE_HEADINGS} />
      </div>
    </article>
  );
}
