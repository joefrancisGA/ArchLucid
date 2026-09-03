import Link from "next/link";

import { HelpPilotFeedbackClaimOrientationStrip } from "@/app/(operator)/help/_sections/HelpPilotFeedbackClaimOrientationStrip";
import { HelpPilotFeedbackHeaderActions } from "@/app/(operator)/help/_sections/HelpPilotFeedbackHeaderActions";
import { HelpTopicHashScroll } from "@/app/(operator)/help/HelpTopicHashScroll";
import { HelpTopicGuidePageHeader } from "@/components/help/HelpTopicGuidePageHeader";
import { HelpTopicRegistryProvenanceLine } from "@/components/help/HelpTopicRegistryProvenanceLine";
import { HelpTopicTableOfContents } from "@/components/help/HelpTopicTableOfContents";
import { MarketingAccessibilityMarkdownFragment } from "@/components/marketing/MarketingAccessibilityMarkdownFragment";
import { Button } from "@/components/ui/button";
import { resolveGuideHeadingsForStrip } from "@/lib/claim-discipline-policy";
import {
  DESIGN_TOKENS,
  OPERATOR_LAYOUT,
  OPERATOR_TYPOGRAPHY,
} from "@/lib/design-tokens";
import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";
import { extractHelpMarkdownHeadings } from "@/lib/help/help-markdown-headings";
import { prepareHelpMarkdownForPresentation } from "@/lib/help/help-markdown-presentation";
import { HELP_PAGE_LAYOUT, HELP_PAGE_MIN_TOC_HEADINGS, resolveHelpPageContentGridClass } from "@/lib/help/help-page-layout";
import type { ProductDocumentationEntry } from "@/lib/product-documentation-registry";
import {
  PILOT_FEEDBACK_HELP_CLAIM_DISCIPLINE,
  PILOT_FEEDBACK_HELP_CANONICAL_PATH,
  PILOT_FEEDBACK_HELP_CLAIM_HEADING_ID,
} from "@/lib/pilot-feedback-help-evidence-copy";
import {
  PILOT_FEEDBACK_HELP_JOB_MATRIX,
  PILOT_FEEDBACK_HELP_OVERVIEW,
  PILOT_FEEDBACK_HELP_PAGE_SUBTITLE,
  PILOT_FEEDBACK_HELP_PAGE_TITLE,
  PILOT_FEEDBACK_HELP_PRIMARY_ACTION,
  PILOT_FEEDBACK_HELP_WORKFLOW_STEPS,
} from "@/lib/pilot-feedback-help-guide-content";
import {
  PILOT_FEEDBACK_HELP_FIRST_VIEWPORT_TEST_ID,
  PILOT_FEEDBACK_HELP_HEADER_CLAIM_DISCIPLINE_TEST_ID,
  PILOT_FEEDBACK_HELP_PRIMARY_CONTENT_ID,
  PILOT_FEEDBACK_HELP_SKIP_LINK_LABEL,
  PILOT_FEEDBACK_HELP_SKIP_TARGET_ID,
} from "@/lib/pilot-feedback-help-page-copy";
import { cn } from "@/lib/utils";
import { operatorPageContainerClass } from "@/components/operator/OperatorPageContainer";

type HelpPilotFeedbackGuideViewProps = {
  readonly entry: ProductDocumentationEntry;
  readonly markdown: string;
};

