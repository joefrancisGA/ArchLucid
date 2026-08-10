"use client";

import Link from "next/link";

import { HelpTopicHashScroll } from "@/app/(operator)/help/HelpTopicHashScroll";
import { HelpAcceleratorChooserHeaderActions } from "@/app/(operator)/help/_sections/HelpAcceleratorChooserHeaderActions";
import { HelpAcceleratorChooserPrerequisitePanel } from "@/app/(operator)/help/_sections/HelpAcceleratorChooserPrerequisitePanel";
import { HelpAcceleratorChooserSourceLinks } from "@/app/(operator)/help/_sections/HelpAcceleratorChooserSourceLinks";
import { HelpTopicTableOfContents } from "@/components/help/HelpTopicTableOfContents";
import { CollapsibleSection } from "@/components/CollapsibleSection";
import { OperatorPageHeader } from "@/components/OperatorPageHeader";
import { PageContextualHelpButton } from "@/components/usability/PageContextualHelpButton";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { HelpAcceleratorCostGovernancePackCard } from "@/components/accelerator/HelpAcceleratorCostGovernancePackCard";
import { useAcceleratorChooserPrerequisitePresentation } from "@/hooks/use-accelerator-chooser-prerequisite-presentation";
import { buildAcceleratorChooserGridItems } from "@/lib/accelerator-chooser-grid";
import type { AcceleratorChooserEntry } from "@/lib/accelerator-chooser";
import {
  ACCELERATOR_CHOOSER_HELP_OVERVIEW,
  ACCELERATOR_CHOOSER_HELP_PAGE_SUBTITLE,
  ACCELERATOR_CHOOSER_HELP_PAGE_TITLE,
  ACCELERATOR_CHOOSER_HELP_WORKFLOW_STEPS,
  ACCELERATOR_CHOOSER_HELP_CLAIM_DISCIPLINE_COPY,
} from "@/lib/accelerator-chooser-help-guide-content";
import { ACCELERATOR_CHOOSER_HELP_SOURCES_INTRO } from "@/lib/accelerator-chooser-help-evidence-copy";
import { ACCELERATOR_CHOOSER_HELP_PATH } from "@/lib/accelerator-chooser-help-route";
import { buildAcceleratorPackStartAriaLabel } from "@/lib/accelerator-chooser-pack-start-aria-label";
import {
  ACCELERATOR_GREENFIELD_PACK_ID,
  ACCELERATOR_PACK_PREREQUISITE_BLOCKED_MESSAGE,
  isAcceleratorPackBlockedByPrerequisite,
} from "@/lib/accelerator-chooser-pack-prerequisite";
import { ACCELERATOR_JOB_CHOOSER_REQUIRED_INPUTS_LABEL } from "@/lib/accelerator-chooser-start-copy";
import {
  OPERATOR_CARD,
  OPERATOR_LAYOUT,
  OPERATOR_LINK,
  OPERATOR_TYPOGRAPHY,
} from "@/lib/design-tokens";
import type { HelpMarkdownHeading } from "@/lib/help-markdown-headings";
import { HELP_PAGE_LAYOUT } from "@/lib/help-page-layout";
import {
  inAppHelpHref,
  type ProductDocumentationEntry,
} from "@/lib/product-documentation-registry";
import type { AcceleratorChooserPrerequisiteStatus } from "@/lib/resolve-accelerator-chooser-prerequisite-status";
import { cn } from "@/lib/utils";

type HelpAcceleratorChooserGuideViewProps = {
  readonly entry: ProductDocumentationEntry;
};

const ACCELERATOR_CHOOSER_GUIDE_HEADINGS: readonly HelpMarkdownHeading[] = [
  { level: 2, id: "sources", title: "Sources" },
  { level: 2, id: "accelerator-packs", title: "Accelerator packs" },
  { level: 2, id: "how-to-start", title: "How to start" },
  { level: 2, id: "claim-discipline", title: "Claim discipline" },
];

function resolveRequiredInputsHelpHref(packEntry: AcceleratorChooserEntry): string {
  if (packEntry.id === ACCELERATOR_GREENFIELD_PACK_ID) {
    return inAppHelpHref("getting-started");
  }

  return inAppHelpHref("evidence-intake");
}

type AcceleratorChooserPackCardProps = {
  readonly packEntry: AcceleratorChooserEntry;
  readonly prerequisiteStatus: AcceleratorChooserPrerequisiteStatus;
};

