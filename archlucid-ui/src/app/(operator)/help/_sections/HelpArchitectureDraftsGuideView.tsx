import Link from "next/link";

import { HelpTopicHashScroll } from "@/app/(operator)/help/HelpTopicHashScroll";
import { ArchitectureDraftsHelpClaimDisciplineStrip } from "@/components/help/ArchitectureDraftsHelpClaimDisciplineStrip";
import { ArchitectureDraftsHelpEvidenceOrientationStrip } from "@/components/help/ArchitectureDraftsHelpEvidenceOrientationStrip";
import { HelpTopicBreadcrumb } from "@/components/help/HelpTopicBreadcrumb";
import { HelpTopicGuidePageHeader } from "@/components/help/HelpTopicGuidePageHeader";
import { HelpTopicRegistryProvenanceLine } from "@/components/help/HelpTopicRegistryProvenanceLine";
import { HelpTopicTableOfContents } from "@/components/help/HelpTopicTableOfContents";
import { Button } from "@/components/ui/button";
import {
  ARCHITECTURE_DRAFTS_HELP_BREADCRUMB_TOPIC_TITLE,
  ARCHITECTURE_DRAFTS_HELP_FEATURE_ITEMS,
  ARCHITECTURE_DRAFTS_HELP_GUIDE_HEADINGS,
  ARCHITECTURE_DRAFTS_HELP_HOW_TO_READ_STEPS,
  ARCHITECTURE_DRAFTS_HELP_HOW_TO_SECTION_TITLE,
  ARCHITECTURE_DRAFTS_HELP_OVERVIEW,
  ARCHITECTURE_DRAFTS_HELP_PAGE_EYEBROW,
  ARCHITECTURE_DRAFTS_HELP_PAGE_TITLE,
  ARCHITECTURE_DRAFTS_HELP_PRIMARY_ACTION,
  ARCHITECTURE_DRAFTS_HELP_PRIMARY_CONTENT_ID,
  ARCHITECTURE_DRAFTS_HELP_SECONDARY_ACTION,
  ARCHITECTURE_DRAFTS_HELP_SKIP_LINK_LABEL,
  architectureDraftsHelpPageSubtitle,
} from "@/lib/architecture-drafts-help-guide-content";
import { ARCHITECTURE_DRAFTS_HELP_CANONICAL_PATH } from "@/lib/architecture-drafts-help-evidence-copy";
import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";
import {
  OPERATOR_LAYOUT,
  OPERATOR_SHELL_SCROLL_OFFSET_CLASS,
  OPERATOR_TYPOGRAPHY,
} from "@/lib/design-tokens";
import { HELP_PAGE_LAYOUT, resolveHelpPageContentGridClass } from "@/lib/help/help-page-layout";
import type { ProductDocumentationEntry } from "@/lib/product-documentation-registry";
import { cn } from "@/lib/utils";
import { operatorPageContainerClass } from "@/components/operator/OperatorPageContainer";

