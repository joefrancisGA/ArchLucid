"use client";

import Link from "next/link";

import { HelpTopicHashScroll } from "@/app/(operator)/help/HelpTopicHashScroll";
import { HelpTopicMarkdownPageHeader } from "@/app/(operator)/help/_sections/HelpTopicMarkdownPageHeader";
import { PilotGuideGettingStartedFirstReviewVocabularyRail } from "@/components/PilotGuideGettingStartedFirstReviewVocabularyRail";
import { HelpTopicBreadcrumb } from "@/components/help/HelpTopicBreadcrumb";
import { HelpLazyDetails } from "@/components/help/HelpLazyDetails";
import { HelpTopicTableOfContents } from "@/components/help/HelpTopicTableOfContents";
import { MermaidDiagram } from "@/components/help/MermaidDiagram";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusTag } from "@/components/ui/status-tag";
import {
  GETTING_STARTED_HELP_AUDIENCE_LINE,
  GETTING_STARTED_HELP_BREADCRUMB_TOPIC_TITLE,
  GETTING_STARTED_HELP_CLAIM_DISCIPLINE,
  GETTING_STARTED_HELP_DIAGRAM_SOURCE,
  GETTING_STARTED_HELP_DIAGRAM_STEPS,
  GETTING_STARTED_HELP_DIAGRAM_SUMMARY,
  GETTING_STARTED_HELP_DIAGRAM_TITLE,
  GETTING_STARTED_HELP_GUIDE_HEADINGS,
  GETTING_STARTED_HELP_NEXT_ACTION_CARDS,
  GETTING_STARTED_HELP_PIPELINE_DIAGRAM_DESCRIPTION,
  GETTING_STARTED_HELP_PIPELINE_TEXT_STAGES,
  GETTING_STARTED_HELP_PLAIN_LANGUAGE_TERMS,
  GETTING_STARTED_HELP_PRIMARY_ACTIONS,
  GETTING_STARTED_HELP_QUICK_START_COPY,
  GETTING_STARTED_HELP_QUICK_START_TITLE,
  GETTING_STARTED_HELP_TECHNICAL_DETAILS_BODY,
  GETTING_STARTED_HELP_TECHNICAL_DETAILS_TITLE,
  GETTING_STARTED_HELP_TECHNICAL_TERMS,
  GETTING_STARTED_HELP_WORKFLOW_STEPS,
  gettingStartedHelpPageSubtitle,
} from "@/lib/getting-started-help-guide-content";
import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";
import { cn } from "@/lib/utils";
import {
  DESIGN_TOKENS,
  OPERATOR_CARD,
  OPERATOR_LAYOUT,
  OPERATOR_LINK,
  OPERATOR_SHELL_SCROLL_OFFSET_CLASS,
  OPERATOR_TYPOGRAPHY,
} from "@/lib/design-tokens";
import { HELP_PAGE_LAYOUT } from "@/lib/help/help-page-layout";
import type { ProductDocumentationEntry } from "@/lib/product-documentation-registry";

