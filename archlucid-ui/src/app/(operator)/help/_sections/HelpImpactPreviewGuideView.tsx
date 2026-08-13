import Link from "next/link";

import { HelpTopicHashScroll } from "@/app/(operator)/help/HelpTopicHashScroll";
import { ImpactPreviewHelpEvidenceOrientationStrip } from "@/components/help/ImpactPreviewHelpEvidenceOrientationStrip";
import { HelpTopicRegistryProvenanceLine } from "@/components/help/HelpTopicRegistryProvenanceLine";
import { HelpTopicTableOfContents } from "@/components/help/HelpTopicTableOfContents";
import { OperatorPageHeader } from "@/components/operator/OperatorPageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageContextualHelpButton } from "@/components/usability/PageContextualHelpButton";
import {
  IMPACT_PREVIEW_HELP_GUIDE_HEADINGS,
  IMPACT_PREVIEW_HELP_HOW_TO_READ_STEPS,
  IMPACT_PREVIEW_HELP_OVERVIEW,
  IMPACT_PREVIEW_HELP_PAGE_SUBTITLE,
  IMPACT_PREVIEW_HELP_PAGE_TITLE,
  IMPACT_PREVIEW_HELP_PRIMARY_ACTION,
  IMPACT_PREVIEW_HELP_TILE_ITEMS,
} from "@/lib/impact-preview-help-guide-content";
import { IMPACT_PREVIEW_HELP_CANONICAL_PATH } from "@/lib/impact-preview-help-evidence-copy";
import {
  OPERATOR_CARD,
  OPERATOR_LAYOUT,
  OPERATOR_SHELL_SCROLL_OFFSET_CLASS,
  OPERATOR_TYPOGRAPHY,
} from "@/lib/design-tokens";
import { HELP_PAGE_LAYOUT, resolveHelpPageContentGridClass } from "@/lib/help/help-page-layout";
import type { ProductDocumentationEntry } from "@/lib/product-documentation-registry";
import { cn } from "@/lib/utils";

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

/** Impact preview orientation for `/help/impact-preview`. */
export function HelpImpactPreviewGuideView(props: HelpImpactPreviewGuideViewProps): React.ReactElement {
  const { entry } = props;
  const contentGridClass = resolveHelpPageContentGridClass(IMPACT_PREVIEW_HELP_GUIDE_HEADINGS.length);

  return (
    <article
      className={cn(OPERATOR_LAYOUT.majorSectionGap, "w-full max-w-[72rem]")}
      data-testid="help-impact-preview-guide"
    >
      <HelpTopicHashScroll />

      <OperatorPageHeader
        title={IMPACT_PREVIEW_HELP_PAGE_TITLE}
        titleTestId="help-impact-preview-page-title"
        subtitle={IMPACT_PREVIEW_HELP_PAGE_SUBTITLE}
        navHref={IMPACT_PREVIEW_HELP_CANONICAL_PATH}
        headingLevel="h1"
        metadata={<HelpTopicRegistryProvenanceLine entry={entry} />}
        actions={<PageContextualHelpButton />}
      />

      <div className={contentGridClass}>
        <div className={cn(HELP_PAGE_LAYOUT.contentColumn, "space-y-4")}>
          <p className={cn("m-0 leading-relaxed", OPERATOR_TYPOGRAPHY.body)} data-testid="help-impact-preview-overview">
            {IMPACT_PREVIEW_HELP_OVERVIEW}
          </p>

          <Card className="border-neutral-200 dark:border-neutral-800" data-testid="help-impact-preview-action-panel">
            <CardHeader className={OPERATOR_CARD.header}>
              <CardTitle className={cn("m-0", OPERATOR_TYPOGRAPHY.cardTitle)}>
                {IMPACT_PREVIEW_HELP_PRIMARY_ACTION.label}
              </CardTitle>
            </CardHeader>
            <CardContent className={cn(OPERATOR_CARD.content, "flex flex-wrap items-center gap-2")}>
              <Button asChild size="sm" variant="primary">
                <Link href={IMPACT_PREVIEW_HELP_PRIMARY_ACTION.href}>{IMPACT_PREVIEW_HELP_PRIMARY_ACTION.label}</Link>
              </Button>
            </CardContent>
          </Card>

          <section
            aria-labelledby="what-impact-preview-shows"
            className="space-y-3 border-t border-neutral-200 pt-4 dark:border-neutral-800"
          >
            <HelpSectionHeading id="what-impact-preview-shows">What impact preview shows</HelpSectionHeading>
            <dl
              className={cn("m-0 grid gap-3 sm:grid-cols-2", OPERATOR_TYPOGRAPHY.body)}
              data-testid="help-impact-preview-tile-items"
            >
              {IMPACT_PREVIEW_HELP_TILE_ITEMS.map((item) => (
                <div key={item.label}>
                  <dt className="font-medium text-al-text-primary">{item.label}</dt>
                  <dd className="m-0 mt-1 text-al-text-secondary">{item.detail}</dd>
                </div>
              ))}
            </dl>
          </section>

          <section
            aria-labelledby="how-impact-preview-works"
            className="space-y-3 border-t border-neutral-200 pt-4 dark:border-neutral-800"
          >
            <HelpSectionHeading id="how-impact-preview-works">How impact preview works</HelpSectionHeading>
            <ol
              className={cn("m-0 list-decimal space-y-2 pl-5", OPERATOR_TYPOGRAPHY.body)}
              data-testid="help-impact-preview-how-stepper"
            >
              {IMPACT_PREVIEW_HELP_HOW_TO_READ_STEPS.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ol>
          </section>

          <ImpactPreviewHelpEvidenceOrientationStrip />
        </div>

        <HelpTopicTableOfContents headings={IMPACT_PREVIEW_HELP_GUIDE_HEADINGS} />
      </div>
    </article>
  );
}
