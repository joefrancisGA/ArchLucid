import Link from "next/link";

import { HelpPathChooserClaimOrientationStrip } from "@/app/(operator)/help/_sections/HelpPathChooserClaimOrientationStrip";
import { HelpPathChooserEvaluatorSessionStrip } from "@/app/(operator)/help/_sections/HelpPathChooserEvaluatorSessionStrip";
import { HelpPathChooserHeaderActions } from "@/app/(operator)/help/_sections/HelpPathChooserHeaderActions";
import { HelpPathChooserReferenceAppendixDisclosure } from "@/app/(operator)/help/_sections/HelpPathChooserReferenceAppendixDisclosure";
import { HelpTopicHashScroll } from "@/app/(operator)/help/HelpTopicHashScroll";
import { HelpTopicGuidePageHeader } from "@/components/help/HelpTopicGuidePageHeader";
import { HelpTopicTableOfContents } from "@/components/help/HelpTopicTableOfContents";
import { PathChooserHelpClaimDisciplineStrip } from "@/components/help/PathChooserHelpClaimDisciplineStrip";
import { PathChooserHelpRelatedNextStepsStrip } from "@/components/help/PathChooserHelpRelatedNextStepsStrip";
import { MarketingAccessibilityMarkdownFragment } from "@/components/marketing/MarketingAccessibilityMarkdownFragment";
import { PathChooserCreateObjectVocabularyRail } from "@/components/PathChooserCreateObjectVocabularyRail";
import { Button } from "@/components/ui/button";
import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";
import {
  PATH_CHOOSER_HELP_BRANCHES,
  PATH_CHOOSER_HELP_ACTION_PANEL_INTRO,
  PATH_CHOOSER_HELP_ACTION_PANEL_TITLE,
  PATH_CHOOSER_HELP_FIRST_VIEWPORT_TEST_ID,
  PATH_CHOOSER_HELP_HEADER_CLAIM_DISCIPLINE_TEST_ID,
  PATH_CHOOSER_HELP_ORIENTATION_BOTTOM_TEST_ID,
  PATH_CHOOSER_HELP_OVERVIEW,
  PATH_CHOOSER_HELP_PAGE_EYEBROW,
  PATH_CHOOSER_HELP_PAGE_LEAD,
  PATH_CHOOSER_HELP_PAGE_TITLE,
  PATH_CHOOSER_HELP_PRIMARY_ACTIONS,
  PATH_CHOOSER_HELP_PRIMARY_CONTENT_ID,
  PATH_CHOOSER_HELP_SKIP_LINK_LABEL,
  PATH_CHOOSER_HELP_SKIP_TARGET_ID,
  PATH_CHOOSER_HELP_START_HERE_HELPER,
  buildPathChooserHelpTocHeadings,
  pathChooserHelpPageSubtitle,
} from "@/lib/path-chooser-help-guide-content";
import {
  PATH_CHOOSER_HELP_CANONICAL_PATH,
  PATH_CHOOSER_HELP_CLAIM_DISCIPLINE,
  PATH_CHOOSER_HELP_CLAIM_HEADING_ID,
} from "@/lib/path-chooser-help-evidence-copy";
import {
  OPERATOR_LAYOUT,
  OPERATOR_LINK,
  OPERATOR_TYPOGRAPHY,
} from "@/lib/design-tokens";
import { resolveGuideHeadingsForStrip } from "@/lib/claim-discipline-policy";
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
  const headings = resolveGuideHeadingsForStrip(
    "help-path-chooser",
    buildPathChooserHelpTocHeadings(extractHelpMarkdownHeadings(preparedMarkdown)),
    PATH_CHOOSER_HELP_CLAIM_HEADING_ID,
  );
  const contentGridClass = resolveHelpPageContentGridClass(
    buyerPolishedShell ? 0 : headings.length,
  );
  const showSectionNav = !buyerPolishedShell && headings.length >= HELP_PAGE_MIN_TOC_HEADINGS;
  const readingBodyClass = cn("m-0 max-w-3xl leading-relaxed", HELP_PAGE_LAYOUT.readingBody);

  const firstViewportBody = (
    <>
      {buyerPolishedShell ? (
        <div className="space-y-4" data-testid="help-path-chooser-buyer-intro">
          <p className={readingBodyClass} data-testid="help-path-chooser-intro">
            {PATH_CHOOSER_HELP_PAGE_LEAD}
          </p>
          <p
            className={cn("m-0 max-w-3xl text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}
            data-testid="help-path-chooser-start-here-helper"
          >
            {PATH_CHOOSER_HELP_START_HERE_HELPER}
          </p>
        </div>
      ) : (
        <p
          className={cn("m-0 max-w-3xl text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}
          data-testid="help-path-chooser-overview"
        >
          {PATH_CHOOSER_HELP_OVERVIEW}
        </p>
      )}

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

      <section
        className="space-y-3 rounded-md border border-neutral-200 bg-neutral-50/80 p-4 dark:border-neutral-700 dark:bg-neutral-900/40"
        data-testid="help-path-chooser-action-panel"
        id="common-next-steps"
        aria-labelledby="help-path-chooser-action-panel-heading"
      >
        <h2
          id="help-path-chooser-action-panel-heading"
          className={cn("m-0 text-al-text-primary", OPERATOR_TYPOGRAPHY.sectionTitle)}
        >
          {PATH_CHOOSER_HELP_ACTION_PANEL_TITLE}
        </h2>
        <p className={cn("m-0 max-w-3xl text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
          {PATH_CHOOSER_HELP_ACTION_PANEL_INTRO}
        </p>
        <div className="flex flex-wrap items-center gap-2">
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
        </div>
      </section>

      <HelpPathChooserEvaluatorSessionStrip />
    </>
  );

  return (
    <article
      className={cn(operatorPageContainerClass("workflow"), OPERATOR_LAYOUT.majorSectionGap)}
      data-testid="help-path-chooser-guide"
    >
      <a href={`#${PATH_CHOOSER_HELP_SKIP_TARGET_ID}`} className={HELP_PAGE_LAYOUT.technicalReferenceSkipLink}>
        {PATH_CHOOSER_HELP_SKIP_LINK_LABEL}
      </a>

      <HelpTopicHashScroll />

      <div
        id={PATH_CHOOSER_HELP_PRIMARY_CONTENT_ID}
        data-testid={PATH_CHOOSER_HELP_PRIMARY_CONTENT_ID}
        className={cn("scroll-mt-24 space-y-6", OPERATOR_LAYOUT.sectionStack)}
      >
        <HelpTopicGuidePageHeader
          eyebrow={buyerPolishedShell ? undefined : PATH_CHOOSER_HELP_PAGE_EYEBROW}
          title={PATH_CHOOSER_HELP_PAGE_TITLE}
          titleTestId="help-path-chooser-page-title"
          subtitle={pathChooserHelpPageSubtitle(buyerPolishedShell)}
          navHref={PATH_CHOOSER_HELP_CANONICAL_PATH}
          headingLevel="h1"
          claimDiscipline={PATH_CHOOSER_HELP_CLAIM_DISCIPLINE}
          claimDisciplineTestId={PATH_CHOOSER_HELP_HEADER_CLAIM_DISCIPLINE_TEST_ID}
          actions={<HelpPathChooserHeaderActions entry={entry} />}
        />

        {buyerPolishedShell ? null : <PathChooserHelpClaimDisciplineStrip />}

        {buyerPolishedShell ? null : (
          <PathChooserCreateObjectVocabularyRail currentSurfaceId="path-chooser" />
        )}

        <div className={contentGridClass}>
          <div className={cn(HELP_PAGE_LAYOUT.contentColumn, "space-y-6")}>
            {buyerPolishedShell ? null : <PathChooserHelpRelatedNextStepsStrip />}

            <div
              id={PATH_CHOOSER_HELP_SKIP_TARGET_ID}
              className={cn(
                "scroll-mt-24 space-y-6 border-b border-neutral-200 pb-6 dark:border-neutral-800",
                OPERATOR_LAYOUT.sectionStack,
              )}
              data-testid={PATH_CHOOSER_HELP_FIRST_VIEWPORT_TEST_ID}
            >
              {firstViewportBody}
            </div>

            <section
              aria-labelledby="help-path-chooser-reference-heading"
              data-testid="help-path-chooser-content"
              id="reference-detail"
            >
              <HelpPathChooserReferenceAppendixDisclosure
                className="rounded-md border border-neutral-200 bg-neutral-50/60 p-3 dark:border-neutral-800 dark:bg-neutral-900/30"
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
              </HelpPathChooserReferenceAppendixDisclosure>
            </section>
          </div>

          {showSectionNav ? <HelpTopicTableOfContents headings={headings} enableScrollSpy /> : null}
        </div>

        {buyerPolishedShell ? (
          <div data-testid={PATH_CHOOSER_HELP_ORIENTATION_BOTTOM_TEST_ID}>
            <HelpPathChooserClaimOrientationStrip />
          </div>
        ) : null}
      </div>
    </article>
  );
}
