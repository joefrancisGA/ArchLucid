import Link from "next/link";

import { HelpGlossaryClaimOrientationStrip } from "@/app/(operator)/help/_sections/HelpGlossaryClaimOrientationStrip";
import { HelpGlossaryHeaderActions } from "@/app/(operator)/help/_sections/HelpGlossaryHeaderActions";
import { HelpGlossaryPageClient } from "@/app/(operator)/help/_sections/HelpGlossaryPageClient";
import { HelpTopicHashScroll } from "@/app/(operator)/help/HelpTopicHashScroll";
import { GlossaryProceduralHelpVocabularyRail } from "@/components/GlossaryProceduralHelpVocabularyRail";
import { HelpTopicGuidePageHeader } from "@/components/help/HelpTopicGuidePageHeader";
import { Button } from "@/components/ui/button";
import { OPERATOR_BODY_INLINE_LINK_CLASS, OPERATOR_LAYOUT, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";
import {
  GLOSSARY_HELP_CANONICAL_PATH,
  GLOSSARY_HELP_HEADER_CLAIM_DISCIPLINE,
} from "@/lib/glossary-help-evidence-copy";
import {
  GLOSSARY_HELP_ACTION_PANEL_INTRO,
  GLOSSARY_HELP_ACTION_PANEL_TITLE,
  GLOSSARY_HELP_PRIMARY_ACTIONS,
} from "@/lib/glossary-help-guide-content";
import {
  GLOSSARY_HELP_FIRST_VIEWPORT_TEST_ID,
  GLOSSARY_HELP_HEADER_CLAIM_DISCIPLINE_TEST_ID,
  GLOSSARY_HELP_PRIMARY_CONTENT_ID,
  GLOSSARY_HELP_SKIP_LINK_LABEL,
  GLOSSARY_HELP_SKIP_TARGET_ID,
} from "@/lib/glossary-help-page-copy";
import { HELP_PAGE_LAYOUT } from "@/lib/help/help-page-layout";
import type { ProductDocumentationEntry } from "@/lib/product-documentation-registry";
import { cn } from "@/lib/utils";
import { operatorPageContainerClass } from "@/components/operator/OperatorPageContainer";

type HelpGlossaryPageViewProps = {
  readonly entry: ProductDocumentationEntry;
};

/** Customer-facing glossary for `/help/glossary`. */
export function HelpGlossaryPageView(props: HelpGlossaryPageViewProps): React.ReactElement {
  const { entry } = props;
  const buyerPolishedShell = isBuyerPolishedOperatorShellEnv();

  return (
    <article
      className={cn(operatorPageContainerClass("workflow"), OPERATOR_LAYOUT.majorSectionGap)}
      data-testid="help-glossary-page"
    >
      <a href={`#${GLOSSARY_HELP_SKIP_TARGET_ID}`} className={HELP_PAGE_LAYOUT.technicalReferenceSkipLink}>
        {GLOSSARY_HELP_SKIP_LINK_LABEL}
      </a>
      <HelpTopicHashScroll />

      <div
        id={GLOSSARY_HELP_PRIMARY_CONTENT_ID}
        data-testid={GLOSSARY_HELP_PRIMARY_CONTENT_ID}
        className={cn("scroll-mt-24 space-y-6", OPERATOR_LAYOUT.sectionStack)}
      >
        <HelpTopicGuidePageHeader
          title={entry.title}
          titleTestId="help-topic-page-title"
          subtitle={entry.summary}
          navHref={GLOSSARY_HELP_CANONICAL_PATH}
          headingLevel="h1"
          claimDiscipline={GLOSSARY_HELP_HEADER_CLAIM_DISCIPLINE}
          claimDisciplineTestId={GLOSSARY_HELP_HEADER_CLAIM_DISCIPLINE_TEST_ID}
          actions={<HelpGlossaryHeaderActions entry={entry} />}
        />

        <div
          id={GLOSSARY_HELP_SKIP_TARGET_ID}
          data-testid={GLOSSARY_HELP_FIRST_VIEWPORT_TEST_ID}
          className={cn(
            "scroll-mt-24 space-y-4 border-b border-neutral-200 pb-6 dark:border-neutral-800",
            OPERATOR_LAYOUT.sectionStack,
          )}
        >
          <section
            aria-labelledby="help-glossary-action-panel-heading"
            className="space-y-3 rounded-md border border-neutral-200 bg-neutral-50/80 p-4 dark:border-neutral-700 dark:bg-neutral-900/40"
            data-testid="help-glossary-action-panel"
          >
            <h2
              id="help-glossary-action-panel-heading"
              className={cn("m-0 text-al-text-primary", OPERATOR_TYPOGRAPHY.sectionTitle)}
            >
              {GLOSSARY_HELP_ACTION_PANEL_TITLE}
            </h2>
            <p className={cn("m-0 max-w-prose text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
              {GLOSSARY_HELP_ACTION_PANEL_INTRO}
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <Button asChild size="sm" variant="primary">
                <Link href={GLOSSARY_HELP_PRIMARY_ACTIONS.openReviews.href}>
                  {GLOSSARY_HELP_PRIMARY_ACTIONS.openReviews.label}
                </Link>
              </Button>
              <Button asChild size="sm" variant="outline">
                <Link href={GLOSSARY_HELP_PRIMARY_ACTIONS.openFindingsGuide.href}>
                  {GLOSSARY_HELP_PRIMARY_ACTIONS.openFindingsGuide.label}
                </Link>
              </Button>
              <Link
                className={OPERATOR_BODY_INLINE_LINK_CLASS}
                href={GLOSSARY_HELP_PRIMARY_ACTIONS.openFirstReviewGuide.href}
              >
                {GLOSSARY_HELP_PRIMARY_ACTIONS.openFirstReviewGuide.label}
              </Link>
            </div>
          </section>
        </div>

        {buyerPolishedShell ? null : <GlossaryProceduralHelpVocabularyRail currentSurfaceId="glossary" />}

        <HelpGlossaryPageClient />

        <div data-testid="help-glossary-orientation-bottom">
          <HelpGlossaryClaimOrientationStrip />
        </div>
      </div>
    </article>
  );
}
