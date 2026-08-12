"use client";

import Link from "next/link";
import { HelpRepeatReviewLoopPageHeader } from "@/app/(operator)/help/_sections/HelpRepeatReviewLoopPageHeader";
import { HelpTopicHashScroll } from "@/app/(operator)/help/HelpTopicHashScroll";
import { HelpTopicTableOfContents } from "@/components/help/HelpTopicTableOfContents";
import { MermaidDiagram } from "@/components/help/MermaidDiagram";
import { RepeatReviewLoopHelpEvidenceOrientationStrip } from "@/components/help/RepeatReviewLoopHelpEvidenceOrientationStrip";
import { MarketingAccessibilityMarkdownFragment } from "@/components/marketing/MarketingAccessibilityMarkdownFragment";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";
import {
  DESIGN_TOKENS,
  OPERATOR_CARD,
  OPERATOR_LAYOUT,
  OPERATOR_LINK,
  OPERATOR_TYPOGRAPHY,
} from "@/lib/design-tokens";
import { extractHelpMarkdownHeadings } from "@/lib/help/help-markdown-headings";
import { prepareHelpMarkdownForPresentation } from "@/lib/help/help-markdown-presentation";
import { HELP_PAGE_LAYOUT } from "@/lib/help/help-page-layout";
import type { ProductDocumentationEntry } from "@/lib/product-documentation-registry";
import {
  REPEAT_REVIEW_LOOP_HELP_AUDIENCE,
  REPEAT_REVIEW_LOOP_HELP_DIAGRAM_SOURCE,
  REPEAT_REVIEW_LOOP_HELP_DIAGRAM_SUMMARY,
  REPEAT_REVIEW_LOOP_HELP_DIAGRAM_THEME_VARIABLES,
  REPEAT_REVIEW_LOOP_HELP_DIAGRAM_THEME_VARIABLES_DARK,
  REPEAT_REVIEW_LOOP_HELP_OVERVIEW,
  REPEAT_REVIEW_LOOP_HELP_PREREQUISITE_DETAIL,
  REPEAT_REVIEW_LOOP_HELP_PRIMARY_ACTIONS,
  repeatReviewLoopHelpPageSubtitle,
} from "@/lib/repeat-review-loop-help-guide-content";
import {
  REPEAT_REVIEW_LOOP_HELP_RELATED,
  REPEAT_REVIEW_LOOP_HELP_RELATED_HEADING,
} from "@/lib/repeat-review-loop-help-evidence-copy";
import { cn } from "@/lib/utils";
import { useDocumentDarkMode } from "@/lib/use-document-dark-mode";

type HelpRepeatReviewLoopGuideViewProps = {
  readonly entry: ProductDocumentationEntry;
  readonly markdown: string;
};

