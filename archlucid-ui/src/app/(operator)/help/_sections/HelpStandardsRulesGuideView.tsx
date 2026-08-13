import Link from "next/link";

import { HelpTopicHashScroll } from "@/app/(operator)/help/HelpTopicHashScroll";
import { StandardsRulesHelpEvidenceOrientationStrip } from "@/components/help/StandardsRulesHelpEvidenceOrientationStrip";
import { HelpTopicRegistryProvenanceLine } from "@/components/help/HelpTopicRegistryProvenanceLine";
import { HelpTopicTableOfContents } from "@/components/help/HelpTopicTableOfContents";
import { OperatorPageBreadcrumb } from "@/components/operator/OperatorPageBreadcrumb";
import { OperatorPageHeader } from "@/components/operator/OperatorPageHeader";
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
import type { ProductDocumentationEntry } from "@/lib/product-documentation-registry";
import {
  STANDARDS_RULES_HELP_GUIDE_HEADINGS,
  STANDARDS_RULES_HELP_HOW_TO_READ_STEPS,
  STANDARDS_RULES_HELP_OVERVIEW,
  STANDARDS_RULES_HELP_PAGE_SUBTITLE,
  STANDARDS_RULES_HELP_PAGE_TITLE,
  STANDARDS_RULES_HELP_POLICY_PACKS_HELP_HREF,
  STANDARDS_RULES_HELP_PRIMARY_ACTION,
  STANDARDS_RULES_HELP_TABLE_ITEMS,
} from "@/lib/standards-rules-help-guide-content";
import { STANDARDS_RULES_HELP_CANONICAL_PATH } from "@/lib/standards-rules-help-evidence-copy";
import { cn } from "@/lib/utils";

type HelpStandardsRulesGuideViewProps = {
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

/** Operator standards & rules orientation for `/help/standards-and-rules`. */
export function HelpStandardsRulesGuideView(props: HelpStandardsRulesGuideViewProps): React.ReactElement {
  const { entry } = props;
  const contentGridClass = resolveHelpPageContentGridClass(STANDARDS_RULES_HELP_GUIDE_HEADINGS.length);

  return (
    <article
      className={cn(OPERATOR_LAYOUT.majorSectionGap, "w-full max-w-[72rem]")}
      data-testid="help-standards-rules-guide"
    >
      <HelpTopicHashScroll />

      <OperatorPageHeader
        title={STANDARDS_RULES_HELP_PAGE_TITLE}
        titleTestId="help-standards-rules-page-title"
        subtitle={STANDARDS_RULES_HELP_PAGE_SUBTITLE}
        navHref={STANDARDS_RULES_HELP_CANONICAL_PATH}
        headingLevel="h1"
        breadcrumb={
          <OperatorPageBreadcrumb
            data-testid="help-standards-rules-breadcrumb"
            items={[{ label: "Help", href: "/help" }, { label: STANDARDS_RULES_HELP_PAGE_TITLE }]}
          />
        }
        metadata={<HelpTopicRegistryProvenanceLine entry={entry} />}
        actions={<PageContextualHelpButton />}
      />

      <div className={contentGridClass}>
        <div className={cn(HELP_PAGE_LAYOUT.contentColumn, "space-y-4")}>
          <p className={cn("m-0 leading-relaxed", OPERATOR_TYPOGRAPHY.body)} data-testid="help-standards-rules-overview">
            {STANDARDS_RULES_HELP_OVERVIEW}
          </p>

          <Card className="border-neutral-200 dark:border-neutral-800" data-testid="help-standards-rules-action-panel">
            <CardHeader className={OPERATOR_CARD.header}>
              <CardTitle className={cn("m-0", OPERATOR_TYPOGRAPHY.cardTitle)}>Open standards & rules</CardTitle>
            </CardHeader>
            <CardContent className={cn(OPERATOR_CARD.content, "flex flex-wrap items-center gap-2")}>
              <Button asChild size="sm" variant="primary">
                <Link href={STANDARDS_RULES_HELP_PRIMARY_ACTION.href}>
                  {STANDARDS_RULES_HELP_PRIMARY_ACTION.label}
                </Link>
              </Button>
            </CardContent>
          </Card>

          <section
            aria-labelledby="what-standards-and-rules-shows"
            className="space-y-3 border-t border-neutral-200 pt-4 dark:border-neutral-800"
          >
            <HelpSectionHeading id="what-standards-and-rules-shows">What standards & rules shows</HelpSectionHeading>
            <dl
              className={cn("m-0 grid gap-3 sm:grid-cols-2", OPERATOR_TYPOGRAPHY.body)}
              data-testid="help-standards-rules-table-items"
            >
              {STANDARDS_RULES_HELP_TABLE_ITEMS.map((item) => (
                <div key={item.label}>
                  <dt className="font-medium text-al-text-primary">{item.label}</dt>
                  <dd className="m-0 mt-1 text-al-text-secondary">{item.detail}</dd>
                </div>
              ))}
            </dl>
          </section>

          <section
            aria-labelledby="how-to-read-standards-and-rules"
            className="space-y-3 border-t border-neutral-200 pt-4 dark:border-neutral-800"
          >
            <HelpSectionHeading id="how-to-read-standards-and-rules">How standards & rules work</HelpSectionHeading>
            <ol
              className={cn("m-0 list-decimal space-y-2 pl-5", OPERATOR_TYPOGRAPHY.body)}
              data-testid="help-standards-rules-how-stepper"
            >
              {STANDARDS_RULES_HELP_HOW_TO_READ_STEPS.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ol>
            <p className={cn("m-0", OPERATOR_TYPOGRAPHY.body)}>
              <Link className={OPERATOR_LINK.inline} href={STANDARDS_RULES_HELP_POLICY_PACKS_HELP_HREF}>
                Read policy packs help →
              </Link>
            </p>
          </section>

          <StandardsRulesHelpEvidenceOrientationStrip />
        </div>

        <HelpTopicTableOfContents headings={STANDARDS_RULES_HELP_GUIDE_HEADINGS} />
      </div>
    </article>
  );
}