function AcceleratorChooserPackCard(props: AcceleratorChooserPackCardProps): React.ReactElement {
  const { packEntry, prerequisiteStatus } = props;
  const blocked = isAcceleratorPackBlockedByPrerequisite(prerequisiteStatus, packEntry.id);
  const hasTechnicalInputs = packEntry.technicalInputs !== undefined;

  return (
    <li
      className="rounded-md border border-neutral-200 bg-white p-3 dark:border-neutral-800 dark:bg-neutral-950"
      data-testid={`help-accelerator-chooser-pack-${packEntry.id}`}
    >
      <h3 className={cn("m-0 text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}>
        {packEntry.buyerJob}
      </h3>
      <p className={cn("m-0 mt-1 font-medium text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
        {packEntry.packLabel}
      </p>
      <p className={cn("m-0 mt-1 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>{packEntry.summary}</p>
      <p className={cn("m-0 mt-2 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
        <span className="font-medium text-al-text-primary">
          {ACCELERATOR_JOB_CHOOSER_REQUIRED_INPUTS_LABEL}:{" "}
        </span>
        <Link href={resolveRequiredInputsHelpHref(packEntry)} className={OPERATOR_LINK.inline}>
          {packEntry.requiredInputs}
        </Link>
      </p>
      <p className={cn("m-0 mt-2 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
        <span className="font-medium text-al-text-primary">When not to use: </span>
        {packEntry.doNotUseWhen}
      </p>
      <CollapsibleSection
        title="Technical outputs and file detail"
        summaryAriaLabel={`Technical outputs and file detail for ${packEntry.buyerJob}`}
        sectionTestId={`help-accelerator-chooser-pack-${packEntry.id}-technical`}
      >
        {hasTechnicalInputs ? (
          <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
            <span className="font-medium text-al-text-primary">Inputs: </span>
            {packEntry.technicalInputs}
          </p>
        ) : null}
        <p
          className={cn(
            hasTechnicalInputs ? "m-0 mt-2" : "m-0",
            "text-al-text-secondary",
            OPERATOR_TYPOGRAPHY.helper,
          )}
        >
          <span className="font-medium text-al-text-primary">Outputs: </span>
          {packEntry.expectedOutputs}
        </p>
      </CollapsibleSection>
      {blocked ? (
        <>
          <p
            className={cn("m-0 mt-3 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}
            data-testid={`help-accelerator-chooser-pack-${packEntry.id}-blocked`}
          >
            {ACCELERATOR_PACK_PREREQUISITE_BLOCKED_MESSAGE}
          </p>
          <Button size="sm" variant="outline" className="mt-3" disabled>
            Start with this pack
          </Button>
        </>
      ) : (
        <Button asChild size="sm" variant="outline" className="mt-3">
          <Link
            href={packEntry.startHref}
            data-testid={`help-accelerator-chooser-start-${packEntry.id}`}
            aria-label={buildAcceleratorPackStartAriaLabel(packEntry.packLabel, packEntry.buyerJob)}
          >
            Start with this pack
          </Link>
        </Button>
      )}
    </li>
  );
}

/** Buyer-safe accelerator pack chooser for `/help/accelerator-chooser` (TB-1604). */
export function HelpAcceleratorChooserGuideView(
  props: HelpAcceleratorChooserGuideViewProps,
): React.ReactElement {
  const { entry } = props;
  const presentation = useAcceleratorChooserPrerequisitePresentation();

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
          <div className="flex flex-wrap items-center gap-2">
            <PageContextualHelpButton />
            <HelpAcceleratorChooserHeaderActions entry={entry} />
          </div>
        }
      />

      <div className="space-y-4 border-b border-neutral-200 pb-6 dark:border-neutral-800">
        <HelpAcceleratorChooserPrerequisitePanel presentation={presentation} />

        <section
          aria-labelledby="help-accelerator-chooser-sources-heading"
          data-testid="help-accelerator-chooser-sources"
          id="sources"
        >
          <Card className="border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-950">
            <CardHeader className={OPERATOR_CARD.header}>
              <h2
                id="help-accelerator-chooser-sources-heading"
                className={cn("m-0 text-lg", OPERATOR_TYPOGRAPHY.sectionTitle)}
              >
                Sources
              </h2>
              <p className={cn("m-0 max-w-3xl text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
                {ACCELERATOR_CHOOSER_HELP_SOURCES_INTRO}
              </p>
            </CardHeader>
            <CardContent className={OPERATOR_CARD.content}>
              <HelpAcceleratorChooserSourceLinks />
            </CardContent>
          </Card>
        </section>

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
            {buildAcceleratorChooserGridItems().map((gridItem) => {
              if (gridItem.kind === "cost-governance-group") {
                return (
                  <HelpAcceleratorCostGovernancePackCard
                    key="cost-governance-group"
                    prerequisiteStatus={presentation.status}
                  />
                );
              }

              return (
                <AcceleratorChooserPackCard
                  key={gridItem.entry.id}
                  packEntry={gridItem.entry}
                  prerequisiteStatus={presentation.status}
                />
              );
            })}
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
            <ol className={cn("m-0 mt-3 list-decimal space-y-2 pl-5", OPERATOR_TYPOGRAPHY.body)}>
              {ACCELERATOR_CHOOSER_HELP_WORKFLOW_STEPS.map((step) => (
                <li
                  key={step.stepNumber}
                  className="text-al-text-secondary"
                  data-testid={`help-accelerator-chooser-step-${step.stepNumber}`}
                >
                  <span className="font-semibold text-al-text-primary">{step.title}. </span>
                  {step.description}{" "}
                  <Link href={step.href} className={cn(OPERATOR_LINK.inline, OPERATOR_TYPOGRAPHY.helper)}>
                    {step.ctaLabel}
                  </Link>
                </li>
              ))}
            </ol>
          </section>

          <aside
            className="rounded-md border border-neutral-200 bg-white p-3 dark:border-neutral-800 dark:bg-neutral-950"
            data-testid="help-accelerator-chooser-claim-discipline"
            id="claim-discipline"
          >
            <h2 className={cn("m-0 text-al-text-primary", OPERATOR_TYPOGRAPHY.sectionTitle)}>Claim discipline</h2>
            <p className={cn("m-0 mt-2", OPERATOR_TYPOGRAPHY.body)}>{ACCELERATOR_CHOOSER_HELP_CLAIM_DISCIPLINE_COPY}</p>
          </aside>
        </div>

        <HelpTopicTableOfContents headings={ACCELERATOR_CHOOSER_GUIDE_HEADINGS} />
      </div>
    </article>
  );
}
