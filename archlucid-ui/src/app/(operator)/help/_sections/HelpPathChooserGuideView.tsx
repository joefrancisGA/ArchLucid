import Link from "next/link";

import { HelpTopicHashScroll } from "@/app/(operator)/help/HelpTopicHashScroll";
import { HelpPathChooserEvaluatorSessionStrip } from "@/app/(operator)/help/_sections/HelpPathChooserEvaluatorSessionStrip";
import { HelpLazyDetails } from "@/components/help/HelpLazyDetails";
import { HelpTopicBreadcrumb } from "@/components/help/HelpTopicBreadcrumb";
import { HelpTopicGuidePageHeader } from "@/components/help/HelpTopicGuidePageHeader";
import { HelpTopicPrintButton } from "@/components/help/HelpTopicPrintButton";
import { HelpTopicTableOfContents } from "@/components/help/HelpTopicTableOfContents";
import { PathChooserHelpClaimDisciplineStrip } from "@/components/help/PathChooserHelpClaimDisciplineStrip";
import { PathChooserHelpRelatedNextStepsStrip } from "@/components/help/PathChooserHelpRelatedNextStepsStrip";
import { MarketingAccessibilityMarkdownFragment } from "@/components/marketing/MarketingAccessibilityMarkdownFragment";
import { PathChooserCreateObjectVocabularyRail } from "@/components/PathChooserCreateObjectVocabularyRail";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageContextualHelpButton } from "@/components/usability/PageContextualHelpButton";
import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";
import {
  PATH_CHOOSER_HELP_BRANCHES,
  PATH_CHOOSER_HELP_ACTION_PANEL_INTRO,
  PATH_CHOOSER_HELP_ACTION_PANEL_TITLE,
  PATH_CHOOSER_HELP_BREADCRUMB_TOPIC_TITLE,
  PATH_CHOOSER_HELP_OVERVIEW,
  PATH_CHOOSER_HELP_PAGE_EYEBROW,
  PATH_CHOOSER_HELP_PAGE_TITLE,
  PATH_CHOOSER_HELP_PRIMARY_ACTIONS,
  PATH_CHOOSER_HELP_PRIMARY_CONTENT_ID,
  PATH_CHOOSER_HELP_SKIP_LINK_LABEL,
  buildPathChooserHelpTocHeadings,
  pathChooserHelpPageSubtitle,
} from "@/lib/path-chooser-help-guide-content";
import { PATH_CHOOSER_HELP_PATH } from "@/lib/path-chooser-help-route";
import {
  OPERATOR_CARD,
  OPERATOR_LAYOUT,
  OPERATOR_LINK,
  OPERATOR_TYPOGRAPHY,
} from "@/lib/design-tokens";
import { extractHelpMarkdownHeadings } from "@/lib/help/help-markdown-headings";
import { prepareHelpMarkdownForPresentation } from "@/lib/help/help-markdown-presentation";
import {
  HELP_PAGE_LAYOUT,
  HELP_PAGE_MIN_TOC_HEADINGS,
  resolveHelpPageContentGridClass,
} from "@/lib/help/help-page-layout";
import type { ProductDocumentationEntry } from "@/lib/product-documentation-registry";
import { cn } from "@/lib/utils";
import { operatorPageContainerClass } from "@/components/operator/OperatorPageContainer";

type HelpPathChooserGuideViewProps = {
  readonly entry: ProductDocumentationEntry;
  readonly markdown: string;
};

