import Link from "next/link";

import { HelpTopicHashScroll } from "@/app/(operator)/help/HelpTopicHashScroll";
import { HelpPathChooserEvaluatorSessionStrip } from "@/app/(operator)/help/_sections/HelpPathChooserEvaluatorSessionStrip";
import { HelpPathChooserRelatedNextStepsLinks } from "@/app/(operator)/help/_sections/HelpPathChooserRelatedNextStepsLinks";
import { HelpLazyDetails } from "@/components/help/HelpLazyDetails";
import { HelpTopicPdfDownloadButton } from "@/components/help/HelpTopicPdfDownloadButton";
import { HelpTopicPrintButton } from "@/components/help/HelpTopicPrintButton";
import { HelpTopicTableOfContents } from "@/components/help/HelpTopicTableOfContents";
import { MarketingAccessibilityMarkdownFragment } from "@/components/marketing/MarketingAccessibilityMarkdownFragment";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { OperatorPageHeader } from "@/components/OperatorPageHeader";
import { PageContextualHelpButton } from "@/components/usability/PageContextualHelpButton";
import {
  PATH_CHOOSER_HELP_BRANCHES,
  PATH_CHOOSER_HELP_ACTION_PANEL_INTRO,
  PATH_CHOOSER_HELP_ACTION_PANEL_TITLE,
  PATH_CHOOSER_HELP_OVERVIEW,
  PATH_CHOOSER_HELP_PAGE_SUBTITLE,
  PATH_CHOOSER_HELP_PAGE_TITLE,
  PATH_CHOOSER_HELP_PRIMARY_ACTIONS,
} from "@/lib/path-chooser-help-guide-content";
import {
  PATH_CHOOSER_HELP_CLAIM_DISCIPLINE,
  PATH_CHOOSER_HELP_CLAIM_DISCIPLINE_SCOPE,
  PATH_CHOOSER_HELP_RELATED_NEXT_STEPS_INTRO,
} from "@/lib/path-chooser-help-evidence-copy";
import { PATH_CHOOSER_HELP_PATH } from "@/lib/path-chooser-help-route";
import {
  OPERATOR_CARD,
  OPERATOR_LAYOUT,
  OPERATOR_LINK,
  OPERATOR_TYPOGRAPHY,
} from "@/lib/design-tokens";
import { extractHelpMarkdownHeadings } from "@/lib/help-markdown-headings";
import type { HelpMarkdownHeading } from "@/lib/help-markdown-headings";
import { prepareHelpMarkdownForPresentation } from "@/lib/help-markdown-presentation";
import { HELP_PAGE_LAYOUT } from "@/lib/help-page-layout";
import type { ProductDocumentationEntry } from "@/lib/product-documentation-registry";
import { cn } from "@/lib/utils";

type HelpPathChooserGuideViewProps = {
  readonly entry: ProductDocumentationEntry;
  readonly markdown: string;
};

export const PATH_CHOOSER_HELP_GUIDE_HEADINGS: readonly HelpMarkdownHeading[] = [
  { level: 2, id: "choose-by-goal", title: "Choose by goal" },
  { level: 2, id: "reference-detail", title: "Buyer orientation reference" },
  { level: 2, id: "claim-discipline", title: "Claim discipline" },
  { level: 2, id: "related-next-steps", title: "Related next steps" },
];

