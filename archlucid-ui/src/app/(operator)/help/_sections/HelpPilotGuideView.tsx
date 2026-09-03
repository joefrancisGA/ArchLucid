import Link from "next/link";

import { HelpPilotGuideClaimOrientationStrip } from "@/app/(operator)/help/_sections/HelpPilotGuideClaimOrientationStrip";
import { HelpPilotGuideHeaderActions } from "@/app/(operator)/help/_sections/HelpPilotGuideHeaderActions";
import { HelpTopicHashScroll } from "@/app/(operator)/help/HelpTopicHashScroll";
import { HelpTopicGuidePageHeader } from "@/components/help/HelpTopicGuidePageHeader";
import { HelpTopicRegistryProvenanceLine } from "@/components/help/HelpTopicRegistryProvenanceLine";
import { HelpTopicTableOfContents } from "@/components/help/HelpTopicTableOfContents";
import { PilotGuideGettingStartedFirstReviewVocabularyRail } from "@/components/PilotGuideGettingStartedFirstReviewVocabularyRail";
import { MarketingAccessibilityMarkdownFragment } from "@/components/marketing/MarketingAccessibilityMarkdownFragment";
import {
  DESIGN_TOKENS,
  OPERATOR_LAYOUT,
  OPERATOR_TYPOGRAPHY,
} from "@/lib/design-tokens";
import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";
import { extractHelpMarkdownHeadings } from "@/lib/help/help-markdown-headings";
import { prepareHelpMarkdownForPresentation } from "@/lib/help/help-markdown-presentation";
import { HELP_PAGE_LAYOUT } from "@/lib/help/help-page-layout";
import type { ProductDocumentationEntry } from "@/lib/product-documentation-registry";
import { PILOT_GUIDE_HELP_CLAIM_DISCIPLINE } from "@/lib/pilot-guide-help-evidence-copy";
import {
  PILOT_GUIDE_HELP_OVERVIEW,
  PILOT_GUIDE_HELP_PAGE_SUBTITLE,
  PILOT_GUIDE_HELP_PAGE_TITLE,
  PILOT_GUIDE_HELP_PATH,
  PILOT_GUIDE_HELP_PRIMARY_ACTIONS,
} from "@/lib/pilot-guide-help-guide-content";
import {
  PILOT_GUIDE_HELP_FIRST_VIEWPORT_TEST_ID,
  PILOT_GUIDE_HELP_HEADER_CLAIM_DISCIPLINE_TEST_ID,
  PILOT_GUIDE_HELP_PRIMARY_CONTENT_ID,
  PILOT_GUIDE_HELP_SKIP_LINK_LABEL,
  PILOT_GUIDE_HELP_SKIP_TARGET_ID,
} from "@/lib/pilot-guide-help-page-copy";
import { cn } from "@/lib/utils";
import { operatorPageContainerClass } from "@/components/operator/OperatorPageContainer";

type HelpPilotGuideViewProps = {
  readonly entry: ProductDocumentationEntry;
  readonly markdown: string;
};

/** Specialty pilot orientation for `/help/pilot-guide` (HP). */
export function HelpPilotGuideView(props: HelpPilotGuideViewProps): React.ReactElement {
  const { entry, markdown } = props;
  const buyerPolishedShell = isBuyerPolishedOperatorShellEnv();
  const sourceDocPath = entry.sourcePaths[0] ?? "";
  const preparedMarkdown = prepareHelpMarkdownForPresentation(markdown, sourceDocPath, {
    helpTopicSlug: entry.slug,
  });
  const headings = extractHelpMarkdownHeadings(preparedMarkdown);
  const readingBodyClass = cn("m-0 max-w-3xl leading-relaxed", HELP_PAGE_LAYOUT.readingBody);

  return (
    <article
      className={cn(operatorPageContainerClass("workflow"), OPERATOR_LAYOUT.majorSectionGap)}
      data-testid="help-pilot-guide"
    >
      <a href={`#${PILOT_GUIDE_HELP_SKIP_TARGET_ID}`} className={HELP_PAGE_LAYOUT.technicalReferenceSkipLink}>
        {PILOT_GUIDE_HELP_SKIP_LINK_LABEL}
      </a>
      <HelpTopicHashScroll />

      <div
        id={PILOT_GUIDE_HELP_PRIMARY_CONTENT_ID}
        data-testid={PILOT_GUIDE_HELP_PRIMARY_CONTENT_ID}
        className={cn("scroll-mt-24 space-y-6", OPERATOR_LAYOUT.sectionStack)}
      >
        <HelpTopicGuidePageHeader
          title={PILOT_GUIDE_HELP_PAGE_TITLE}
          titleTestId="help-pilot-guide-page-title"
          subtitle={PILOT_GUIDE_HELP_PAGE_SUBTITLE}
          navHref={PILOT_GUIDE_HELP_PATH}
          headingLevel="h1"
          claimDiscipline={PILOT_GUIDE_HELP_CLAIM_DISCIPLINE}
          claimDisciplineTestId={PILOT_GUIDE_HELP_HEADER_CLAIM_DISCIPLINE_TEST_ID}
          metadata={
            buyerPolishedShell ? undefined : (
              <div className="space-y-2">
                <HelpTopicRegistryProvenanceLine entry={entry} />
                <div
                  className="flex flex-wrap items-center gap-x-4 gap-y-1"
                  data-testid="help-pilot-guide-related-links"
                >
                  <Link
                    href={PILOT_GUIDE_HELP_PRIMARY_ACTIONS.firstReviewGuide.href}
                    className={cn(
                      "text-sm underline-offset-2 hover:underline",
                      DESIGN_TOKENS.accent.link,
                      OPERATOR_TYPOGRAPHY.body,
                    )}
                  >
                    {PILOT_GUIDE_HELP_PRIMARY_ACTIONS.firstReviewGuide.label}
                  </Link>
                  <Link
                    href={PILOT_GUIDE_HELP_PRIMARY_ACTIONS.gettingStarted.href}
                    className={cn(
                      "text-sm underline-offset-2 hover:underline",
                      DESIGN_TOKENS.accent.link,
                      OPERATOR_TYPOGRAPHY.body,
                    )}
                  >
                    {PILOT_GUIDE_HELP_PRIMARY_ACTIONS.gettingStarted.label}
                  </Link>
                </div>
              </div>
            )
          }
          actions={<HelpPilotGuideHeaderActions entry={entry} />}
        />

        {buyerPolishedShell ? null : (
          <PilotGuideGettingStartedFirstReviewVocabularyRail currentSurfaceId="pilot-guide" />
        )}

        <div
          id={PILOT_GUIDE_HELP_SKIP_TARGET_ID}
          data-testid={PILOT_GUIDE_HELP_FIRST_VIEWPORT_TEST_ID}
          className={cn(
            "scroll-mt-24 space-y-6 border-b border-neutral-200 pb-6 dark:border-neutral-800",
            OPERATOR_LAYOUT.sectionStack,
          )}
        >
          <p className={readingBodyClass} data-testid="help-pilot-guide-overview">
            {PILOT_GUIDE_HELP_OVERVIEW}
          </p>
        </div>

        <div className={HELP_PAGE_LAYOUT.contentGrid}>
          <div className={cn("min-w-0 space-y-6", "max-w-[42rem] lg:max-w-none")}>
            <div className={HELP_PAGE_LAYOUT.contentColumn} data-testid="help-pilot-guide-content">
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

        <div data-testid="help-pilot-guide-orientation-bottom">
          <HelpPilotGuideClaimOrientationStrip />
        </div>
      </div>
    </article>
  );
}
