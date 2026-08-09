import Link from "next/link";

import { HelpTopicHashScroll } from "@/app/(operator)/help/HelpTopicHashScroll";
import { HelpTopicPdfDownloadButton } from "@/components/help/HelpTopicPdfDownloadButton";
import { HelpTopicPrintButton } from "@/components/help/HelpTopicPrintButton";
import { HelpTopicTableOfContents } from "@/components/help/HelpTopicTableOfContents";
import { CollapsibleSection } from "@/components/CollapsibleSection";
import { OperatorPageHeader } from "@/components/OperatorPageHeader";
import { PageContextualHelpButton } from "@/components/usability/PageContextualHelpButton";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ACCELERATOR_CHOOSER_ENTRIES } from "@/lib/accelerator-chooser";
import {
  ACCELERATOR_CHOOSER_HELP_OUT_OF_SCOPE,
  ACCELERATOR_CHOOSER_HELP_OVERVIEW,
  ACCELERATOR_CHOOSER_HELP_PAGE_SUBTITLE,
  ACCELERATOR_CHOOSER_HELP_PAGE_TITLE,
  ACCELERATOR_CHOOSER_HELP_PRIMARY_ACTIONS,
  ACCELERATOR_CHOOSER_HELP_PREREQUISITE,
  ACCELERATOR_CHOOSER_HELP_WORKFLOW_STEPS,
  ACCELERATOR_CHOOSER_HELP_CLAIM_DISCIPLINE_COPY,
} from "@/lib/accelerator-chooser-help-guide-content";
import { ACCELERATOR_CHOOSER_HELP_PATH } from "@/lib/accelerator-chooser-help-route";
import {
  DESIGN_TOKENS,
  OPERATOR_CARD,
  OPERATOR_LAYOUT,
  OPERATOR_LINK,
  OPERATOR_TYPOGRAPHY,
} from "@/lib/design-tokens";
import type { HelpMarkdownHeading } from "@/lib/help-markdown-headings";
import { HELP_PAGE_LAYOUT } from "@/lib/help-page-layout";
import type { ProductDocumentationEntry } from "@/lib/product-documentation-registry";
import { cn } from "@/lib/utils";

type HelpAcceleratorChooserGuideViewProps = {
  readonly entry: ProductDocumentationEntry;
};

const ACCELERATOR_CHOOSER_GUIDE_HEADINGS: readonly HelpMarkdownHeading[] = [
  { level: 2, id: "accelerator-packs", title: "Accelerator packs" },
  { level: 2, id: "how-to-start", title: "How to start" },
  { level: 2, id: "claim-discipline", title: "Claim discipline" },
  { level: 2, id: "out-of-scope", title: "Out of scope" },
];

