import Link from "next/link";

import { HelpTopicHashScroll } from "@/app/(operator)/help/HelpTopicHashScroll";
import { BaselineSettingsHelpEvidenceOrientationStrip } from "@/components/help/BaselineSettingsHelpEvidenceOrientationStrip";
import { HelpTopicGuidePageHeader } from "@/components/help/HelpTopicGuidePageHeader";
import { HelpTopicRegistryProvenanceLine } from "@/components/help/HelpTopicRegistryProvenanceLine";
import { HelpTopicTableOfContents } from "@/components/help/HelpTopicTableOfContents";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusTag } from "@/components/ui/status-tag";
import { PageContextualHelpButton } from "@/components/usability/PageContextualHelpButton";
import {
  DESIGN_TOKENS,
  OPERATOR_CARD,
  OPERATOR_LAYOUT,
  OPERATOR_LINK,
  OPERATOR_SHELL_SCROLL_OFFSET_CLASS,
  OPERATOR_TYPOGRAPHY,
} from "@/lib/design-tokens";
import {
  BASELINE_SETTINGS_HELP_ANCHOR_ITEMS,
  BASELINE_SETTINGS_HELP_BASELINE_VS_ROI_BODY,
  BASELINE_SETTINGS_HELP_BASELINE_VS_ROI_TITLE,
  BASELINE_SETTINGS_HELP_BREADCRUMB_TOPIC_TITLE,
  BASELINE_SETTINGS_HELP_GUIDE_HEADINGS,
  BASELINE_SETTINGS_HELP_HOW_TO_READ_STEPS,
  BASELINE_SETTINGS_HELP_METHODOLOGY_HREF,
  BASELINE_SETTINGS_HELP_METHODOLOGY_LABEL,
  BASELINE_SETTINGS_HELP_OVERVIEW,
  BASELINE_SETTINGS_HELP_PAGE_SUBTITLE,
  BASELINE_SETTINGS_HELP_PAGE_TITLE,
  BASELINE_SETTINGS_HELP_PRIMARY_ACTION,
  BASELINE_SETTINGS_HELP_ROLE_PRECONDITION,
  BASELINE_SETTINGS_HELP_ROLE_PRECONDITION_TAG,
  BASELINE_SETTINGS_HELP_START_HERE_CARD_TITLE,
  BASELINE_SETTINGS_HELP_USED_IN_SURFACES,
} from "@/lib/baseline-settings-help-guide-content";
import { BASELINE_SETTINGS_HELP_CANONICAL_PATH } from "@/lib/baseline-settings-help-evidence-copy";
import { BASELINE_SAVED_CANNOT_BE_REMOVED_HELPER } from "@/lib/baseline-settings-present";
import { HELP_PAGE_LAYOUT, resolveHelpPageContentGridClass } from "@/lib/help/help-page-layout";
import type { ProductDocumentationEntry } from "@/lib/product-documentation-registry";
import { cn } from "@/lib/utils";

