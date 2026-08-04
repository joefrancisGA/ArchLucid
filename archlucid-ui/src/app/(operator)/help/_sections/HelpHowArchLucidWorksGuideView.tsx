import Link from "next/link";

import { HowArchLucidWorksEvidenceOrientationStrip } from "@/app/(operator)/help/_sections/HowArchLucidWorksEvidenceOrientationStrip";
import { HelpTopicHashScroll } from "@/app/(operator)/help/HelpTopicHashScroll";
import { HelpTopicTableOfContents } from "@/components/help/HelpTopicTableOfContents";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageContextualHelpButton } from "@/components/usability/PageContextualHelpButton";
import {
  HOW_ARCHLUCID_WORKS_DATA_HANDLING_HREF,
  HOW_ARCHLUCID_WORKS_DIAGRAM_STEPS,
  HOW_ARCHLUCID_WORKS_GUIDE_HEADINGS,
  HOW_ARCHLUCID_WORKS_PRIMARY_ACTIONS,
  HOW_ARCHLUCID_WORKS_SECTIONS,
  HOW_ARCHLUCID_WORKS_SUBTITLE,
} from "@/lib/how-archlucid-works-guide-content";
import { cn } from "@/lib/utils";
import {
  DESIGN_TOKENS,
  OPERATOR_CARD,
  OPERATOR_LAYOUT,
  OPERATOR_SHELL_SCROLL_OFFSET_CLASS,
  OPERATOR_TYPOGRAPHY,
} from "@/lib/design-tokens";
import { HELP_PAGE_LAYOUT } from "@/lib/help-page-layout";
import type { ProductDocumentationEntry } from "@/lib/product-documentation-registry";

type HelpHowArchLucidWorksGuideViewProps = {
  readonly entry: ProductDocumentationEntry;
};

function HelpSectionHeading(props: { readonly id: string; readonly children: string }): React.ReactElement {
  return (
    <h2
      id={props.id}
      className={cn(OPERATOR_SHELL_SCROLL_OFFSET_CLASS, OPERATOR_TYPOGRAPHY.sectionTitle, "m-0 mt-10 first:mt-0")}
    >
      {props.children}
    </h2>
  );
}

