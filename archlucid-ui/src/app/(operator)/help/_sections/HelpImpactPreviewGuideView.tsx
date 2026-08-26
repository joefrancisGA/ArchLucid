import Link from "next/link";

import { HelpTopicHashScroll } from "@/app/(operator)/help/HelpTopicHashScroll";
import { ImpactPreviewHelpClaimDisciplineStrip } from "@/components/help/ImpactPreviewHelpClaimDisciplineStrip";
import { ImpactPreviewHelpEvidenceOrientationStrip } from "@/components/help/ImpactPreviewHelpEvidenceOrientationStrip";
import { HelpTopicGuidePageHeader } from "@/components/help/HelpTopicGuidePageHeader";
import { HelpTopicRegistryProvenanceLine } from "@/components/help/HelpTopicRegistryProvenanceLine";
import { HelpTopicTableOfContents } from "@/components/help/HelpTopicTableOfContents";
import { Button } from "@/components/ui/button";
import { StatusTag } from "@/components/ui/status-tag";
import { PageContextualHelpButton } from "@/components/usability/PageContextualHelpButton";
import { resolveGuideHeadingsForStrip } from "@/lib/claim-discipline-policy";
import {
  IMPACT_PREVIEW_HELP_BASELINE_PRECONDITION,
  IMPACT_PREVIEW_HELP_BASELINE_PRECONDITION_TAG,
  IMPACT_PREVIEW_HELP_CLAIM_HEADING_ID,
  IMPACT_PREVIEW_HELP_GUIDE_HEADINGS,
  IMPACT_PREVIEW_HELP_HOW_TO_READ_STEPS,
  IMPACT_PREVIEW_HELP_INPUT_TILE_ITEMS,
  IMPACT_PREVIEW_HELP_OUTPUT_TILE_ITEMS,
  IMPACT_PREVIEW_HELP_OVERVIEW,
  IMPACT_PREVIEW_HELP_PAGE_SUBTITLE,
  IMPACT_PREVIEW_HELP_PAGE_TITLE,
  IMPACT_PREVIEW_HELP_PRIMARY_ACTION,
  IMPACT_PREVIEW_HELP_START_HERE_CARD_TITLE,
} from "@/lib/impact-preview-help-guide-content";
import { IMPACT_PREVIEW_HELP_CANONICAL_PATH } from "@/lib/impact-preview-help-evidence-copy";
import {
  OPERATOR_LAYOUT,
  OPERATOR_LINK,
  OPERATOR_SHELL_SCROLL_OFFSET_CLASS,
  OPERATOR_TYPOGRAPHY,
} from "@/lib/design-tokens";
import { HELP_PAGE_LAYOUT, resolveHelpPageContentGridClass } from "@/lib/help/help-page-layout";
import type { ProductDocumentationEntry } from "@/lib/product-documentation-registry";
import { cn } from "@/lib/utils";
import { operatorPageContainerClass } from "@/components/operator/OperatorPageContainer";