/** Buyer-safe next-step chooser for `/help/choose-your-next-step` (TB-1711). */
export function HelpPathChooserGuideView(props: HelpPathChooserGuideViewProps): React.ReactElement {
  const { entry, markdown } = props;
  const buyerPolishedShell = isBuyerPolishedOperatorShellEnv();
  const sourceDocPath = entry.sourcePaths[0] ?? "";
  const preparedMarkdown = prepareHelpMarkdownForPresentation(markdown, sourceDocPath, {
    helpTopicSlug: entry.slug,
  });
  const headings = buildPathChooserHelpTocHeadings(extractHelpMarkdownHeadings(preparedMarkdown));
  const contentGridClass = resolveHelpPageContentGridClass(headings.length);
  const showSectionNav = headings.length >= HELP_PAGE_MIN_TOC_HEADINGS;

  return (
    <article
      className={cn(operatorPageContainerClass("workflow"), OPERATOR_LAYOUT.majorSectionGap)}
      data-testid="help-path-chooser-guide"
    >
      <a
        href={`#${PATH_CHOOSER_HELP_PRIMARY_CONTENT_ID}`}
        className={HELP_PAGE_LAYOUT.technicalReferenceSkipLink}
      >
        {PATH_CHOOSER_HELP_SKIP_LINK_LABEL}
      </a>

      <HelpTopicHashScroll />

      <HelpTopicGuidePageHeader
        eyebrow={buyerPolishedShell ? undefined : PATH_CHOOSER_HELP_PAGE_EYEBROW}
        title={PATH_CHOOSER_HELP_PAGE_TITLE}
        titleTestId="help-path-chooser-page-title"
        subtitle={pathChooserHelpPageSubtitle(buyerPolishedShell)}
        navHref={PATH_CHOOSER_HELP_PATH}
        headingLevel="h1"
        breadcrumb={<HelpTopicBreadcrumb topicTitle={PATH_CHOOSER_HELP_BREADCRUMB_TOPIC_TITLE} />}
        actions={
          buyerPolishedShell ? (
            <HelpTopicPrintButton entry={entry} />
          ) : (
            <div className="flex flex-wrap items-center gap-2" data-testid="help-path-chooser-header-actions">
              <PageContextualHelpButton />
              <HelpTopicPrintButton entry={entry} />
            </div>
          )
        }
      />

      <PathChooserHelpClaimDisciplineStrip />

      {buyerPolishedShell ? null : (
        <PathChooserCreateObjectVocabularyRail currentSurfaceId="path-chooser" />
      )}

      <div className={contentGridClass}>
        <div className={cn(HELP_PAGE_LAYOUT.contentColumn, "space-y-6")}>
          <div
            id={PATH_CHOOSER_HELP_PRIMARY_CONTENT_ID}
            className={cn("scroll-mt-24 space-y-6")}
            data-testid="help-path-chooser-first-viewport"
          >
            <p
              className={cn("m-0 max-w-3xl text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}
              data-testid="help-path-chooser-overview"
            >
              {PATH_CHOOSER_HELP_OVERVIEW}
            </p>

            <section
              aria-labelledby="help-path-chooser-branches-heading"
              data-testid="help-path-chooser-branches"
              id="choose-by-goal"
            >
              <h2
                id="help-path-chooser-branches-heading"
                className={cn("m-0 text-al-text-primary", OPERATOR_TYPOGRAPHY.sectionTitle)}
              >
                Choose by goal
              </h2>
              <p className={cn("m-0 mt-1 max-w-3xl text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
                Each branch has one primary action and one alternate — open the citeable product or help surface before
                briefing sponsors.
              </p>
              <ul className="m-0 mt-3 grid list-none gap-3 p-0 sm:grid-cols-2">
                {PATH_CHOOSER_HELP_BRANCHES.map((branch) => (
                  <li
                    key={branch.id}
                    className="rounded-md border border-neutral-200 bg-white p-3 dark:border-neutral-800 dark:bg-neutral-950"
                    data-testid={`help-path-chooser-branch-${branch.id}`}
                  >
                    <p className={cn("m-0 font-semibold text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}>
                      {branch.goal}
                    </p>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <Button asChild size="sm" variant="primary">
                        <Link href={branch.primary.href}>{branch.primary.label}</Link>
                      </Button>
                      <span className={cn("text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>Or</span>
                      <Link className={OPERATOR_LINK.optional} href={branch.fallback.href}>
                        {branch.fallback.label}
                      </Link>
                    </div>
                  </li>
                ))}
              </ul>
            </section>

            <Card
              className="border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-950"
              data-testid="help-path-chooser-action-panel"
              id="common-next-steps"
            >
              <CardHeader className={OPERATOR_CARD.header}>
                <CardTitle as="h2" className={cn("text-lg", OPERATOR_TYPOGRAPHY.sectionTitle)}>
                  {PATH_CHOOSER_HELP_ACTION_PANEL_TITLE}
                </CardTitle>
                <p className={cn("m-0 max-w-3xl text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
                  {PATH_CHOOSER_HELP_ACTION_PANEL_INTRO}
                </p>
              </CardHeader>
              <CardContent className={cn(OPERATOR_CARD.content, "flex flex-wrap items-center gap-2")}>
                <Button asChild size="sm" variant="primary" data-testid="help-path-chooser-start-review">
                  <Link href={PATH_CHOOSER_HELP_PRIMARY_ACTIONS.startReview.href}>
                    {PATH_CHOOSER_HELP_PRIMARY_ACTIONS.startReview.label}
                  </Link>
                </Button>
                <Button asChild size="sm" variant="outline">
                  <Link href={PATH_CHOOSER_HELP_PRIMARY_ACTIONS.securityTrust.href}>
                    {PATH_CHOOSER_HELP_PRIMARY_ACTIONS.securityTrust.label}
                  </Link>
                </Button>
                <Link
                  href={PATH_CHOOSER_HELP_PRIMARY_ACTIONS.firstPilotPath.href}
                  className={cn(OPERATOR_LINK.inline, OPERATOR_TYPOGRAPHY.body)}
                >
                  {PATH_CHOOSER_HELP_PRIMARY_ACTIONS.firstPilotPath.label}
                </Link>
              </CardContent>
            </Card>

            <HelpPathChooserEvaluatorSessionStrip />
          </div>

          <section
            aria-labelledby="help-path-chooser-reference-heading"
            data-testid="help-path-chooser-content"
            id="reference-detail"
          >
            <HelpLazyDetails
              className="rounded-md border border-neutral-200 bg-neutral-50/60 p-3 dark:border-neutral-800 dark:bg-neutral-900/30"
              data-testid="help-path-chooser-reference-appendix"
              summaryClassName={cn("cursor-pointer font-medium text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}
              summary="Buyer orientation reference (pass/hold, stop rules, deferred scope)"
              preface={
                <p className={cn("m-0 mt-2 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
                  Collapsed by default so the first viewport stays an evaluator guide. Expand when you need pass/hold
                  tables or stop-rule detail.
                </p>
              }
              bodyClassName={cn("mt-4", HELP_PAGE_LAYOUT.contentColumn)}
            >
              <MarketingAccessibilityMarkdownFragment
                markdownBody={markdown}
                tableCaption={`${entry.title} reference table`}
                presentation="help"
                sourceDocPath={sourceDocPath}
                helpTopicSlug={entry.slug}
                preparedMarkdownOverride={preparedMarkdown}
              />
            </HelpLazyDetails>
          </section>

          <PathChooserHelpRelatedNextStepsStrip />
        </div>

        {showSectionNav ? <HelpTopicTableOfContents headings={headings} enableScrollSpy /> : null}
      </div>
    </article>
  );
}
