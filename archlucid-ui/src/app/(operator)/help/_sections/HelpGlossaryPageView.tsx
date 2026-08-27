import Link from "next/link";

import { HelpGlossaryPageClient } from "@/app/(operator)/help/_sections/HelpGlossaryPageClient";
import { HelpTopicMarkdownPageHeader } from "@/app/(operator)/help/_sections/HelpTopicMarkdownPageHeader";
import { GlossaryHelpEvidenceOrientationStrip } from "@/components/help/GlossaryHelpEvidenceOrientationStrip";
import { GlossaryProceduralHelpVocabularyRail } from "@/components/GlossaryProceduralHelpVocabularyRail";
import { HelpTopicHashScroll } from "@/app/(operator)/help/HelpTopicHashScroll";
import { Button } from "@/components/ui/button";
import {
  GLOSSARY_HELP_ACTION_PANEL_INTRO,
  GLOSSARY_HELP_ACTION_PANEL_TITLE,
  GLOSSARY_HELP_PRIMARY_ACTIONS,
} from "@/lib/glossary-help-guide-content";
import { OPERATOR_BODY_INLINE_LINK_CLASS, OPERATOR_LAYOUT, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { HELP_PAGE_LAYOUT } from "@/lib/help/help-page-layout";
import type { ProductDocumentationEntry } from "@/lib/product-documentation-registry";
import { cn } from "@/lib/utils";
import { operatorPageContainerClass } from "@/components/operator/OperatorPageContainer";

type HelpGlossaryPageViewProps = {
  readonly entry: ProductDocumentationEntry;
};

/** Customer-facing glossary for `/help/glossary`. */
export function HelpGlossaryPageView(props: HelpGlossaryPageViewProps): React.ReactElement {
  return (
    <article
      className={cn(operatorPageContainerClass("workflow"), OPERATOR_LAYOUT.majorSectionGap)}
      data-testid="help-glossary-page"
    >
      <HelpTopicHashScroll />
      <header className={cn(HELP_PAGE_LAYOUT.articleHeader, "space-y-4 pb-4")}>
        <HelpTopicMarkdownPageHeader entry={props.entry} showContextualHelp />
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
        <GlossaryHelpEvidenceOrientationStrip />
        <GlossaryProceduralHelpVocabularyRail currentSurfaceId="glossary" />
      </header>
      <HelpGlossaryPageClient />
    </article>
  );
}