type HelpArchitectureDraftsGuideViewProps = {
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

/** Operator architecture drafts orientation for `/help/architecture-drafts`. */
export function HelpArchitectureDraftsGuideView(props: HelpArchitectureDraftsGuideViewProps): React.ReactElement {
  const { entry } = props;
  const buyerPolishedShell = isBuyerPolishedOperatorShellEnv();
  const contentGridClass = resolveHelpPageContentGridClass(ARCHITECTURE_DRAFTS_HELP_GUIDE_HEADINGS.length);
  const readingBodyClass = cn("m-0 leading-relaxed", HELP_PAGE_LAYOUT.readingBody);

  return (
    <article
      className={cn(operatorPageContainerClass("workflow"), OPERATOR_LAYOUT.majorSectionGap)}
      data-testid="help-architecture-drafts-guide"
    >
      <a
        href={`#${ARCHITECTURE_DRAFTS_HELP_PRIMARY_CONTENT_ID}`}
        className={HELP_PAGE_LAYOUT.technicalReferenceSkipLink}
      >
        {ARCHITECTURE_DRAFTS_HELP_SKIP_LINK_LABEL}
      </a>

      <HelpTopicHashScroll />

      <HelpTopicGuidePageHeader
        eyebrow={buyerPolishedShell ? undefined : ARCHITECTURE_DRAFTS_HELP_PAGE_EYEBROW}
        title={ARCHITECTURE_DRAFTS_HELP_PAGE_TITLE}
        titleTestId="help-architecture-drafts-page-title"
        subtitle={architectureDraftsHelpPageSubtitle(buyerPolishedShell)}
        navHref={ARCHITECTURE_DRAFTS_HELP_CANONICAL_PATH}
        headingLevel="h1"
        breadcrumb={<HelpTopicBreadcrumb topicTitle={ARCHITECTURE_DRAFTS_HELP_BREADCRUMB_TOPIC_TITLE} />}
        metadata={buyerPolishedShell ? undefined : <HelpTopicRegistryProvenanceLine entry={entry} />}
      />

      <ArchitectureDraftsHelpClaimDisciplineStrip />

      <div className={contentGridClass}>
        <div
          id={ARCHITECTURE_DRAFTS_HELP_PRIMARY_CONTENT_ID}
          className={cn(HELP_PAGE_LAYOUT.contentColumn, "scroll-mt-24 space-y-4")}
        >
          <div data-testid="help-architecture-drafts-orientation-top">
            <ArchitectureDraftsHelpEvidenceOrientationStrip readingBodyClassName={HELP_PAGE_LAYOUT.readingBody} />
          </div>

          <p className={readingBodyClass} data-testid="help-architecture-drafts-overview">
            {ARCHITECTURE_DRAFTS_HELP_OVERVIEW}
          </p>

          <section
            className="space-y-3 rounded-md border border-neutral-200 bg-neutral-50/80 p-4 dark:border-neutral-700 dark:bg-neutral-900/40"
            data-testid="help-architecture-drafts-action-panel"
            aria-labelledby="help-architecture-drafts-action-panel-heading"
          >
            <h2
              id="help-architecture-drafts-action-panel-heading"
              className={cn("m-0 text-al-text-primary", OPERATOR_TYPOGRAPHY.sectionTitle)}
            >
              Start here
            </h2>
            <div className="flex flex-wrap items-center gap-2">
              <Button asChild size="sm" variant="primary">
                <Link href={ARCHITECTURE_DRAFTS_HELP_PRIMARY_ACTION.href}>
                  {ARCHITECTURE_DRAFTS_HELP_PRIMARY_ACTION.label}
                </Link>
              </Button>
              <Button asChild size="sm" variant="outline">
                <Link href={ARCHITECTURE_DRAFTS_HELP_SECONDARY_ACTION.href}>
                  {ARCHITECTURE_DRAFTS_HELP_SECONDARY_ACTION.label}
                </Link>
              </Button>
            </div>
          </section>

          <section
            aria-labelledby="what-architecture-drafts-do"
            className="space-y-3 border-t border-neutral-200 pt-4 dark:border-neutral-800"
          >
            <HelpSectionHeading id="what-architecture-drafts-do">What architecture drafts do</HelpSectionHeading>
            <dl
              className={cn("m-0 grid gap-3 sm:grid-cols-2", HELP_PAGE_LAYOUT.readingBody)}
              data-testid="help-architecture-drafts-feature-items"
            >
              {ARCHITECTURE_DRAFTS_HELP_FEATURE_ITEMS.map((item) => (
                <div key={item.label}>
                  <dt className="font-medium text-al-text-primary">{item.label}</dt>
                  <dd className="m-0 mt-1 text-al-text-secondary">{item.detail}</dd>
                </div>
              ))}
            </dl>
          </section>

          <section
            aria-labelledby="how-architecture-drafts-work"
            className="space-y-3 border-t border-neutral-200 pt-4 dark:border-neutral-800"
          >
            <HelpSectionHeading id="how-architecture-drafts-work">
              {ARCHITECTURE_DRAFTS_HELP_HOW_TO_SECTION_TITLE}
            </HelpSectionHeading>
            <ol
              className={cn("m-0 list-decimal space-y-2 pl-5", HELP_PAGE_LAYOUT.readingBody)}
              data-testid="help-architecture-drafts-how-stepper"
            >
              {ARCHITECTURE_DRAFTS_HELP_HOW_TO_READ_STEPS.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ol>
          </section>
        </div>

        <HelpTopicTableOfContents headings={ARCHITECTURE_DRAFTS_HELP_GUIDE_HEADINGS} />
      </div>
    </article>
  );
}
