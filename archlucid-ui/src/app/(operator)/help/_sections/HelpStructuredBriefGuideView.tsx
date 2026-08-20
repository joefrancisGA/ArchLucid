import Link from "next/link";

import { HelpTopicHashScroll } from "@/app/(operator)/help/HelpTopicHashScroll";
import { StructuredBriefHelpEvidenceOrientationStrip } from "@/components/help/StructuredBriefHelpEvidenceOrientationStrip";
import { HelpTopicBreadcrumb } from "@/components/help/HelpTopicBreadcrumb";
import { HelpTopicGuidePageHeader } from "@/components/help/HelpTopicGuidePageHeader";
import { HelpTopicRegistryProvenanceLine } from "@/components/help/HelpTopicRegistryProvenanceLine";
import { HelpTopicTableOfContents } from "@/components/help/HelpTopicTableOfContents";
import { Button } from "@/components/ui/button";
import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";
import {
  OPERATOR_LAYOUT,
  OPERATOR_SHELL_SCROLL_OFFSET_CLASS,
  OPERATOR_TYPOGRAPHY,
} from "@/lib/design-tokens";
import { HELP_PAGE_LAYOUT, resolveHelpPageContentGridClass } from "@/lib/help/help-page-layout";
import type { ProductDocumentationEntry } from "@/lib/product-documentation-registry";
import {
  STRUCTURED_BRIEF_HELP_BREADCRUMB_TOPIC_TITLE,
  STRUCTURED_BRIEF_HELP_CONCEPT_ITEMS,
  STRUCTURED_BRIEF_HELP_GUIDE_HEADINGS,
  STRUCTURED_BRIEF_HELP_HOW_TO_READ_STEPS,
  STRUCTURED_BRIEF_HELP_OVERVIEW,
  STRUCTURED_BRIEF_HELP_PAGE_EYEBROW,
  STRUCTURED_BRIEF_HELP_PAGE_TITLE,
  STRUCTURED_BRIEF_HELP_PRIMARY_ACTION,
  STRUCTURED_BRIEF_HELP_PRIMARY_CONTENT_ID,
  STRUCTURED_BRIEF_HELP_SKIP_LINK_LABEL,
  structuredBriefHelpPageSubtitle,
} from "@/lib/structured-brief-help-guide-content";
import { STRUCTURED_BRIEF_HELP_CANONICAL_PATH } from "@/lib/structured-brief-help-evidence-copy";
import { cn } from "@/lib/utils";

type HelpStructuredBriefGuideViewProps = {
  readonly entry: ProductDocumentationEntry;
};

function HelpSectionHeading(props: { readonly id: string; readonly children: string }): React.ReactElement {
  return (
    <h2
      id={props.id}
      className={cn(OPERATOR_SHELL_SCROLL_OFFSET_CLASS, OPERATOR_TYPOGRAPHY.sectionTitle, "m-0 scroll-mt-24")}
    >
      {props.children}
    </h2>
  );
}

/** Operator structured brief orientation for `/help/structured-brief`. */
export function HelpStructuredBriefGuideView(props: HelpStructuredBriefGuideViewProps): React.ReactElement {
  const { entry } = props;
  const buyerPolishedShell = isBuyerPolishedOperatorShellEnv();
  const contentGridClass = resolveHelpPageContentGridClass(STRUCTURED_BRIEF_HELP_GUIDE_HEADINGS.length);
  const readingBodyClass = cn("m-0 leading-relaxed", HELP_PAGE_LAYOUT.readingBody);

  return (
    <article
      className={cn(OPERATOR_LAYOUT.majorSectionGap, "w-full max-w-[72rem]")}
      data-testid="help-structured-brief-guide"
    >
      <a
        href={`#${STRUCTURED_BRIEF_HELP_PRIMARY_CONTENT_ID}`}
        className={HELP_PAGE_LAYOUT.technicalReferenceSkipLink}
      >
        {STRUCTURED_BRIEF_HELP_SKIP_LINK_LABEL}
      </a>

      <HelpTopicHashScroll />

      <HelpTopicGuidePageHeader
        eyebrow={buyerPolishedShell ? undefined : STRUCTURED_BRIEF_HELP_PAGE_EYEBROW}
        title={STRUCTURED_BRIEF_HELP_PAGE_TITLE}
        titleTestId="help-structured-brief-page-title"
        subtitle={structuredBriefHelpPageSubtitle(buyerPolishedShell)}
        navHref={STRUCTURED_BRIEF_HELP_CANONICAL_PATH}
        headingLevel="h1"
        breadcrumb={<HelpTopicBreadcrumb topicTitle={STRUCTURED_BRIEF_HELP_BREADCRUMB_TOPIC_TITLE} />}
        metadata={buyerPolishedShell ? undefined : <HelpTopicRegistryProvenanceLine entry={entry} />}
      />

      <div className={contentGridClass}>
        <div
          id={STRUCTURED_BRIEF_HELP_PRIMARY_CONTENT_ID}
          className={cn(HELP_PAGE_LAYOUT.contentColumn, "scroll-mt-24 space-y-4")}
        >
          {buyerPolishedShell ? (
            <div data-testid="help-structured-brief-orientation-top">
              <StructuredBriefHelpEvidenceOrientationStrip readingBodyClassName={HELP_PAGE_LAYOUT.readingBody} />
            </div>
          ) : null}

          <section aria-labelledby="structured-brief-overview">
            <HelpSectionHeading id="structured-brief-overview">Overview</HelpSectionHeading>
            <p className={readingBodyClass} data-testid="help-structured-brief-overview">
              {STRUCTURED_BRIEF_HELP_OVERVIEW}
            </p>
          </section>

          <div
            className="flex flex-wrap items-center gap-2"
            data-testid="help-structured-brief-action-panel"
          >
            <Button asChild size="sm" variant="primary">
              <Link href={STRUCTURED_BRIEF_HELP_PRIMARY_ACTION.href}>{STRUCTURED_BRIEF_HELP_PRIMARY_ACTION.label}</Link>
            </Button>
          </div>

          <section aria-labelledby="field-concepts" className="space-y-4">
            <HelpSectionHeading id="field-concepts">Field concepts</HelpSectionHeading>
            <ul className="m-0 list-none space-y-4 p-0" data-testid="help-structured-brief-concept-items">
              {STRUCTURED_BRIEF_HELP_CONCEPT_ITEMS.map((item) => (
                <li key={item.label} className="space-y-2 rounded-md border border-neutral-200 p-3 dark:border-neutral-700">
                  <p className={cn("m-0 font-medium text-al-text-primary", readingBodyClass)}>{item.label}</p>
                  <p className={cn("m-0 text-al-text-secondary", readingBodyClass)}>{item.detail}</p>
                  <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
                    Good examples: {item.examples.join("; ")}
                  </p>
                  <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
                    Avoid: {item.antiPatterns.join("; ")}
                  </p>
                </li>
              ))}
            </ul>
          </section>

          <section aria-labelledby="step-by-step" className="space-y-3">
            <HelpSectionHeading id="step-by-step">Step-by-step</HelpSectionHeading>
            <ol
              className={cn("m-0 list-decimal space-y-2 pl-5", readingBodyClass)}
              data-testid="help-structured-brief-how-stepper"
            >
              {STRUCTURED_BRIEF_HELP_HOW_TO_READ_STEPS.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ol>
          </section>
        </div>

        <HelpTopicTableOfContents headings={STRUCTURED_BRIEF_HELP_GUIDE_HEADINGS} />
      </div>
    </article>
  );
}
