import Link from "next/link";

import { HelpGlossaryPageClient } from "@/app/(operator)/help/_sections/HelpGlossaryPageClient";
import { HelpTopicMarkdownPageHeader } from "@/app/(operator)/help/_sections/HelpTopicMarkdownPageHeader";
import { GlossaryHelpEvidenceOrientationStrip } from "@/components/help/GlossaryHelpEvidenceOrientationStrip";
import { GlossaryProceduralHelpVocabularyRail } from "@/components/GlossaryProceduralHelpVocabularyRail";
import { HelpTopicHashScroll } from "@/app/(operator)/help/HelpTopicHashScroll";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  GLOSSARY_HELP_ACTION_PANEL_INTRO,
  GLOSSARY_HELP_ACTION_PANEL_TITLE,
  GLOSSARY_HELP_PRIMARY_ACTIONS,
} from "@/lib/glossary-help-guide-content";
import { OPERATOR_CARD, OPERATOR_LAYOUT, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { HELP_PAGE_LAYOUT } from "@/lib/help-page-layout";
import type { ProductDocumentationEntry } from "@/lib/product-documentation-registry";
import { cn } from "@/lib/utils";

type HelpGlossaryPageViewProps = {
  readonly entry: ProductDocumentationEntry;
};

/** Customer-facing glossary for `/help/glossary`. */
export function HelpGlossaryPageView(props: HelpGlossaryPageViewProps): React.ReactElement {
  return (
    <article
      className={cn(OPERATOR_LAYOUT.majorSectionGap, "w-full max-w-[68rem]")}
      data-testid="help-glossary-page"
    >
      <HelpTopicHashScroll />
      <header className={cn(HELP_PAGE_LAYOUT.articleHeader, "space-y-4 pb-4")}>
        <HelpTopicMarkdownPageHeader entry={props.entry} showContextualHelp />
        <Card
          className="border-teal-200/80 bg-teal-50/40 dark:border-teal-900/50 dark:bg-teal-950/20"
          data-testid="help-glossary-action-panel"
        >
          <CardHeader className={OPERATOR_CARD.header}>
            <CardTitle as="h2" className={cn("text-lg", OPERATOR_TYPOGRAPHY.sectionTitle)}>
              {GLOSSARY_HELP_ACTION_PANEL_TITLE}
            </CardTitle>
          </CardHeader>
          <CardContent className={cn(OPERATOR_CARD.content, "space-y-3")}>
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
                className={cn("text-sm font-medium text-teal-700 underline-offset-2 hover:underline dark:text-teal-400")}
                href={GLOSSARY_HELP_PRIMARY_ACTIONS.openFirstReviewGuide.href}
              >
                {GLOSSARY_HELP_PRIMARY_ACTIONS.openFirstReviewGuide.label}
              </Link>
            </div>
          </CardContent>
        </Card>
        <GlossaryHelpEvidenceOrientationStrip />
        <GlossaryProceduralHelpVocabularyRail currentSurfaceId="glossary" />
      </header>
      <HelpGlossaryPageClient />
    </article>
  );
}
