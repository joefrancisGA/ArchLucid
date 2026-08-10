import Link from "next/link";

import { HelpTopicHashScroll } from "@/app/(operator)/help/HelpTopicHashScroll";
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
  PATH_CHOOSER_HELP_CLAIM_DISCIPLINE,
  PATH_CHOOSER_HELP_OVERVIEW,
  PATH_CHOOSER_HELP_PAGE_SUBTITLE,
  PATH_CHOOSER_HELP_PAGE_TITLE,
  PATH_CHOOSER_HELP_PRIMARY_ACTIONS,
} from "@/lib/path-chooser-help-guide-content";
import { PATH_CHOOSER_HELP_PATH } from "@/lib/path-chooser-help-route";
import {
  DESIGN_TOKENS,
  OPERATOR_CARD,
  OPERATOR_LAYOUT,
  OPERATOR_LINK,
  OPERATOR_TYPOGRAPHY,
} from "@/lib/design-tokens";
import { extractHelpMarkdownHeadings } from "@/lib/help-markdown-headings";
import { prepareHelpMarkdownForPresentation } from "@/lib/help-markdown-presentation";
import { HELP_PAGE_LAYOUT } from "@/lib/help-page-layout";
import type { ProductDocumentationEntry } from "@/lib/product-documentation-registry";
import { cn } from "@/lib/utils";

type HelpPathChooserGuideViewProps = {
  readonly entry: ProductDocumentationEntry;
  readonly markdown: string;
};

/** Buyer-safe next-step chooser for `/help/path-chooser` (TB-1711). */
export function HelpPathChooserGuideView(props: HelpPathChooserGuideViewProps): React.ReactElement {
  const { entry, markdown } = props;
  const sourceDocPath = entry.sourcePaths[0] ?? "";
  const preparedMarkdown = prepareHelpMarkdownForPresentation(markdown, sourceDocPath, {
    helpTopicSlug: entry.slug,
  });
  const headings = extractHelpMarkdownHeadings(preparedMarkdown);

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
        <Card
          className="border-teal-200/80 bg-teal-50/40 dark:border-teal-900/50 dark:bg-teal-950/20"
          data-testid="help-path-chooser-action-panel"
        >
          <CardHeader className={OPERATOR_CARD.header}>
            <CardTitle className={cn("text-lg", OPERATOR_TYPOGRAPHY.sectionTitle)}>Common next steps</CardTitle>
          </CardHeader>
          <CardContent className={cn(OPERATOR_CARD.content, "flex flex-wrap items-center gap-2")}>
            <Button asChild size="sm" variant="primary">
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
              className={cn(
                "text-sm underline-offset-2 hover:underline",
                DESIGN_TOKENS.accent.link,
                OPERATOR_TYPOGRAPHY.body,
              )}
            >
              {PATH_CHOOSER_HELP_PRIMARY_ACTIONS.firstPilotPath.label}
            </Link>
          </CardContent>
        </Card>

        <section
          aria-labelledby="help-path-chooser-branches-heading"
          data-testid="help-path-chooser-branches"
        >
          <h2
            id="help-path-chooser-branches-heading"
            className={cn("m-0 text-al-text-primary", OPERATOR_TYPOGRAPHY.sectionTitle)}
          >
            Choose by goal
          </h2>
          <p className={cn("m-0 mt-1 max-w-3xl text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
            Each branch has one primary action and one fallback — open the citeable product or help surface before
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
                <p className={cn("m-0 mt-2 flex flex-wrap gap-x-3 gap-y-1", OPERATOR_TYPOGRAPHY.helper)}>
                  <Link className={cn(OPERATOR_LINK.inline, "font-medium")} href={branch.primary.href}>
                    {branch.primary.label}
                  </Link>
                  <Link className={OPERATOR_LINK.inline} href={branch.fallback.href}>
                    Fallback: {branch.fallback.label}
                  </Link>
                </p>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <div className={HELP_PAGE_LAYOUT.contentGrid}>
        <div className={cn("min-w-0 space-y-6", "max-w-[42rem] lg:max-w-none")}>
          <p className={cn("m-0", OPERATOR_TYPOGRAPHY.body)} data-testid="help-path-chooser-overview">
            {PATH_CHOOSER_HELP_OVERVIEW}
          </p>

          <aside
            className="rounded-md border border-neutral-200 bg-white p-3 dark:border-neutral-800 dark:bg-neutral-950"
            data-testid="help-path-chooser-claim-discipline"
          >
            <h2 className={cn("m-0 text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}>Claim discipline</h2>
            <p className={cn("m-0 mt-2", OPERATOR_TYPOGRAPHY.body)}>{PATH_CHOOSER_HELP_CLAIM_DISCIPLINE}</p>
          </aside>

          <div className={HELP_PAGE_LAYOUT.contentColumn} data-testid="help-path-chooser-content">
            <MarketingAccessibilityMarkdownFragment
              markdownBody={markdown}
              tableCaption={`${entry.title} reference table`}
              presentation="help"
              sourceDocPath={sourceDocPath}
              helpTopicSlug={entry.slug}
            />
          </div>
        </div>

        <HelpTopicTableOfContents headings={headings} />
      </div>
    </article>
  );
}
