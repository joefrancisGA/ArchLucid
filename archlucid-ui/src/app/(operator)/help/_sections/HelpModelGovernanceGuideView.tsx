import Link from "next/link";

import { HelpTopicHashScroll } from "@/app/(operator)/help/HelpTopicHashScroll";
import { ModelGovernanceHelpEvidenceOrientationStrip } from "@/components/help/ModelGovernanceHelpEvidenceOrientationStrip";
import { HelpTopicGuidePageHeader } from "@/components/help/HelpTopicGuidePageHeader";
import { HelpTopicRegistryProvenanceLine } from "@/components/help/HelpTopicRegistryProvenanceLine";
import { HelpTopicTableOfContents } from "@/components/help/HelpTopicTableOfContents";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageContextualHelpButton } from "@/components/usability/PageContextualHelpButton";
import {
  OPERATOR_CARD,
  OPERATOR_LAYOUT,
  OPERATOR_LINK,
  OPERATOR_SHELL_SCROLL_OFFSET_CLASS,
  OPERATOR_TYPOGRAPHY,
} from "@/lib/design-tokens";
import { HELP_PAGE_LAYOUT, resolveHelpPageContentGridClass } from "@/lib/help/help-page-layout";
import {
  MODEL_GOVERNANCE_HELP_BREADCRUMB_TOPIC_TITLE,
  MODEL_GOVERNANCE_HELP_DATA_BOUNDARY_EMBEDDINGS,
  MODEL_GOVERNANCE_HELP_DATA_BOUNDARY_LEAD,
  MODEL_GOVERNANCE_HELP_DATA_HANDLING_HREF,
  MODEL_GOVERNANCE_HELP_FEATURE_ITEMS,
  MODEL_GOVERNANCE_HELP_GUIDE_HEADINGS,
  MODEL_GOVERNANCE_HELP_HOW_TO_READ_STEPS,
  MODEL_GOVERNANCE_HELP_OVERVIEW,
  MODEL_GOVERNANCE_HELP_PAGE_SUBTITLE,
  MODEL_GOVERNANCE_HELP_PAGE_TITLE,
  MODEL_GOVERNANCE_HELP_PRIMARY_ACTION,
  MODEL_GOVERNANCE_HELP_START_HERE_CARD_TITLE,
  MODEL_GOVERNANCE_HELP_SUBPROCESSORS_HREF,
} from "@/lib/model-governance-help-guide-content";
import { MODEL_GOVERNANCE_HELP_CANONICAL_PATH } from "@/lib/model-governance-help-evidence-copy";
import { MODEL_GOVERNANCE_HELP_TOPIC_LABEL } from "@/lib/model-governance-settings-evidence-copy";
import type { ProductDocumentationEntry } from "@/lib/product-documentation-registry";
import { cn } from "@/lib/utils";

type HelpModelGovernanceGuideViewProps = {
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

/** Operator model governance orientation for `/help/model-governance`. */
export function HelpModelGovernanceGuideView(props: HelpModelGovernanceGuideViewProps): React.ReactElement {
  const { entry } = props;
  const contentGridClass = resolveHelpPageContentGridClass(MODEL_GOVERNANCE_HELP_GUIDE_HEADINGS.length);
  const readingBodyClass = cn("m-0 leading-relaxed", HELP_PAGE_LAYOUT.readingBody);

  return (
    <article
      className={cn(OPERATOR_LAYOUT.majorSectionGap, "w-full max-w-[72rem]")}
      data-testid="help-model-governance-guide"
    >
      <HelpTopicHashScroll />

      <HelpTopicGuidePageHeader
        title={MODEL_GOVERNANCE_HELP_PAGE_TITLE}
        titleTestId="help-model-governance-page-title"
        subtitle={MODEL_GOVERNANCE_HELP_PAGE_SUBTITLE}
        navHref={MODEL_GOVERNANCE_HELP_CANONICAL_PATH}
        headingLevel="h1"
        metadata={<HelpTopicRegistryProvenanceLine entry={entry} />}
        actions={<PageContextualHelpButton />}
      />

      <div className={contentGridClass}>
        <div className={cn(HELP_PAGE_LAYOUT.contentColumn, "space-y-4")}>
          <p className={readingBodyClass} data-testid="help-model-governance-overview">
            {MODEL_GOVERNANCE_HELP_OVERVIEW}
          </p>

          <Card className="border-neutral-200 dark:border-neutral-800" data-testid="help-model-governance-action-panel">
            <CardHeader className={OPERATOR_CARD.header}>
              <CardTitle as="h2" className={cn("m-0", OPERATOR_TYPOGRAPHY.cardTitle)}>
                {MODEL_GOVERNANCE_HELP_START_HERE_CARD_TITLE}
              </CardTitle>
            </CardHeader>
            <CardContent className={cn(OPERATOR_CARD.content, "flex flex-wrap items-center gap-2")}>
              <Button asChild size="sm" variant="primary">
                <Link href={MODEL_GOVERNANCE_HELP_PRIMARY_ACTION.href}>
                  {MODEL_GOVERNANCE_HELP_PRIMARY_ACTION.label}
                </Link>
              </Button>
            </CardContent>
          </Card>

          <section
            aria-labelledby="data-boundary"
            className="space-y-3 border-t border-neutral-200 pt-4 dark:border-neutral-800"
          >
            <HelpSectionHeading id="data-boundary">Data boundary</HelpSectionHeading>
            <p className={readingBodyClass} data-testid="help-model-governance-data-boundary">
              {MODEL_GOVERNANCE_HELP_DATA_BOUNDARY_LEAD}{" "}
              <Link className={OPERATOR_LINK.inline} href={MODEL_GOVERNANCE_HELP_SUBPROCESSORS_HREF}>
                Subprocessors register
              </Link>{" "}
              lists disclosed external engines. {MODEL_GOVERNANCE_HELP_DATA_BOUNDARY_EMBEDDINGS}{" "}
              <Link className={OPERATOR_LINK.inline} href={MODEL_GOVERNANCE_HELP_DATA_HANDLING_HREF}>
                Data handling help
              </Link>{" "}
              covers residency and retention posture.
            </p>
          </section>

          <section
            aria-labelledby="what-model-governance-controls"
            className="space-y-3 border-t border-neutral-200 pt-4 dark:border-neutral-800"
          >
            <HelpSectionHeading id="what-model-governance-controls">What model governance controls</HelpSectionHeading>
            <dl
              className={cn("m-0 grid gap-3 sm:grid-cols-2", HELP_PAGE_LAYOUT.readingBody)}
              data-testid="help-model-governance-feature-items"
            >
              {MODEL_GOVERNANCE_HELP_FEATURE_ITEMS.map((item) => (
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
            aria-labelledby="how-model-governance-works"
            className="space-y-3 border-t border-neutral-200 pt-4 dark:border-neutral-800"
          >
            <HelpSectionHeading id="how-model-governance-works">{MODEL_GOVERNANCE_HELP_TOPIC_LABEL}</HelpSectionHeading>
            <ol
              className={cn("m-0 list-decimal space-y-2 pl-5", HELP_PAGE_LAYOUT.readingBody)}
              data-testid="help-model-governance-how-stepper"
            >
              {MODEL_GOVERNANCE_HELP_HOW_TO_READ_STEPS.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ol>
          </section>

          <ModelGovernanceHelpEvidenceOrientationStrip readingBodyClassName={HELP_PAGE_LAYOUT.readingBody} />
        </div>

        <HelpTopicTableOfContents headings={MODEL_GOVERNANCE_HELP_GUIDE_HEADINGS} />
      </div>
    </article>
  );
}
