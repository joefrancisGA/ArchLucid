import Link from "next/link";

import { HelpTopicHashScroll } from "@/app/(operator)/help/HelpTopicHashScroll";
import { HelpCorePilotWorkflowStepper } from "@/app/(operator)/help/_sections/HelpCorePilotWorkflowStepper";
import { HelpTopicTableOfContents } from "@/components/help/HelpTopicTableOfContents";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  CORE_PILOT_HELP_CLOUD_ACTIONS,
  CORE_PILOT_HELP_DEFERRED_ITEMS,
  CORE_PILOT_HELP_DEPTH_GUIDES,
  CORE_PILOT_HELP_DISCLOSURE,
  CORE_PILOT_HELP_GUIDE_HEADINGS,
  CORE_PILOT_HELP_HOME_STATUS_NOTE,
  CORE_PILOT_HELP_PRIMARY_ACTIONS,
  CORE_PILOT_HELP_SUMMARY_COPY,
  CORE_PILOT_HELP_SUMMARY_TITLE,
} from "@/lib/core-pilot-help-guide-content";
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

type HelpCorePilotGuideViewProps = {
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

function HelpDisclosure(props: { readonly title: string; readonly children: string }): React.ReactElement {
  return (
    <details className={HELP_PAGE_LAYOUT.details}>
      <summary className={cn("cursor-pointer font-medium", OPERATOR_TYPOGRAPHY.cardTitle)}>{props.title}</summary>
      <div className={cn(HELP_PAGE_LAYOUT.detailsBody, OPERATOR_TYPOGRAPHY.body)}>{props.children}</div>
    </details>
  );
}

/** Guided first-review workflow for `/help/core-pilot` — action-oriented, not prose documentation. */
export function HelpCorePilotGuideView(props: HelpCorePilotGuideViewProps): React.ReactElement {
  const { entry } = props;

  return (
    <article className={OPERATOR_LAYOUT.majorSectionGap} data-testid="help-core-pilot-guide">
      <HelpTopicHashScroll />
      <header className={HELP_PAGE_LAYOUT.articleHeader}>
        <h1 className={cn("m-0", OPERATOR_TYPOGRAPHY.pageTitle)}>{entry.title}</h1>
        <p className={cn("m-0", OPERATOR_TYPOGRAPHY.helper)}>{entry.summary}</p>
      </header>

      <div className={HELP_PAGE_LAYOUT.contentGrid}>
        <div className={cn(HELP_PAGE_LAYOUT.contentColumn, "space-y-6")}>
          <Card
            id="first-review-path"
            className={cn(OPERATOR_SHELL_SCROLL_OFFSET_CLASS, "border-teal-200/80 bg-teal-50/40 dark:border-teal-900/50 dark:bg-teal-950/20")}
            data-testid="core-pilot-summary-card"
          >
            <CardHeader className={OPERATOR_CARD.header}>
              <CardTitle className={cn("text-lg", OPERATOR_TYPOGRAPHY.sectionTitle)}>{CORE_PILOT_HELP_SUMMARY_TITLE}</CardTitle>
              <p className={cn("m-0", OPERATOR_TYPOGRAPHY.body)}>{CORE_PILOT_HELP_SUMMARY_COPY}</p>
            </CardHeader>
            <CardContent className={cn(OPERATOR_CARD.content, "flex flex-wrap gap-2")}>
              <Button asChild size="sm" data-testid="core-pilot-primary-start-cta">
                <Link href={CORE_PILOT_HELP_PRIMARY_ACTIONS.startReview.href}>
                  {CORE_PILOT_HELP_PRIMARY_ACTIONS.startReview.label}
                </Link>
              </Button>
              <Button asChild size="sm" variant="outline">
                <Link href={CORE_PILOT_HELP_PRIMARY_ACTIONS.sampleReview.href}>
                  {CORE_PILOT_HELP_PRIMARY_ACTIONS.sampleReview.label}
                </Link>
              </Button>
            </CardContent>
          </Card>

          <p className={cn("m-0", OPERATOR_TYPOGRAPHY.helper)}>{CORE_PILOT_HELP_HOME_STATUS_NOTE}</p>

          <section aria-labelledby="run-the-first-review-heading" className="space-y-4">
            <HelpSectionHeading id="run-the-first-review">Run the first review</HelpSectionHeading>
            <p id="run-the-first-review-heading" className={cn("m-0", OPERATOR_TYPOGRAPHY.helper)}>
              Follow these five steps in order. Each step links to the product surface where you take action.
            </p>
            <HelpCorePilotWorkflowStepper />
          </section>

          <HelpDisclosure title={CORE_PILOT_HELP_DISCLOSURE.whatThisGuideCovers.title}>
            {CORE_PILOT_HELP_DISCLOSURE.whatThisGuideCovers.body}
          </HelpDisclosure>

          <section aria-labelledby="cloud-connectors-heading" className="space-y-4">
            <HelpSectionHeading id="cloud-connectors-optional">
              Cloud connectors are optional for your first review
            </HelpSectionHeading>
            <p
              id="cloud-connectors-heading"
              data-testid="cloud-connectors-heading"
              className={cn("m-0", OPERATOR_TYPOGRAPHY.body)}
            >
              You can run an evidence-only review first, then connect Azure, AWS, or GCP later when source-system
              evidence is needed.
            </p>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3" data-testid="core-pilot-cloud-actions">
              {CORE_PILOT_HELP_CLOUD_ACTIONS.map((action) => (
                <Card key={action.title} className="h-full">
                  <CardHeader className={OPERATOR_CARD.header}>
                    <CardTitle className={cn("text-base", OPERATOR_TYPOGRAPHY.cardTitle)}>{action.title}</CardTitle>
                    <p className={cn("m-0", OPERATOR_TYPOGRAPHY.helper)}>{action.description}</p>
                  </CardHeader>
                  <CardContent className={OPERATOR_CARD.content}>
                    <Button asChild size="sm" variant="outline">
                      <Link href={action.href}>{action.ctaLabel}</Link>
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
            <HelpDisclosure title={CORE_PILOT_HELP_DISCLOSURE.whenToUseCloudConnectors.title}>
              {CORE_PILOT_HELP_DISCLOSURE.whenToUseCloudConnectors.body}
            </HelpDisclosure>
          </section>

          <section aria-labelledby="fast-path-heading" className="space-y-3">
            <HelpSectionHeading id="fast-path-evidence-only">Fast path: evidence-only review</HelpSectionHeading>
            <Card id="fast-path-heading" className="border-neutral-200 dark:border-neutral-800">
              <CardContent className={cn(OPERATOR_CARD.body, "space-y-3")}>
                <p className={cn("m-0", OPERATOR_TYPOGRAPHY.body)}>
                  Recommended when connector access is not approved yet, or when your first session only has briefs,
                  diagrams, IaC, screenshots, exports, or policy documents.
                </p>
                <ol className={cn("m-0 list-decimal space-y-1.5 pl-5", OPERATOR_TYPOGRAPHY.body)}>
                  <li>Start a review with no cloud target selected (evidence-only).</li>
                  <li>Upload files or paste your architecture brief — a cloud connector is not required.</li>
                  <li>Start the review, finalize the package, and export the sponsor packet.</li>
                </ol>
                <Button asChild size="sm" variant="outline">
                  <Link href={CORE_PILOT_HELP_PRIMARY_ACTIONS.startReview.href}>
                    {CORE_PILOT_HELP_PRIMARY_ACTIONS.startReview.label}
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </section>

          <section aria-labelledby="what-can-wait-heading" className="space-y-3">
            <HelpSectionHeading id="what-can-wait">What can wait</HelpSectionHeading>
            <ul id="what-can-wait-heading" className="m-0 list-none space-y-3 p-0">
              {CORE_PILOT_HELP_DEFERRED_ITEMS.map((item) => (
                <li
                  key={item.title}
                  className="rounded-md border border-neutral-200 bg-neutral-50/60 px-4 py-3 dark:border-neutral-800 dark:bg-neutral-900/40"
                >
                  <p className={cn("m-0 font-medium", OPERATOR_TYPOGRAPHY.cardTitle)}>{item.title}</p>
                  <p className={cn("m-0 mt-1", OPERATOR_TYPOGRAPHY.helper)}>{item.description}</p>
                </li>
              ))}
            </ul>
            <HelpDisclosure title={CORE_PILOT_HELP_DISCLOSURE.whatCanWaitUntilLater.title}>
              {CORE_PILOT_HELP_DISCLOSURE.whatCanWaitUntilLater.body}
            </HelpDisclosure>
          </section>

          <section
            aria-labelledby="ready-to-begin-heading"
            className="rounded-lg border border-neutral-200 bg-neutral-50/80 p-6 dark:border-neutral-800 dark:bg-neutral-900/30"
            data-testid="core-pilot-closing-cta"
          >
            <HelpSectionHeading id="ready-to-begin">Ready to begin?</HelpSectionHeading>
            <p id="ready-to-begin-heading" className={cn("m-0 mt-2", OPERATOR_TYPOGRAPHY.body)}>
              Start your first review now, or explore the sample review to see a completed outcome.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button asChild size="sm" variant="outline">
                <Link href={CORE_PILOT_HELP_PRIMARY_ACTIONS.startReview.href}>
                  {CORE_PILOT_HELP_PRIMARY_ACTIONS.startReview.label}
                </Link>
              </Button>
              <Button asChild size="sm" variant="outline">
                <Link href={CORE_PILOT_HELP_PRIMARY_ACTIONS.sampleReview.href}>
                  {CORE_PILOT_HELP_PRIMARY_ACTIONS.sampleReview.label}
                </Link>
              </Button>
            </div>
          </section>

          <section aria-labelledby="depth-guides-heading" className="space-y-3 border-t border-neutral-200 pt-6 dark:border-neutral-800">
            <h2 id="depth-guides-heading" className={cn("m-0", OPERATOR_TYPOGRAPHY.cardTitle)}>
              Related guides
            </h2>
            <ul className={cn("m-0 flex flex-wrap gap-x-4 gap-y-2 p-0 list-none", OPERATOR_TYPOGRAPHY.body)}>
              {CORE_PILOT_HELP_DEPTH_GUIDES.map((guide) => (
                <li key={guide.href}>
                  <Link
                    href={guide.href}
                    className={cn("underline-offset-2 hover:underline", DESIGN_TOKENS.accent.link)}
                  >
                    {guide.label}
                  </Link>
                </li>
              ))}
            </ul>
            <p className={cn("m-0", OPERATOR_TYPOGRAPHY.helper)}>
              Stuck?{" "}
              <Link
                href={CORE_PILOT_HELP_PRIMARY_ACTIONS.troubleshooting.href}
                className={cn("underline-offset-2 hover:underline", DESIGN_TOKENS.accent.link)}
              >
                {CORE_PILOT_HELP_PRIMARY_ACTIONS.troubleshooting.label}
              </Link>
            </p>
          </section>
        </div>

        <HelpTopicTableOfContents headings={CORE_PILOT_HELP_GUIDE_HEADINGS} />
      </div>
    </article>
  );
}