/** Buyer-safe accelerator pack chooser for `/help/accelerator-chooser` (TB-1604). */
export function HelpAcceleratorChooserGuideView(
  props: HelpAcceleratorChooserGuideViewProps,
): React.ReactElement {
  const { entry } = props;

  return (
    <article
      className={cn(OPERATOR_LAYOUT.majorSectionGap, "w-full max-w-[72rem]")}
      data-testid="help-accelerator-chooser-guide"
    >
      <HelpTopicHashScroll />

      <OperatorPageHeader
        title={ACCELERATOR_CHOOSER_HELP_PAGE_TITLE}
        titleTestId="help-accelerator-chooser-page-title"
        subtitle={ACCELERATOR_CHOOSER_HELP_PAGE_SUBTITLE}
        navHref={ACCELERATOR_CHOOSER_HELP_PATH}
        actions={
          <div className="flex flex-wrap items-center gap-2" data-testid="help-accelerator-chooser-header-actions">
            <PageContextualHelpButton />
            <HelpTopicPdfDownloadButton entry={entry} />
            <HelpTopicPrintButton entry={entry} />
          </div>
        }
      />

      <div className="space-y-4 border-b border-neutral-200 pb-6 dark:border-neutral-800">
        <Card
          className="border-teal-200/80 bg-teal-50/40 dark:border-teal-900/50 dark:bg-teal-950/20"
          data-testid="help-accelerator-chooser-action-panel"
        >
          <CardHeader className={OPERATOR_CARD.header}>
            <CardTitle className={cn("text-lg", OPERATOR_TYPOGRAPHY.sectionTitle)}>Before you pick a pack</CardTitle>
          </CardHeader>
          <CardContent className={cn(OPERATOR_CARD.content, "space-y-3")}>
            <p className={cn("m-0 max-w-3xl text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
              {ACCELERATOR_CHOOSER_HELP_PREREQUISITE}
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <Button asChild size="sm" variant="primary">
                <Link href={ACCELERATOR_CHOOSER_HELP_PRIMARY_ACTIONS.firstPilotPath.href}>
                  {ACCELERATOR_CHOOSER_HELP_PRIMARY_ACTIONS.firstPilotPath.label}
                </Link>
              </Button>
              <Button asChild size="sm" variant="outline">
                <Link href={ACCELERATOR_CHOOSER_HELP_PRIMARY_ACTIONS.pathChooser.href}>
                  {ACCELERATOR_CHOOSER_HELP_PRIMARY_ACTIONS.pathChooser.label}
                </Link>
              </Button>
              <Link
                href={ACCELERATOR_CHOOSER_HELP_PRIMARY_ACTIONS.startReview.href}
                className={cn(
                  "text-sm underline-offset-2 hover:underline",
                  DESIGN_TOKENS.accent.link,
                  OPERATOR_TYPOGRAPHY.body,
                )}
              >
                {ACCELERATOR_CHOOSER_HELP_PRIMARY_ACTIONS.startReview.label}
              </Link>
            </div>
          </CardContent>
        </Card>

        <section
          aria-labelledby="help-accelerator-chooser-packs-heading"
          data-testid="help-accelerator-chooser-packs"
          id="accelerator-packs"
        >
          <h2
            id="help-accelerator-chooser-packs-heading"
            className={cn("m-0 text-al-text-primary", OPERATOR_TYPOGRAPHY.sectionTitle)}
          >
            Accelerator packs
          </h2>
          <p className={cn("m-0 mt-1 max-w-3xl text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
            {ACCELERATOR_CHOOSER_HELP_OVERVIEW}
          </p>
          <ul className="m-0 mt-3 grid list-none gap-3 p-0 sm:grid-cols-2">
            {ACCELERATOR_CHOOSER_ENTRIES.map((packEntry) => (
              <li
                key={packEntry.id}
                className="rounded-md border border-neutral-200 bg-white p-3 dark:border-neutral-800 dark:bg-neutral-950"
                data-testid={`help-accelerator-chooser-pack-${packEntry.id}`}
              >
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className={cn("m-0 text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}>
                    {packEntry.buyerJob}
                  </h3>
                </div>
                <p className={cn("m-0 mt-1 font-medium text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
                  {packEntry.packLabel}
                </p>
                <p className={cn("m-0 mt-1 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>{packEntry.summary}</p>
                <p className={cn("m-0 mt-2 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
                  <span className="font-medium text-al-text-primary">When not to use: </span>
                  {packEntry.doNotUseWhen}
                </p>
                <CollapsibleSection
                  title="Technical inputs and outputs"
                  summaryAriaLabel={`Technical inputs and outputs for ${packEntry.buyerJob}`}
                  sectionTestId={`help-accelerator-chooser-pack-${packEntry.id}-technical`}
                >
                  <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
                    <span className="font-medium text-al-text-primary">Inputs: </span>
                    {packEntry.requiredInputs}
                  </p>
                  <p className={cn("m-0 mt-2 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
                    <span className="font-medium text-al-text-primary">Outputs: </span>
                    {packEntry.expectedOutputs}
                  </p>
                </CollapsibleSection>
                <Button asChild size="sm" variant="primary" className="mt-3">
                  <Link
                    href={packEntry.startHref}
                    data-testid={`help-accelerator-chooser-start-${packEntry.id}`}
                  >
                    Start with this pack
                  </Link>
                </Button>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <div className={HELP_PAGE_LAYOUT.contentGrid}>
        <div className={cn("min-w-0 space-y-6", "max-w-[42rem] lg:max-w-none")}>
          <section
            aria-labelledby="help-accelerator-chooser-workflow-heading"
            data-testid="help-accelerator-chooser-workflow"
            id="how-to-start"
          >
            <h2
              id="help-accelerator-chooser-workflow-heading"
              className={cn("m-0 text-al-text-primary", OPERATOR_TYPOGRAPHY.sectionTitle)}
            >
              How to start in the architect workspace
            </h2>
            <ol className="m-0 mt-3 list-none space-y-3 p-0">
              {ACCELERATOR_CHOOSER_HELP_WORKFLOW_STEPS.map((step) => (
                <li
                  key={step.stepNumber}
                  className="rounded-md border border-neutral-200 bg-white p-3 dark:border-neutral-800 dark:bg-neutral-950"
                  data-testid={`help-accelerator-chooser-step-${step.stepNumber}`}
                >
                  <p className={cn("m-0 font-semibold text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}>
                    {step.stepNumber}. {step.title}
                  </p>
                  <p className={cn("m-0 mt-1 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>{step.description}</p>
                  {step.href !== undefined && step.ctaLabel !== undefined ? (
                    <div className="mt-2 flex flex-wrap gap-2">
                      <Button asChild size="sm" variant="outline">
                        <Link href={step.href}>{step.ctaLabel}</Link>
                      </Button>
                      {step.stepNumber === 3 ? (
                        <Link
                          href={ACCELERATOR_CHOOSER_HELP_PRIMARY_ACTIONS.quickReview.href}
                          className={cn(OPERATOR_LINK.inline, OPERATOR_TYPOGRAPHY.helper)}
                        >
                          {ACCELERATOR_CHOOSER_HELP_PRIMARY_ACTIONS.quickReview.label}
                        </Link>
                      ) : null}
                    </div>
                  ) : null}
                </li>
              ))}
            </ol>
          </section>

          <aside
            className="rounded-md border border-neutral-200 bg-white p-3 dark:border-neutral-800 dark:bg-neutral-950"
            data-testid="help-accelerator-chooser-claim-discipline"
            id="claim-discipline"
          >
            <h2 className={cn("m-0 text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}>Claim discipline</h2>
            <p className={cn("m-0 mt-2", OPERATOR_TYPOGRAPHY.body)}>{ACCELERATOR_CHOOSER_HELP_CLAIM_DISCIPLINE_COPY}</p>
          </aside>

          <aside
            className="rounded-md border border-neutral-200 bg-neutral-50/80 p-3 dark:border-neutral-700 dark:bg-neutral-900/40"
            data-testid="help-accelerator-chooser-out-of-scope"
            id="out-of-scope"
          >
            <h2 className={cn("m-0 text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}>Out of scope</h2>
            <p className={cn("m-0 mt-2 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
              {ACCELERATOR_CHOOSER_HELP_OUT_OF_SCOPE}
            </p>
          </aside>
        </div>

        <HelpTopicTableOfContents headings={ACCELERATOR_CHOOSER_GUIDE_HEADINGS} />
      </div>
    </article>
  );
}
