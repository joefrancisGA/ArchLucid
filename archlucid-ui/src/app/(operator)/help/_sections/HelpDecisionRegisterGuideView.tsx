import Link from "next/link";

import { HelpTopicHashScroll } from "@/app/(operator)/help/HelpTopicHashScroll";
import { DecisionRegisterHelpEvidenceOrientationStrip } from "@/components/help/DecisionRegisterHelpEvidenceOrientationStrip";
import { HelpTopicGuidePageHeader } from "@/components/help/HelpTopicGuidePageHeader";
import { HelpTopicRegistryProvenanceLine } from "@/components/help/HelpTopicRegistryProvenanceLine";
import { HelpTopicTableOfContents } from "@/components/help/HelpTopicTableOfContents";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageContextualHelpButton } from "@/components/usability/PageContextualHelpButton";
import {
  DECISION_REGISTER_HELP_BREADCRUMB_TOPIC_TITLE,
  DECISION_REGISTER_HELP_GUIDE_HEADINGS,
  DECISION_REGISTER_HELP_HOW_TO_READ_STEPS,
  DECISION_REGISTER_HELP_OVERVIEW,
  DECISION_REGISTER_HELP_PAGE_SUBTITLE,
  DECISION_REGISTER_HELP_PAGE_TITLE,
  DECISION_REGISTER_HELP_PRIMARY_ACTION,
  DECISION_REGISTER_HELP_START_HERE_CARD_TITLE,
  DECISION_REGISTER_HELP_START_HERE_HELPER,
  DECISION_REGISTER_HELP_START_HERE_PRECONDITION,
  DECISION_REGISTER_HELP_FIELD_EXAMPLES,
  DECISION_REGISTER_HELP_TILE_ITEMS,
} from "@/lib/decision-register-help-guide-content";
import { DECISION_REGISTER_HELP_CANONICAL_PATH } from "@/lib/decision-register-help-evidence-copy";
import {
  DESIGN_TOKENS,
  OPERATOR_CARD,
  OPERATOR_LAYOUT,
  OPERATOR_SHELL_SCROLL_OFFSET_CLASS,
  OPERATOR_TYPOGRAPHY,
} from "@/lib/design-tokens";
import { HELP_PAGE_LAYOUT, resolveHelpPageContentGridClass } from "@/lib/help/help-page-layout";
import type { ProductDocumentationEntry } from "@/lib/product-documentation-registry";
import { cn } from "@/lib/utils";

type HelpDecisionRegisterGuideViewProps = {
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

/** Decision register orientation for `/help/decision-register`. */
export function HelpDecisionRegisterGuideView(props: HelpDecisionRegisterGuideViewProps): React.ReactElement {
  const { entry } = props;
  const contentGridClass = resolveHelpPageContentGridClass(DECISION_REGISTER_HELP_GUIDE_HEADINGS.length);
  const readingBodyClass = cn("m-0 leading-relaxed", HELP_PAGE_LAYOUT.readingBody);

  return (
    <article
      className={cn(OPERATOR_LAYOUT.majorSectionGap, "w-full max-w-[72rem]")}
      data-testid="help-decision-register-guide"
    >
      <HelpTopicHashScroll />

      <HelpTopicGuidePageHeader
        title={DECISION_REGISTER_HELP_PAGE_TITLE}
        titleTestId="help-decision-register-page-title"
        subtitle={DECISION_REGISTER_HELP_PAGE_SUBTITLE}
        navHref={DECISION_REGISTER_HELP_CANONICAL_PATH}
        headingLevel="h1"
        metadata={<HelpTopicRegistryProvenanceLine entry={entry} />}
        actions={<PageContextualHelpButton />}
      />

      <div className={contentGridClass}>
        <div className={cn(HELP_PAGE_LAYOUT.contentColumn, "space-y-4")}>
          <p className={readingBodyClass} data-testid="help-decision-register-overview">
            {DECISION_REGISTER_HELP_OVERVIEW}
          </p>

          <Card className="border-neutral-200 dark:border-neutral-800" data-testid="help-decision-register-action-panel">
            <CardHeader className={OPERATOR_CARD.header}>
              <CardTitle as="h2" className={cn("m-0", OPERATOR_TYPOGRAPHY.cardTitle)}>
                {DECISION_REGISTER_HELP_START_HERE_CARD_TITLE}
              </CardTitle>
            </CardHeader>
            <CardContent className={cn(OPERATOR_CARD.content, "space-y-2")}>
              <aside
                className={cn(DESIGN_TOKENS.callout.warn, "p-3")}
                data-testid="help-decision-register-start-here-precondition"
              >
                <p className={cn("m-0", HELP_PAGE_LAYOUT.readingBody)}>{DECISION_REGISTER_HELP_START_HERE_PRECONDITION}</p>
              </aside>
              <Button asChild size="sm" variant="primary">
                <Link href={DECISION_REGISTER_HELP_PRIMARY_ACTION.href}>
                  {DECISION_REGISTER_HELP_PRIMARY_ACTION.label}
                </Link>
              </Button>
              <p
                className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}
                data-testid="help-decision-register-start-here-helper"
              >
                {DECISION_REGISTER_HELP_START_HERE_HELPER}
              </p>
            </CardContent>
          </Card>

          <section
            aria-labelledby="what-decision-register-shows"
            className="space-y-3 border-t border-neutral-200 pt-4 dark:border-neutral-800"
          >
            <HelpSectionHeading id="what-decision-register-shows">What the decision register shows</HelpSectionHeading>
            <dl
              className={cn("m-0 grid gap-3 sm:grid-cols-2", HELP_PAGE_LAYOUT.readingBody)}
              data-testid="help-decision-register-tile-items"
            >
              {DECISION_REGISTER_HELP_TILE_ITEMS.map((item) => (
                <div key={item.label}>
                  <dt className="font-medium text-al-text-primary">{item.label}</dt>
                  <dd className="m-0 mt-1 text-al-text-secondary">{item.detail}</dd>
                </div>
              ))}
            </dl>
            <dl
              className={cn("m-0 grid gap-3 sm:grid-cols-2", HELP_PAGE_LAYOUT.readingBody)}
              data-testid="help-decision-register-field-examples"
            >
              {DECISION_REGISTER_HELP_FIELD_EXAMPLES.map((row) => (
                <div key={row.fieldLabel}>
                  <dt className="font-medium text-al-text-primary">{row.fieldLabel}</dt>
                  <dd className="m-0 mt-1 font-medium text-al-text-primary">{row.exampleValue}</dd>
                  <dd className="m-0 mt-1 text-al-text-secondary">{row.detail}</dd>
                </div>
              ))}
            </dl>
          </section>

          <section
            aria-labelledby="how-decision-register-works"
            className="space-y-3 border-t border-neutral-200 pt-4 dark:border-neutral-800"
          >
            <HelpSectionHeading id="how-decision-register-works">How the decision register works</HelpSectionHeading>
            <ol
              className={cn("m-0 list-decimal space-y-2 pl-5", HELP_PAGE_LAYOUT.readingBody)}
              data-testid="help-decision-register-how-stepper"
            >
              {DECISION_REGISTER_HELP_HOW_TO_READ_STEPS.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ol>
          </section>

          <DecisionRegisterHelpEvidenceOrientationStrip readingBodyClassName={HELP_PAGE_LAYOUT.readingBody} />
        </div>

        <HelpTopicTableOfContents headings={DECISION_REGISTER_HELP_GUIDE_HEADINGS} />
      </div>
    </article>
  );
}