function WorkflowDiagram(): React.ReactElement {
  return (
    <div
      className="rounded-lg border border-neutral-200 bg-al-surface-raised p-4 dark:border-neutral-800"
      data-testid="how-archlucid-works-diagram"
    >
      <div className="flex flex-col items-stretch gap-3 xl:flex-row xl:items-center xl:justify-between">
        {HOW_ARCHLUCID_WORKS_DIAGRAM_STEPS.map((step, index) => (
          <div key={step} className="flex min-w-0 flex-1 items-center gap-2">
            <div
              className={cn(
                "min-h-[3.5rem] flex-1 rounded-md border border-teal-200/80 bg-teal-50/50 px-3 py-2 text-center text-sm font-medium dark:border-teal-900/60 dark:bg-teal-950/30",
                OPERATOR_TYPOGRAPHY.cardTitle,
              )}
            >
              {step}
            </div>
            {index < HOW_ARCHLUCID_WORKS_DIAGRAM_STEPS.length - 1 ? (
              <span aria-hidden className="hidden shrink-0 text-xl text-neutral-400 xl:inline">
                →
              </span>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}

/** Buyer-safe workflow guide for `/help/how-it-works`. */
export function HelpHowArchLucidWorksGuideView(props: HelpHowArchLucidWorksGuideViewProps): React.ReactElement {
  const { entry } = props;

  return (
    <article className={OPERATOR_LAYOUT.majorSectionGap} data-testid="help-how-archlucid-works-guide">
      <HelpTopicHashScroll />
      <header className={HELP_PAGE_LAYOUT.articleHeader}>
        <div className="flex flex-wrap items-center gap-2">
          <h1 className={cn("m-0", OPERATOR_TYPOGRAPHY.pageTitle)}>{entry.title}</h1>
          <PageContextualHelpButton />
        </div>
        <p className={cn("m-0 max-w-3xl", OPERATOR_TYPOGRAPHY.helper)}>{HOW_ARCHLUCID_WORKS_SUBTITLE}</p>
      </header>

      <HowArchLucidWorksEvidenceOrientationStrip />

      <div className={HELP_PAGE_LAYOUT.contentGrid}>
        <div className={cn(HELP_PAGE_LAYOUT.contentColumn, "space-y-6")}>
          <Card
            className={cn(
              "border-teal-200/80 bg-teal-50/40 dark:border-teal-900/50 dark:bg-teal-950/20",
            )}
            data-testid="how-archlucid-works-actions"
          >
            <CardHeader className={OPERATOR_CARD.header}>
              <CardTitle className={cn("text-lg", OPERATOR_TYPOGRAPHY.sectionTitle)}>Get started</CardTitle>
            </CardHeader>
            <CardContent className={cn(OPERATOR_CARD.content, "flex flex-wrap gap-2")}>
              <Button asChild size="sm" variant="primary">
                <Link href={HOW_ARCHLUCID_WORKS_PRIMARY_ACTIONS.startReview.href}>
                  {HOW_ARCHLUCID_WORKS_PRIMARY_ACTIONS.startReview.label}
                </Link>
              </Button>
              <Button asChild size="sm" variant="outline">
                <Link href={HOW_ARCHLUCID_WORKS_PRIMARY_ACTIONS.sampleReview.href}>
                  {HOW_ARCHLUCID_WORKS_PRIMARY_ACTIONS.sampleReview.label}
                </Link>
              </Button>
              <Button asChild size="sm" variant="outline">
                <Link href={HOW_ARCHLUCID_WORKS_PRIMARY_ACTIONS.firstReviewGuide.href}>
                  {HOW_ARCHLUCID_WORKS_PRIMARY_ACTIONS.firstReviewGuide.label}
                </Link>
              </Button>
            </CardContent>
          </Card>

          <section aria-labelledby="workflow-overview-heading" className="space-y-3">
            <HelpSectionHeading id="workflow-overview">Workflow overview</HelpSectionHeading>
            <p id="workflow-overview-heading" className={cn("m-0", OPERATOR_TYPOGRAPHY.body)}>
              Follow this path from evidence intake through governed exports.
            </p>
            <WorkflowDiagram />
          </section>

          <div className="space-y-8" data-testid="how-archlucid-works-sections">
            {HOW_ARCHLUCID_WORKS_SECTIONS.map((section, index) => (
              <section key={section.id} aria-labelledby={`${section.id}-heading`} className="space-y-2">
                <HelpSectionHeading id={section.id}>{section.title}</HelpSectionHeading>
                <p id={`${section.id}-heading`} className={cn("m-0", OPERATOR_TYPOGRAPHY.body)}>
                  {section.description}
                </p>
                {index === 0 ? (
                  <Button asChild size="sm" variant="outline">
                    <Link href={HOW_ARCHLUCID_WORKS_PRIMARY_ACTIONS.startReview.href}>
                      {HOW_ARCHLUCID_WORKS_PRIMARY_ACTIONS.startReview.label}
                    </Link>
                  </Button>
                ) : null}
              </section>
            ))}
          </div>

          <section aria-labelledby="data-handling-link-heading" className="space-y-2 border-t border-neutral-200 pt-8 dark:border-neutral-800">
            <HelpSectionHeading id="data-handling-link">Data handling</HelpSectionHeading>
            <p id="data-handling-link-heading" className={cn("m-0", OPERATOR_TYPOGRAPHY.body)}>
              Security and data-handling details are documented separately so workflow and diligence topics stay easy
              to scan.
            </p>
            <Link
              href={HOW_ARCHLUCID_WORKS_DATA_HANDLING_HREF}
              className={cn("font-medium underline-offset-2 hover:underline", DESIGN_TOKENS.accent.link)}
            >
              What ArchLucid does with your data
            </Link>
          </section>
        </div>

        <HelpTopicTableOfContents headings={HOW_ARCHLUCID_WORKS_GUIDE_HEADINGS} />
      </div>
    </article>
  );
}