/** Buyer-safe repeat-review orientation for `/help/repeat-review-loop`. */
export function HelpRepeatReviewLoopGuideView(props: HelpRepeatReviewLoopGuideViewProps): React.JSX.Element {
  const { entry, markdown } = props;
  const buyerPolishedShell = isBuyerPolishedOperatorShellEnv();
  const dark = useDocumentDarkMode();
  const sourceDocPath = entry.sourcePaths[0] ?? "";
  const preparedMarkdown = prepareHelpMarkdownForPresentation(markdown, sourceDocPath, {
    helpTopicSlug: entry.slug,
  });
  const headings = extractHelpMarkdownHeadings(preparedMarkdown);
  const diagramThemeVariables = dark
    ? REPEAT_REVIEW_LOOP_HELP_DIAGRAM_THEME_VARIABLES_DARK
    : REPEAT_REVIEW_LOOP_HELP_DIAGRAM_THEME_VARIABLES;

  return (
    <article
      className={cn(OPERATOR_LAYOUT.majorSectionGap, "w-full max-w-[72rem]")}
      data-testid="help-repeat-review-loop-guide"
    >
      <HelpTopicHashScroll />

      <HelpRepeatReviewLoopPageHeader
        entry={entry}
        subtitle={repeatReviewLoopHelpPageSubtitle(buyerPolishedShell)}
      />

      <div
        className="space-y-2 border-b border-neutral-200 pb-6 dark:border-neutral-800"
        data-testid="help-repeat-review-loop-eligibility"
      >
        <p className={cn("m-0", OPERATOR_TYPOGRAPHY.body)}>{REPEAT_REVIEW_LOOP_HELP_AUDIENCE}</p>
        <p className={cn("m-0", OPERATOR_TYPOGRAPHY.body)}>
          {REPEAT_REVIEW_LOOP_HELP_PREREQUISITE_DETAIL}{" "}
          <Link
            href={REPEAT_REVIEW_LOOP_HELP_PRIMARY_ACTIONS.firstArchitectureReview.href}
            className={cn("underline-offset-2 hover:underline", DESIGN_TOKENS.accent.link, OPERATOR_LINK.inline)}
          >
            {REPEAT_REVIEW_LOOP_HELP_PRIMARY_ACTIONS.firstArchitectureReview.label}
          </Link>
          .
        </p>
      </div>

      <div className="space-y-4 border-b border-neutral-200 pb-6 dark:border-neutral-800">
        <Card
          className="border-neutral-200 bg-al-surface-raised dark:border-neutral-800"
          data-testid="help-repeat-review-loop-action-panel"
        >
          <CardHeader className={OPERATOR_CARD.header}>
            <CardTitle className={cn("text-lg", OPERATOR_TYPOGRAPHY.sectionTitle)}>Start the loop</CardTitle>
          </CardHeader>
          <CardContent className={cn(OPERATOR_CARD.content, "flex flex-wrap items-center gap-2")}>
            <Button asChild size="sm" variant="primary">
              <Link href={REPEAT_REVIEW_LOOP_HELP_PRIMARY_ACTIONS.compareReviews.href}>
                {REPEAT_REVIEW_LOOP_HELP_PRIMARY_ACTIONS.compareReviews.label}
              </Link>
            </Button>
            <Button asChild size="sm" variant="outline">
              <Link href={REPEAT_REVIEW_LOOP_HELP_PRIMARY_ACTIONS.startNextReview.href}>
                {REPEAT_REVIEW_LOOP_HELP_PRIMARY_ACTIONS.startNextReview.label}
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      <RepeatReviewLoopHelpEvidenceOrientationStrip />

      <div className={HELP_PAGE_LAYOUT.contentGrid}>
        <div className={cn("min-w-0 space-y-6", HELP_PAGE_LAYOUT.contentColumn)}>
          <p className={cn("m-0", OPERATOR_TYPOGRAPHY.body)} data-testid="help-repeat-review-loop-overview">
            {REPEAT_REVIEW_LOOP_HELP_OVERVIEW}
          </p>

          <div
            className={cn(
              "w-full space-y-3 rounded-lg border border-neutral-200 bg-al-surface-raised p-4 dark:border-neutral-800",
              OPERATOR_TYPOGRAPHY.body,
            )}
            data-testid="help-repeat-review-loop-stickiness-diagram"
          >
            <MarketingAccessibilityMarkdownFragment
              markdownBody={REPEAT_REVIEW_LOOP_HELP_DIAGRAM_SUMMARY}
              tableCaption="Repeat architecture review loop summary"
              presentation="help"
              sourceDocPath={sourceDocPath}
              helpTopicSlug={entry.slug}
            />
            <MermaidDiagram
              source={REPEAT_REVIEW_LOOP_HELP_DIAGRAM_SOURCE}
              accessibleName="Repeat architecture review loop"
              themeVariables={diagramThemeVariables}
            />
          </div>

          <div className={HELP_PAGE_LAYOUT.contentColumn} data-testid="help-repeat-review-loop-content">
            <MarketingAccessibilityMarkdownFragment
              markdownBody={markdown}
              tableCaption={`${entry.title} reference table`}
              presentation="help"
              sourceDocPath={sourceDocPath}
              helpTopicSlug={entry.slug}
            />
          </div>

          <section
            className="space-y-2"
            aria-labelledby="help-repeat-review-loop-related-heading"
            data-testid="help-repeat-review-loop-related-help"
          >
            <h2 id="help-repeat-review-loop-related-heading" className={cn("m-0", OPERATOR_TYPOGRAPHY.sectionTitle)}>
              {REPEAT_REVIEW_LOOP_HELP_RELATED_HEADING}
            </h2>
            <ul className={cn("m-0 list-disc space-y-1 pl-5", OPERATOR_TYPOGRAPHY.body)}>
              {REPEAT_REVIEW_LOOP_HELP_RELATED.map((link) => (
                <li key={`${link.href}-${link.label}`}>
                  <Link
                    href={link.href}
                    className={cn("underline-offset-2 hover:underline", DESIGN_TOKENS.accent.link, OPERATOR_LINK.inline)}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        </div>

        <HelpTopicTableOfContents headings={headings} />
      </div>
    </article>
  );
}
