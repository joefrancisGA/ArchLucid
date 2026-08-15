import Link from "next/link";

import { HelpTopicHashScroll } from "@/app/(operator)/help/HelpTopicHashScroll";
import { ArchitectureDraftsHelpEvidenceOrientationStrip } from "@/components/help/ArchitectureDraftsHelpEvidenceOrientationStrip";
import { HelpTopicGuidePageHeader } from "@/components/help/HelpTopicGuidePageHeader";
import { HelpTopicRegistryProvenanceLine } from "@/components/help/HelpTopicRegistryProvenanceLine";
import { HelpTopicTableOfContents } from "@/components/help/HelpTopicTableOfContents";
import { Button } from "@/components/ui/button";
import { ARCHITECTURE_DRAFTS_HELP_TOPIC_LABEL } from "@/lib/architecture-drafts-evidence-copy";
import {
  ARCHITECTURE_DRAFTS_HELP_CREATE_HREF,
  ARCHITECTURE_DRAFTS_HELP_FEATURE_ITEMS,
  ARCHITECTURE_DRAFTS_HELP_FIRST_REVIEW_HREF,
  ARCHITECTURE_DRAFTS_HELP_GUIDE_HEADINGS,
  ARCHITECTURE_DRAFTS_HELP_HOW_TO_READ_STEPS,
  ARCHITECTURE_DRAFTS_HELP_OVERVIEW,
  ARCHITECTURE_DRAFTS_HELP_PAGE_SUBTITLE,
  ARCHITECTURE_DRAFTS_HELP_PAGE_TITLE,
  ARCHITECTURE_DRAFTS_HELP_PRIMARY_ACTION,
  ARCHITECTURE_DRAFTS_HELP_SECONDARY_ACTION,
} from "@/lib/architecture-drafts-help-guide-content";
import { ARCHITECTURE_DRAFTS_HELP_CANONICAL_PATH } from "@/lib/architecture-drafts-help-evidence-copy";
import {
  OPERATOR_LAYOUT,
  OPERATOR_LINK,
  OPERATOR_SHELL_SCROLL_OFFSET_CLASS,
  OPERATOR_TYPOGRAPHY,
} from "@/lib/design-tokens";
import { HELP_PAGE_LAYOUT, resolveHelpPageContentGridClass } from "@/lib/help/help-page-layout";
import type { ProductDocumentationEntry } from "@/lib/product-documentation-registry";
import { cn } from "@/lib/utils";

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
  const contentGridClass = resolveHelpPageContentGridClass(ARCHITECTURE_DRAFTS_HELP_GUIDE_HEADINGS.length);
  const readingBodyClass = cn("m-0 leading-relaxed", HELP_PAGE_LAYOUT.readingBody);

  return (
    <article
      className={cn(OPERATOR_LAYOUT.majorSectionGap, "w-full max-w-[72rem]")}
      data-testid="help-architecture-drafts-guide"
    >
      <HelpTopicHashScroll />

      <HelpTopicGuidePageHeader
        title={ARCHITECTURE_DRAFTS_HELP_PAGE_TITLE}
        titleTestId="help-architecture-drafts-page-title"
        subtitle={ARCHITECTURE_DRAFTS_HELP_PAGE_SUBTITLE}
        navHref={ARCHITECTURE_DRAFTS_HELP_CANONICAL_PATH}
        headingLevel="h1"
        metadata={<HelpTopicRegistryProvenanceLine entry={entry} />}
      />

      <div className={contentGridClass}>
        <div className={cn(HELP_PAGE_LAYOUT.contentColumn, "space-y-4")}>
          <p className={readingBodyClass} data-testid="help-architecture-drafts-overview">
            {ARCHITECTURE_DRAFTS_HELP_OVERVIEW}
          </p>

          <div
            className="flex flex-wrap items-center gap-2"
            data-testid="help-architecture-drafts-action-panel"
          >
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
            <HelpSectionHeading id="how-architecture-drafts-work">{ARCHITECTURE_DRAFTS_HELP_TOPIC_LABEL}</HelpSectionHeading>
            <ol
              className={cn("m-0 list-decimal space-y-2 pl-5", HELP_PAGE_LAYOUT.readingBody)}
              data-testid="help-architecture-drafts-how-stepper"
            >
              {ARCHITECTURE_DRAFTS_HELP_HOW_TO_READ_STEPS.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ol>
            <p className={cn("m-0", HELP_PAGE_LAYOUT.readingBody)}>
              <Link className={OPERATOR_LINK.inline} href={ARCHITECTURE_DRAFTS_HELP_FIRST_REVIEW_HREF}>
                Read your first architecture review help
              </Link>
            </p>
            <p className={cn("m-0", HELP_PAGE_LAYOUT.readingBody)}>
              <Link className={OPERATOR_LINK.inline} href={ARCHITECTURE_DRAFTS_HELP_CREATE_HREF}>
                Create architecture
              </Link>
            </p>
          </section>

          <ArchitectureDraftsHelpEvidenceOrientationStrip />
        </div>

        <HelpTopicTableOfContents headings={ARCHITECTURE_DRAFTS_HELP_GUIDE_HEADINGS} />
      </div>
    </article>
  );
}