type HelpImpactPreviewGuideViewProps = {
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

function HelpTileList(props: {
  readonly items: readonly { readonly label: string; readonly detail: string; readonly href: string }[];
  readonly testId: string;
}): React.ReactElement {
  return (
    <dl
      className={cn("m-0 grid gap-3 sm:grid-cols-2", HELP_PAGE_LAYOUT.readingBody)}
      data-testid={props.testId}
    >
      {props.items.map((item) => (
        <div key={item.label}>
          <dt className="font-medium text-al-text-primary">
            <Link className={OPERATOR_LINK.nav} href={item.href}>
              {item.label}
            </Link>
          </dt>
          <dd className="m-0 mt-1 text-al-text-secondary">{item.detail}</dd>
        </div>
      ))}
    </dl>
  );
}

/** Impact preview orientation for `/help/impact-preview`. */
export function HelpImpactPreviewGuideView(props: HelpImpactPreviewGuideViewProps): React.ReactElement {
  const { entry } = props;
  const guideHeadings = resolveGuideHeadingsForStrip(
    "help-impact-preview",
    IMPACT_PREVIEW_HELP_GUIDE_HEADINGS,
    IMPACT_PREVIEW_HELP_CLAIM_HEADING_ID,
  );
  const contentGridClass = resolveHelpPageContentGridClass(guideHeadings.length);
  const readingBodyClass = cn("m-0 leading-relaxed", HELP_PAGE_LAYOUT.readingBody);

  return (
    <article
      className={cn(operatorPageContainerClass("workflow"), OPERATOR_LAYOUT.majorSectionGap)}
      data-testid="help-impact-preview-guide"
    >
      <HelpTopicHashScroll />

      <HelpTopicGuidePageHeader
        title={IMPACT_PREVIEW_HELP_PAGE_TITLE}
        titleTestId="help-impact-preview-page-title"
        subtitle={IMPACT_PREVIEW_HELP_PAGE_SUBTITLE}
        navHref={IMPACT_PREVIEW_HELP_CANONICAL_PATH}
        headingLevel="h1"
        metadata={<HelpTopicRegistryProvenanceLine entry={entry} />}
        actions={<PageContextualHelpButton />}
      />

      <ImpactPreviewHelpClaimDisciplineStrip />

      <div className={contentGridClass}>
        <div className={cn(HELP_PAGE_LAYOUT.contentColumn, "space-y-4")}>
          <ImpactPreviewHelpEvidenceOrientationStrip readingBodyClassName={HELP_PAGE_LAYOUT.readingBody} />

          <p className={readingBodyClass} data-testid="help-impact-preview-overview">
            {IMPACT_PREVIEW_HELP_OVERVIEW}
          </p>

          <section
            className="space-y-3 rounded-md border border-neutral-200 bg-neutral-50/80 p-4 dark:border-neutral-700 dark:bg-neutral-900/40"
            data-testid="help-impact-preview-action-panel"
            aria-labelledby="help-impact-preview-action-panel-heading"
          >
            <h2
              id="help-impact-preview-action-panel-heading"
              className={cn("m-0 text-al-text-primary", OPERATOR_TYPOGRAPHY.sectionTitle)}
            >
              {IMPACT_PREVIEW_HELP_START_HERE_CARD_TITLE}
            </h2>
            <div className="flex flex-wrap items-center gap-2">
              <Button asChild size="sm" variant="primary">
                <Link href={IMPACT_PREVIEW_HELP_PRIMARY_ACTION.href}>{IMPACT_PREVIEW_HELP_PRIMARY_ACTION.label}</Link>
              </Button>
              <StatusTag
                kind="neutral"
                label={IMPACT_PREVIEW_HELP_BASELINE_PRECONDITION_TAG}
                data-testid="help-impact-preview-baseline-precondition-tag"
              />
            </div>
            <p
              className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}
              data-testid="help-impact-preview-baseline-precondition"
            >
              {IMPACT_PREVIEW_HELP_BASELINE_PRECONDITION}
            </p>
          </section>

          <section
            aria-labelledby="what-you-provide"
            className="space-y-3 border-t border-neutral-200 pt-4 dark:border-neutral-800"
          >
            <HelpSectionHeading id="what-you-provide">What you provide</HelpSectionHeading>
            <HelpTileList items={IMPACT_PREVIEW_HELP_INPUT_TILE_ITEMS} testId="help-impact-preview-input-tile-items" />
          </section>

          <section
            aria-labelledby="what-impact-preview-returns"
            className="space-y-3 border-t border-neutral-200 pt-4 dark:border-neutral-800"
          >
            <HelpSectionHeading id="what-impact-preview-returns">What impact preview returns</HelpSectionHeading>
            <HelpTileList
              items={IMPACT_PREVIEW_HELP_OUTPUT_TILE_ITEMS}
              testId="help-impact-preview-output-tile-items"
            />
          </section>

          <section
            aria-labelledby="how-impact-preview-works"
            className="space-y-3 border-t border-neutral-200 pt-4 dark:border-neutral-800"
          >
            <HelpSectionHeading id="how-impact-preview-works">How impact preview works</HelpSectionHeading>
            <ol
              className={cn("m-0 list-decimal space-y-2 pl-5", HELP_PAGE_LAYOUT.readingBody)}
              data-testid="help-impact-preview-how-stepper"
            >
              {IMPACT_PREVIEW_HELP_HOW_TO_READ_STEPS.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ol>
          </section>
        </div>

        <HelpTopicTableOfContents headings={guideHeadings} />
      </div>
    </article>
  );
}
