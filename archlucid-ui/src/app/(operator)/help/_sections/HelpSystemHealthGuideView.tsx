import Link from "next/link";

import { HelpTopicHashScroll } from "@/app/(operator)/help/HelpTopicHashScroll";
import { HelpSystemHealthHeaderActions } from "@/app/(operator)/help/_sections/HelpSystemHealthHeaderActions";
import { SystemHealthHelpEvidenceOrientationStrip } from "@/components/help/SystemHealthHelpEvidenceOrientationStrip";
import { HelpTopicBreadcrumb } from "@/components/help/HelpTopicBreadcrumb";
import { HelpTopicGuidePageHeader } from "@/components/help/HelpTopicGuidePageHeader";
import { HelpTopicRegistryProvenanceLine } from "@/components/help/HelpTopicRegistryProvenanceLine";
import { HelpTopicTableOfContents } from "@/components/help/HelpTopicTableOfContents";
import {
  OPERATOR_LAYOUT,
  OPERATOR_LINK,
  OPERATOR_SHELL_SCROLL_OFFSET_CLASS,
  OPERATOR_TYPOGRAPHY,
} from "@/lib/design-tokens";
import { HELP_PAGE_LAYOUT, resolveHelpPageContentGridClass } from "@/lib/help/help-page-layout";
import type { ProductDocumentationEntry } from "@/lib/product-documentation-registry";
import { SYSTEM_HEALTH_HELP_TOPIC_LABEL } from "@/lib/system-health-evidence-copy";
import { SYSTEM_HEALTH_HELP_CANONICAL_PATH } from "@/lib/system-health-help-evidence-copy";
import {
  SYSTEM_HEALTH_HELP_BREADCRUMB_TOPIC_TITLE,
  SYSTEM_HEALTH_HELP_GUIDE_HEADINGS,
  SYSTEM_HEALTH_HELP_HOW_TO_READ_STEPS,
  SYSTEM_HEALTH_HELP_OVERVIEW,
  SYSTEM_HEALTH_HELP_PAGE_SUBTITLE,
  SYSTEM_HEALTH_HELP_PAGE_TITLE,
  SYSTEM_HEALTH_HELP_READINESS_HELPER,
  SYSTEM_HEALTH_HELP_TILE_ITEMS,
} from "@/lib/system-health-help-guide-content";
import { cn } from "@/lib/utils";
import { operatorPageContainerClass } from "@/components/operator/OperatorPageContainer";

type HelpSystemHealthGuideViewProps = {
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

/** Operator system health orientation for `/help/system-health`. */
export function HelpSystemHealthGuideView(props: HelpSystemHealthGuideViewProps): React.ReactElement {
  const { entry } = props;
  const contentGridClass = resolveHelpPageContentGridClass(SYSTEM_HEALTH_HELP_GUIDE_HEADINGS.length);
  const readingBodyClass = cn("m-0 leading-relaxed", HELP_PAGE_LAYOUT.readingBody);

  return (
    <article className={cn(operatorPageContainerClass("workflow"), OPERATOR_LAYOUT.majorSectionGap)} data-testid="help-system-health-guide">
      <HelpTopicHashScroll />

      <HelpTopicGuidePageHeader
        title={SYSTEM_HEALTH_HELP_PAGE_TITLE}
        titleTestId="help-system-health-page-title"
        subtitle={SYSTEM_HEALTH_HELP_PAGE_SUBTITLE}
        navHref={SYSTEM_HEALTH_HELP_CANONICAL_PATH}
        headingLevel="h1"
        breadcrumb={<HelpTopicBreadcrumb topicTitle={SYSTEM_HEALTH_HELP_BREADCRUMB_TOPIC_TITLE} />}
        metadata={<HelpTopicRegistryProvenanceLine entry={entry} />}
        actions={<HelpSystemHealthHeaderActions />}
      />

      <div className={contentGridClass}>
        <div className={cn(HELP_PAGE_LAYOUT.contentColumn, "space-y-4")}>
          <p className={readingBodyClass} data-testid="help-system-health-overview">
            {SYSTEM_HEALTH_HELP_OVERVIEW}
          </p>
          <p
            className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}
            data-testid="help-system-health-readiness-helper"
          >
            {SYSTEM_HEALTH_HELP_READINESS_HELPER}
          </p>

          <section
            aria-labelledby="what-system-health-shows"
            className="space-y-3 border-t border-neutral-200 pt-4 dark:border-neutral-800"
          >
            <HelpSectionHeading id="what-system-health-shows">What system health shows</HelpSectionHeading>
            <dl
              className={cn("m-0 grid gap-3 sm:grid-cols-2", HELP_PAGE_LAYOUT.readingBody)}
              data-testid="help-system-health-tile-items"
            >
              {SYSTEM_HEALTH_HELP_TILE_ITEMS.map((item) => (
                <div key={item.label}>
                  <dt className="font-medium text-al-text-primary">
                    {item.href === undefined ? (
                      item.label
                    ) : (
                      <Link className={OPERATOR_LINK.nav} href={item.href}>
                        {item.label}
                      </Link>
                    )}
                  </dt>
                  <dd className="m-0 mt-1 text-al-text-secondary">{item.detail}</dd>
                </div>
              ))}
            </dl>
          </section>

          <section
            aria-labelledby="how-system-health-works"
            className="space-y-3 border-t border-neutral-200 pt-4 dark:border-neutral-800"
          >
            <HelpSectionHeading id="how-system-health-works">{SYSTEM_HEALTH_HELP_TOPIC_LABEL}</HelpSectionHeading>
            <ol
              className={cn("m-0 list-decimal space-y-2 pl-5", HELP_PAGE_LAYOUT.readingBody)}
              data-testid="help-system-health-how-stepper"
            >
              {SYSTEM_HEALTH_HELP_HOW_TO_READ_STEPS.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ol>
          </section>

          <div className="border-t border-neutral-200 pt-4 dark:border-neutral-800">
            <SystemHealthHelpEvidenceOrientationStrip />
          </div>
        </div>

        <HelpTopicTableOfContents headings={SYSTEM_HEALTH_HELP_GUIDE_HEADINGS} />
      </div>
    </article>
  );
}