function PilotFeedbackWorkflowStepper(): React.ReactElement {
  return (
    <div
      className="rounded-lg border border-neutral-200 bg-al-surface-raised p-4 dark:border-neutral-800"
      data-testid="help-pilot-feedback-workflow-stepper"
    >
      <ol className="m-0 grid list-none gap-3 p-0 md:grid-cols-3">
        {PILOT_FEEDBACK_HELP_WORKFLOW_STEPS.map((step, index) => (
          <li key={step} className="min-w-0">
            <div className="flex h-full flex-col gap-2 rounded-md border border-neutral-200 bg-white p-3 dark:border-neutral-800 dark:bg-neutral-950">
              <span className="sr-only">{`Step ${index + 1}`}</span>
              <span aria-hidden className={HELP_PAGE_LAYOUT.workflowStepNumber}>
                {index + 1}
              </span>
              <p className={cn("m-0", OPERATOR_TYPOGRAPHY.body)}>{step}</p>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}

/** Admin pilot-feedback orientation for `/help/pilot-feedback` (TB-1716 / TB-1718 / TB-1719 / TB-1720). */
export function HelpPilotFeedbackGuideView(props: HelpPilotFeedbackGuideViewProps): React.ReactElement {
  const { entry, markdown } = props;
  const buyerPolishedShell = isBuyerPolishedOperatorShellEnv();
  const sourceDocPath = entry.sourcePaths[0] ?? "";
  const preparedMarkdown = prepareHelpMarkdownForPresentation(markdown, sourceDocPath, {
    helpTopicSlug: entry.slug,
  });
  const headings = resolveGuideHeadingsForStrip(
    "help-pilot-feedback",
    extractHelpMarkdownHeadings(preparedMarkdown),
    PILOT_FEEDBACK_HELP_CLAIM_HEADING_ID,
  );
  const contentGridClass = resolveHelpPageContentGridClass(headings.length);
  const showSectionNav = headings.length >= HELP_PAGE_MIN_TOC_HEADINGS;
  const readingBodyClass = cn("m-0 max-w-3xl leading-relaxed", HELP_PAGE_LAYOUT.readingBody);

  return (
    <article
      className={cn(operatorPageContainerClass("workflow"), OPERATOR_LAYOUT.majorSectionGap)}
      data-testid="help-pilot-feedback-guide"
    >
      <a href={`#${PILOT_FEEDBACK_HELP_SKIP_TARGET_ID}`} className={HELP_PAGE_LAYOUT.technicalReferenceSkipLink}>
        {PILOT_FEEDBACK_HELP_SKIP_LINK_LABEL}
      </a>
      <HelpTopicHashScroll />

      <div
        id={PILOT_FEEDBACK_HELP_PRIMARY_CONTENT_ID}
        data-testid={PILOT_FEEDBACK_HELP_PRIMARY_CONTENT_ID}
        className={cn("scroll-mt-24 space-y-6", OPERATOR_LAYOUT.sectionStack)}
      >
        <HelpTopicGuidePageHeader
          title={PILOT_FEEDBACK_HELP_PAGE_TITLE}
          titleTestId="help-pilot-feedback-page-title"
          subtitle={PILOT_FEEDBACK_HELP_PAGE_SUBTITLE}
          navHref={PILOT_FEEDBACK_HELP_CANONICAL_PATH}
          headingLevel="h1"
          claimDiscipline={PILOT_FEEDBACK_HELP_CLAIM_DISCIPLINE}
          claimDisciplineTestId={PILOT_FEEDBACK_HELP_HEADER_CLAIM_DISCIPLINE_TEST_ID}
          metadata={buyerPolishedShell ? undefined : <HelpTopicRegistryProvenanceLine entry={entry} />}
          actions={<HelpPilotFeedbackHeaderActions entry={entry} />}
        />

        <div
          id={PILOT_FEEDBACK_HELP_SKIP_TARGET_ID}
          data-testid={PILOT_FEEDBACK_HELP_FIRST_VIEWPORT_TEST_ID}
          className={cn(
            "scroll-mt-24 space-y-4 border-b border-neutral-200 pb-6 dark:border-neutral-800",
            OPERATOR_LAYOUT.sectionStack,
          )}
        >
          <p className={readingBodyClass} data-testid="help-pilot-feedback-overview">
            {PILOT_FEEDBACK_HELP_OVERVIEW}
          </p>

          <section
            className="space-y-4 rounded-md border border-neutral-200 bg-neutral-50/80 p-4 dark:border-neutral-700 dark:bg-neutral-900/40"
            data-testid="help-pilot-feedback-action-panel"
            aria-labelledby="help-pilot-feedback-action-panel-heading"
          >
            <h2
              id="help-pilot-feedback-action-panel-heading"
              className={cn("m-0 text-al-text-primary", OPERATOR_TYPOGRAPHY.sectionTitle)}
            >
              Admin pilot-feedback workflow
            </h2>
            <PilotFeedbackWorkflowStepper />
            <Button asChild size="sm" variant="outline">
              <Link href={PILOT_FEEDBACK_HELP_PRIMARY_ACTION.href}>{PILOT_FEEDBACK_HELP_PRIMARY_ACTION.label}</Link>
            </Button>
          </section>
        </div>

        <div className={contentGridClass}>
          <div className={cn(HELP_PAGE_LAYOUT.contentColumn, "space-y-6")}>
            <section
              aria-labelledby="help-pilot-feedback-job-matrix-heading"
              className="space-y-3 border-t border-neutral-200 pt-6 dark:border-neutral-800"
              data-testid="help-pilot-feedback-job-matrix"
            >
              <h2 id="help-pilot-feedback-job-matrix-heading" className={cn("m-0", OPERATOR_TYPOGRAPHY.sectionTitle)}>
                Choose the right surface
              </h2>
              <div className="overflow-x-auto rounded-md border border-neutral-200 dark:border-neutral-800">
                <table className="w-full min-w-[32rem] border-collapse text-left text-sm">
                  <thead className="bg-neutral-50 dark:bg-neutral-900/60">
                    <tr>
                      <th className="px-3 py-2 font-medium">Surface</th>
                      <th className="px-3 py-2 font-medium">Use when</th>
                    </tr>
                  </thead>
                  <tbody>
                    {PILOT_FEEDBACK_HELP_JOB_MATRIX.map((row) => (
                      <tr key={row.href} className="border-t border-neutral-200 dark:border-neutral-800">
                        <td className="px-3 py-2 align-top">
                          <Link href={row.href} className={cn(OPERATOR_TYPOGRAPHY.body, DESIGN_TOKENS.accent.link)}>
                            {row.label}
                          </Link>
                        </td>
                        <td className={cn("px-3 py-2 align-top text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
                          {row.when}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            <div className={HELP_PAGE_LAYOUT.contentColumn} data-testid="help-pilot-feedback-content">
              <MarketingAccessibilityMarkdownFragment
                markdownBody={markdown}
                tableCaption={`${entry.title} reference table`}
                presentation="help"
                sourceDocPath={sourceDocPath}
                helpTopicSlug={entry.slug}
              />
            </div>
          </div>

          {showSectionNav ? <HelpTopicTableOfContents headings={headings} /> : null}
        </div>

        <div data-testid="help-pilot-feedback-orientation-bottom">
          <HelpPilotFeedbackClaimOrientationStrip />
        </div>
      </div>
    </article>
  );
}