type HelpGettingStartedGuideViewProps = {
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

function PlainLanguageTable(props: {
  readonly terms: readonly { readonly term: string; readonly definition: string }[];
  readonly testId: string;
}): React.ReactElement {
  return (
    <div className="overflow-x-auto rounded-md border border-neutral-200 dark:border-neutral-800" data-testid={props.testId}>
      <table className={cn("w-full border-collapse text-left", OPERATOR_TYPOGRAPHY.body)}>
        <thead>
          <tr className="border-b border-neutral-200 bg-neutral-50/80 dark:border-neutral-800 dark:bg-neutral-900/40">
            <th className="px-4 py-2 font-semibold text-al-text-primary">Term</th>
            <th className="px-4 py-2 font-semibold text-al-text-primary">Meaning</th>
          </tr>
        </thead>
        <tbody>
          {props.terms.map((row) => (
            <tr key={row.term} className="border-b border-neutral-100 last:border-b-0 dark:border-neutral-800">
              <td className="px-4 py-3 align-top font-medium text-al-text-primary">{row.term}</td>
              <td className="px-4 py-3 align-top text-al-text-secondary">{row.definition}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function GettingStartedNextActionLink(props: { readonly href: string; readonly label: string }): React.ReactElement {
  if (props.href.startsWith("#")) {
    return (
      <Link href={props.href} className={cn(OPERATOR_LINK.inline, OPERATOR_TYPOGRAPHY.body)}>
        {props.label}
      </Link>
    );
  }

  return (
    <Button asChild size="sm" variant="outline">
      <Link href={props.href}>{props.label}</Link>
    </Button>
  );
}

function HowArchLucidWorksDiagram(): React.ReactElement {
  return (
    <div
      className="rounded-lg border border-neutral-200 bg-al-surface-raised p-4 dark:border-neutral-800"
      data-testid="getting-started-mental-model-diagram"
    >
      <div className="flex flex-col items-stretch gap-3 lg:flex-row lg:items-center lg:justify-between">
        {GETTING_STARTED_HELP_DIAGRAM_STEPS.map((step, index) => (
          <div key={step} className="flex min-w-0 flex-1 items-center gap-3">
            <div
              className={cn(
                "min-h-[4.5rem] flex-1 rounded-md border border-neutral-200 bg-al-surface-raised px-4 py-3 text-center dark:border-neutral-800",
                OPERATOR_TYPOGRAPHY.cardTitle,
              )}
            >
              {step}
            </div>
            {index < GETTING_STARTED_HELP_DIAGRAM_STEPS.length - 1 ? (
              <span aria-hidden className="hidden shrink-0 text-2xl text-neutral-400 lg:inline">
                →
              </span>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}

/** Buyer-safe onboarding guide for `/help/getting-started`. */
export function HelpGettingStartedGuideView(props: HelpGettingStartedGuideViewProps): React.ReactElement {
  const { entry } = props;
  const buyerPolishedShell = isBuyerPolishedOperatorShellEnv();

  return (
    <article className={OPERATOR_LAYOUT.majorSectionGap} data-testid="help-getting-started-guide">
      <HelpTopicHashScroll />
      <HelpTopicMarkdownPageHeader
        entry={entry}
        subtitle={gettingStartedHelpPageSubtitle(buyerPolishedShell)}
        breadcrumb={
          buyerPolishedShell ? (
            <HelpTopicBreadcrumb topicTitle={GETTING_STARTED_HELP_BREADCRUMB_TOPIC_TITLE} />
          ) : undefined
        }
        showContextualHelp={!buyerPolishedShell}
      />
      {buyerPolishedShell ? null : (
        <PilotGuideGettingStartedFirstReviewVocabularyRail currentSurfaceId="getting-started" />
      )}
      <p className={cn("m-0 max-w-3xl", OPERATOR_TYPOGRAPHY.helper)}>{GETTING_STARTED_HELP_AUDIENCE_LINE}</p>
      <aside
        className={cn(DESIGN_TOKENS.callout.neutral, "p-3")}
        data-testid="help-getting-started-claim-discipline"
      >
        <StatusTag
          kind="neutral"
          label="Orientation only"
          data-testid="help-getting-started-orientation-status"
        />
        <p className={cn("m-0 mt-2", OPERATOR_TYPOGRAPHY.body)}>{GETTING_STARTED_HELP_CLAIM_DISCIPLINE}</p>
      </aside>

      <div className={HELP_PAGE_LAYOUT.contentGrid}>
        <div className={cn(HELP_PAGE_LAYOUT.contentColumn, "space-y-6")}>
          <Card
            id="quick-start"
            className={cn(
              OPERATOR_SHELL_SCROLL_OFFSET_CLASS,
              "border-neutral-200 bg-al-surface-raised dark:border-neutral-800",
            )}
            data-testid="getting-started-quick-start-card"
          >
            <CardHeader className={OPERATOR_CARD.header}>
              <CardTitle className={cn("text-lg", OPERATOR_TYPOGRAPHY.sectionTitle)}>
                {GETTING_STARTED_HELP_QUICK_START_TITLE}
              </CardTitle>
              <p className={cn("m-0", OPERATOR_TYPOGRAPHY.body)}>{GETTING_STARTED_HELP_QUICK_START_COPY}</p>
            </CardHeader>
            <CardContent className={cn(OPERATOR_CARD.content, "flex flex-wrap gap-2")}>
              <Button asChild size="sm" variant="primary">
                <Link href={GETTING_STARTED_HELP_PRIMARY_ACTIONS.startReview.href}>
                  {GETTING_STARTED_HELP_PRIMARY_ACTIONS.startReview.label}
                </Link>
              </Button>
              <Button asChild size="sm" variant="outline">
                <Link href={GETTING_STARTED_HELP_PRIMARY_ACTIONS.sampleReview.href}>
                  {GETTING_STARTED_HELP_PRIMARY_ACTIONS.sampleReview.label}
                </Link>
              </Button>
              <Button asChild size="sm" variant="outline">
                <Link href={GETTING_STARTED_HELP_PRIMARY_ACTIONS.firstReviewGuide.href}>
                  {GETTING_STARTED_HELP_PRIMARY_ACTIONS.firstReviewGuide.label}
                </Link>
              </Button>
            </CardContent>
          </Card>

          <section aria-labelledby="how-archlucid-works" className="space-y-3">
            <HelpSectionHeading id="how-archlucid-works">{GETTING_STARTED_HELP_DIAGRAM_TITLE}</HelpSectionHeading>
            <p className={cn("m-0", OPERATOR_TYPOGRAPHY.body)}>{GETTING_STARTED_HELP_DIAGRAM_SUMMARY}</p>
            <HowArchLucidWorksDiagram />
            <div
              className={cn(
                "space-y-3 rounded-lg border border-neutral-200 bg-al-surface-raised p-4 dark:border-neutral-800",
                OPERATOR_TYPOGRAPHY.body,
              )}
              data-testid="getting-started-pipeline-diagram"
            >
              <p className="m-0">
                Authority pipeline from architecture request through approval check and committed outputs:
              </p>
              <ol
                className="m-0 list-decimal space-y-1 pl-5 text-al-text-secondary"
                data-testid="getting-started-pipeline-text-stages"
              >
                {GETTING_STARTED_HELP_PIPELINE_TEXT_STAGES.map((stage) => (
                  <li key={stage}>{stage}</li>
                ))}
              </ol>
              <MermaidDiagram
                source={GETTING_STARTED_HELP_DIAGRAM_SOURCE}
                accessibleName="Architecture review authority pipeline"
                description={GETTING_STARTED_HELP_PIPELINE_DIAGRAM_DESCRIPTION}
              />
            </div>
          </section>

          <section aria-labelledby="plain-language-vocabulary" className="space-y-3">
            <HelpSectionHeading id="plain-language-vocabulary">Plain-language vocabulary</HelpSectionHeading>
            <p className={cn("m-0", OPERATOR_TYPOGRAPHY.helper)}>
              Seven terms you will see across review, approval, and export surfaces.
            </p>
            <PlainLanguageTable terms={GETTING_STARTED_HELP_PLAIN_LANGUAGE_TERMS} testId="getting-started-plain-language-table" />
          </section>

          <section aria-labelledby="what-happens-during-a-review" className="space-y-4">
            <HelpSectionHeading id="what-happens-during-a-review">What happens during a review?</HelpSectionHeading>
            <p className={cn("m-0", OPERATOR_TYPOGRAPHY.helper)}>
              Follow this path from evidence intake through shareable outputs.
            </p>
            <ol className="m-0 list-none space-y-0 p-0" data-testid="getting-started-workflow-stepper">
              {GETTING_STARTED_HELP_WORKFLOW_STEPS.map((step, index) => {
                const isLast = index === GETTING_STARTED_HELP_WORKFLOW_STEPS.length - 1;

                return (
                  <li key={step.stepNumber} className="relative flex gap-4 pb-6 last:pb-0">
                    {!isLast ? (
                      <span
                        aria-hidden
                        className="absolute left-[0.9375rem] top-8 h-[calc(100%-1.5rem)] w-px bg-neutral-200 dark:bg-neutral-700"
                      />
                    ) : null}
                    <span
                      aria-hidden
                      className={cn(
                        "flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-neutral-300 bg-al-surface-raised text-sm font-semibold text-al-text-primary dark:border-neutral-600",
                      )}
                    >
                      {step.stepNumber}
                    </span>
                    <div className="min-w-0 flex-1 space-y-2 rounded-md border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-950">
                      <h3 className={cn("m-0", OPERATOR_TYPOGRAPHY.cardTitle)}>{step.title}</h3>
                      <p className={cn("m-0", OPERATOR_TYPOGRAPHY.body)}>{step.description}</p>
                      <p className={cn("m-0 text-sm text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
                        <span className="font-medium text-al-text-primary">Expected outputs:</span> {step.expectedOutputs}
                      </p>
                      <Button asChild size="sm" variant={step.stepNumber === 1 ? "primary" : "outline"}>
                        <Link href={step.href}>{step.ctaLabel}</Link>
                      </Button>
                    </div>
                  </li>
                );
              })}
            </ol>
          </section>

          <section aria-labelledby="what-to-do-next" className="space-y-4">
            <HelpSectionHeading id="what-to-do-next">What to do next</HelpSectionHeading>
            <div className="grid gap-3 sm:grid-cols-2" data-testid="getting-started-next-action-cards">
              {GETTING_STARTED_HELP_NEXT_ACTION_CARDS.map((action) => (
                <Card key={action.title} className="h-full border-neutral-200 dark:border-neutral-800">
                  <CardHeader className={OPERATOR_CARD.header}>
                    <CardTitle className={cn("text-base", OPERATOR_TYPOGRAPHY.cardTitle)}>{action.title}</CardTitle>
                    <p className={cn("m-0", OPERATOR_TYPOGRAPHY.helper)}>{action.description}</p>
                  </CardHeader>
                  <CardContent className={OPERATOR_CARD.content}>
                    <GettingStartedNextActionLink href={action.href} label={action.ctaLabel} />
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>

          <HelpLazyDetails
            id="technical-details"
            className={cn(HELP_PAGE_LAYOUT.details, OPERATOR_SHELL_SCROLL_OFFSET_CLASS)}
            data-testid="getting-started-technical-details"
            summaryClassName={cn("cursor-pointer font-medium", OPERATOR_TYPOGRAPHY.cardTitle)}
            summary={GETTING_STARTED_HELP_TECHNICAL_DETAILS_TITLE}
            bodyClassName={cn(HELP_PAGE_LAYOUT.detailsBody, "space-y-4")}
          >
            <p className={cn("m-0", OPERATOR_TYPOGRAPHY.body)}>{GETTING_STARTED_HELP_TECHNICAL_DETAILS_BODY}</p>
            <PlainLanguageTable terms={GETTING_STARTED_HELP_TECHNICAL_TERMS} testId="getting-started-technical-terms-table" />
            <p className={cn("m-0", OPERATOR_TYPOGRAPHY.helper)}>
              Deeper engineering references:{" "}
              <Link href="/help/scope" className={cn("underline-offset-2 hover:underline", DESIGN_TOKENS.accent.link)}>
                Workspace and scope guide
              </Link>
              {" · "}
              <Link
                href="/help/troubleshooting"
                className={cn("underline-offset-2 hover:underline", DESIGN_TOKENS.accent.link)}
              >
                Troubleshooting
              </Link>
            </p>
          </HelpLazyDetails>
        </div>

        <HelpTopicTableOfContents headings={GETTING_STARTED_HELP_GUIDE_HEADINGS} />
      </div>
    </article>
  );
}