type HelpBaselineSettingsGuideViewProps = {
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

/** Operator baseline settings orientation for `/help/baseline-settings`. */
export function HelpBaselineSettingsGuideView(props: HelpBaselineSettingsGuideViewProps): React.ReactElement {
  const { entry } = props;
  const contentGridClass = resolveHelpPageContentGridClass(BASELINE_SETTINGS_HELP_GUIDE_HEADINGS.length);
  const readingBodyClass = cn("m-0 leading-relaxed", HELP_PAGE_LAYOUT.readingBody);

  return (
    <article
      className={cn(OPERATOR_LAYOUT.majorSectionGap, "w-full max-w-[72rem]")}
      data-testid="help-baseline-settings-guide"
    >
      <HelpTopicHashScroll />

      <HelpTopicGuidePageHeader
        title={BASELINE_SETTINGS_HELP_PAGE_TITLE}
        titleTestId="help-baseline-settings-page-title"
        subtitle={BASELINE_SETTINGS_HELP_PAGE_SUBTITLE}
        navHref={BASELINE_SETTINGS_HELP_CANONICAL_PATH}
        headingLevel="h1"
        metadata={<HelpTopicRegistryProvenanceLine entry={entry} />}
        actions={<PageContextualHelpButton />}
      />

      <div className={contentGridClass}>
        <div className={cn(HELP_PAGE_LAYOUT.contentColumn, "space-y-4")}>
          <p className={readingBodyClass} data-testid="help-baseline-settings-overview">
            {BASELINE_SETTINGS_HELP_OVERVIEW}
          </p>

          <Card className="border-neutral-200 dark:border-neutral-800" data-testid="help-baseline-settings-action-panel">
            <CardHeader className={OPERATOR_CARD.header}>
              <CardTitle as="h2" className={cn("m-0", OPERATOR_TYPOGRAPHY.cardTitle)}>
                {BASELINE_SETTINGS_HELP_START_HERE_CARD_TITLE}
              </CardTitle>
            </CardHeader>
            <CardContent className={cn(OPERATOR_CARD.content, "space-y-2")}>
              <aside
                className={cn(DESIGN_TOKENS.callout.warn, "p-3")}
                data-testid="help-baseline-settings-saved-baseline-warn"
              >
                <p className={cn("m-0", HELP_PAGE_LAYOUT.readingBody)}>{BASELINE_SAVED_CANNOT_BE_REMOVED_HELPER}</p>
              </aside>
              <div className="flex flex-wrap items-center gap-2">
                <Button asChild size="sm" variant="primary">
                  <Link href={BASELINE_SETTINGS_HELP_PRIMARY_ACTION.href}>
                    {BASELINE_SETTINGS_HELP_PRIMARY_ACTION.label}
                  </Link>
                </Button>
                <StatusTag
                  kind="neutral"
                  label={BASELINE_SETTINGS_HELP_ROLE_PRECONDITION_TAG}
                  data-testid="help-baseline-settings-role-precondition-tag"
                />
              </div>
              <p
                className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}
                data-testid="help-baseline-settings-role-precondition"
              >
                {BASELINE_SETTINGS_HELP_ROLE_PRECONDITION}
              </p>
            </CardContent>
          </Card>

          <section
            aria-labelledby="what-baseline-settings-captures"
            className="space-y-3 border-t border-neutral-200 pt-4 dark:border-neutral-800"
          >
            <HelpSectionHeading id="what-baseline-settings-captures">What baseline settings capture</HelpSectionHeading>
            <dl
              className={cn("m-0 grid gap-3 sm:grid-cols-2", HELP_PAGE_LAYOUT.readingBody)}
              data-testid="help-baseline-settings-anchor-items"
            >
              {BASELINE_SETTINGS_HELP_ANCHOR_ITEMS.map((item) => (
                <div key={item.label}>
                  <dt className="font-medium text-al-text-primary">{item.label}</dt>
                  <dd className="m-0 mt-1 text-al-text-secondary">{item.detail}</dd>
                </div>
              ))}
            </dl>
          </section>

          <section
            aria-labelledby="how-baseline-settings-work"
            className="space-y-3 border-t border-neutral-200 pt-4 dark:border-neutral-800"
          >
            <HelpSectionHeading id="how-baseline-settings-work">How baseline settings work</HelpSectionHeading>
            <ol
              className={cn("m-0 list-decimal space-y-2 pl-5", HELP_PAGE_LAYOUT.readingBody)}
              data-testid="help-baseline-settings-how-stepper"
            >
              {BASELINE_SETTINGS_HELP_HOW_TO_READ_STEPS.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ol>
            <p className={cn("m-0", HELP_PAGE_LAYOUT.readingBody)}>
              <Link className={OPERATOR_LINK.inline} href={BASELINE_SETTINGS_HELP_METHODOLOGY_HREF}>
                {BASELINE_SETTINGS_HELP_METHODOLOGY_LABEL} →
              </Link>
            </p>
          </section>

          <section
            aria-labelledby="baseline-vs-roi-summary"
            className="space-y-3 border-t border-neutral-200 pt-4 dark:border-neutral-800"
          >
            <HelpSectionHeading id="baseline-vs-roi-summary">{BASELINE_SETTINGS_HELP_BASELINE_VS_ROI_TITLE}</HelpSectionHeading>
            <p className={cn("m-0", HELP_PAGE_LAYOUT.readingBody)} data-testid="help-baseline-settings-baseline-vs-roi">
              {BASELINE_SETTINGS_HELP_BASELINE_VS_ROI_BODY}
            </p>
            <ul className={cn("m-0 list-disc space-y-1 pl-5", HELP_PAGE_LAYOUT.readingBody)}>
              {BASELINE_SETTINGS_HELP_USED_IN_SURFACES.map((surface) => (
                <li key={surface.href}>
                  <Link className={OPERATOR_LINK.inline} href={surface.href}>
                    {surface.label}
                  </Link>
                </li>
              ))}
            </ul>
          </section>

          <BaselineSettingsHelpEvidenceOrientationStrip readingBodyClassName={HELP_PAGE_LAYOUT.readingBody} />
        </div>

        <HelpTopicTableOfContents headings={BASELINE_SETTINGS_HELP_GUIDE_HEADINGS} />
      </div>
    </article>
  );
}