/** Buyer-safe next-step chooser for `/help/path-chooser` (TB-1711). */
export function HelpPathChooserGuideView(props: HelpPathChooserGuideViewProps): React.ReactElement {
  const { entry, markdown } = props;
  const sourceDocPath = entry.sourcePaths[0] ?? "";
  const preparedMarkdown = prepareHelpMarkdownForPresentation(markdown, sourceDocPath, {
    helpTopicSlug: entry.slug,
  });
  const referenceHeadings = extractHelpMarkdownHeadings(preparedMarkdown);
  const tocHeadings = [
    ...PATH_CHOOSER_HELP_GUIDE_HEADINGS.slice(0, 2),
    ...referenceHeadings,
    ...PATH_CHOOSER_HELP_GUIDE_HEADINGS.slice(2),
  ];

  return (
    <article
      className={cn(OPERATOR_LAYOUT.majorSectionGap, "w-full max-w-[72rem]")}
      data-testid="help-path-chooser-guide"
    >
      <HelpTopicHashScroll />

      <OperatorPageHeader
        title={PATH_CHOOSER_HELP_PAGE_TITLE}
        titleTestId="help-path-chooser-page-title"
        subtitle={PATH_CHOOSER_HELP_PAGE_SUBTITLE}
        navHref={PATH_CHOOSER_HELP_PATH}
        actions={
          <div className="flex flex-wrap items-center gap-2" data-testid="help-path-chooser-header-actions">
            <PageContextualHelpButton />
            <HelpTopicPdfDownloadButton entry={entry} />
            <HelpTopicPrintButton entry={entry} />
          </div>
        }
      />

      <div className="space-y-4 border-b border-neutral-200 pb-6 dark:border-neutral-800">
        <p className={cn("m-0 max-w-3xl text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)} data-testid="help-path-chooser-overview">
          {PATH_CHOOSER_HELP_OVERVIEW}
        </p>

        <Card
          className="border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-950"
          data-testid="help-path-chooser-action-panel"
        >
          <CardHeader className={OPERATOR_CARD.header}>
            <CardTitle as="h2" className={cn("text-lg", OPERATOR_TYPOGRAPHY.sectionTitle)}>
              {PATH_CHOOSER_HELP_ACTION_PANEL_TITLE}
            </CardTitle>
            <p className={cn("m-0 max-w-3xl text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
              {PATH_CHOOSER_HELP_ACTION_PANEL_INTRO}
            </p>
            <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
              {PATH_CHOOSER_HELP_CLAIM_DISCIPLINE_SCOPE}
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
                  <Link className={cn(OPERATOR_LINK.inline, OPERATOR_TYPOGRAPHY.helper)} href={branch.fallback.href}>
                    {branch.fallback.label}
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <div className={HELP_PAGE_LAYOUT.contentGrid}>
        <div className={cn("min-w-0 space-y-6", "max-w-[42rem] lg:max-w-none")}>
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
              />
            </HelpLazyDetails>
          </section>

          <aside
            className="rounded-md border border-neutral-200 bg-white p-3 dark:border-neutral-800 dark:bg-neutral-950"
            data-testid="help-path-chooser-claim-discipline"
            id="claim-discipline"
          >
            <h2 className={cn("m-0 text-al-text-primary", OPERATOR_TYPOGRAPHY.sectionTitle)}>Claim discipline</h2>
            <p className={cn("m-0 mt-2", OPERATOR_TYPOGRAPHY.body)}>{PATH_CHOOSER_HELP_CLAIM_DISCIPLINE}</p>
          </aside>

          <section
            aria-labelledby="help-path-chooser-related-next-steps-heading"
            data-testid="help-path-chooser-related-next-steps"
            id="related-next-steps"
          >
            <Card className="border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-950">
              <CardHeader className={OPERATOR_CARD.header}>
                <h2
                  id="help-path-chooser-related-next-steps-heading"
                  className={cn("m-0 text-lg", OPERATOR_TYPOGRAPHY.sectionTitle)}
                >
                  Related next steps
                </h2>
                <p className={cn("m-0 max-w-3xl text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
                  {PATH_CHOOSER_HELP_RELATED_NEXT_STEPS_INTRO}
                </p>
              </CardHeader>
              <CardContent className={OPERATOR_CARD.content}>
                <HelpPathChooserRelatedNextStepsLinks />
              </CardContent>
            </Card>
          </section>
        </div>

        <HelpTopicTableOfContents headings={tocHeadings} />
      </div>
    </article>
  );
}
