import Link from "next/link";

import { HelpTopicHashScroll } from "@/app/(operator)/help/HelpTopicHashScroll";
import { AdvisoryScansHelpEvidenceOrientationStrip } from "@/components/help/AdvisoryScansHelpEvidenceOrientationStrip";
import { HelpTopicGuidePageHeader } from "@/components/help/HelpTopicGuidePageHeader";
import { HelpTopicRegistryProvenanceLine } from "@/components/help/HelpTopicRegistryProvenanceLine";
import { HelpTopicTableOfContents } from "@/components/help/HelpTopicTableOfContents";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageContextualHelpButton } from "@/components/usability/PageContextualHelpButton";
import {
  ADVISORY_SCANS_HELP_FINALIZE_REVIEW_LINK,
  ADVISORY_SCANS_HELP_GUIDE_HEADINGS,
  ADVISORY_SCANS_HELP_HOW_TO_READ_STEPS,
  ADVISORY_SCANS_HELP_OVERVIEW,
  ADVISORY_SCANS_HELP_PAGE_SUBTITLE,
  ADVISORY_SCANS_HELP_PAGE_TITLE,
  ADVISORY_SCANS_HELP_PRIMARY_ACTION,
  ADVISORY_SCANS_HELP_START_HERE_CARD_TITLE,
  ADVISORY_SCANS_HELP_TILE_ITEMS,
  ADVISORY_SCANS_HUB_READER_ROLE_PRECONDITION,
} from "@/lib/advisory-scans-help-guide-content";
import { ADVISORY_SCANS_HELP_CANONICAL_PATH } from "@/lib/advisory-scans-help-evidence-copy";
import {
  OPERATOR_CARD,
  OPERATOR_LAYOUT,
  OPERATOR_LINK,
  OPERATOR_SHELL_SCROLL_OFFSET_CLASS,
  OPERATOR_TYPOGRAPHY,
} from "@/lib/design-tokens";
import { HELP_PAGE_LAYOUT, resolveHelpPageContentGridClass } from "@/lib/help/help-page-layout";
import type { ProductDocumentationEntry } from "@/lib/product-documentation-registry";
import { cn } from "@/lib/utils";

type HelpAdvisoryScansGuideViewProps = {
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

/** Advisory scans orientation for `/help/advisory-scans`. */
export function HelpAdvisoryScansGuideView(props: HelpAdvisoryScansGuideViewProps): React.ReactElement {
  const { entry } = props;
  const contentGridClass = resolveHelpPageContentGridClass(ADVISORY_SCANS_HELP_GUIDE_HEADINGS.length);

  return (
    <article
      className={cn(OPERATOR_LAYOUT.majorSectionGap, "w-full max-w-[72rem]")}
      data-testid="help-advisory-scans-guide"
    >
      <HelpTopicHashScroll />

      <HelpTopicGuidePageHeader
        topicTitle={ADVISORY_SCANS_HELP_PAGE_TITLE}
        title={ADVISORY_SCANS_HELP_PAGE_TITLE}
        titleTestId="help-advisory-scans-page-title"
        subtitle={ADVISORY_SCANS_HELP_PAGE_SUBTITLE}
        navHref={ADVISORY_SCANS_HELP_CANONICAL_PATH}
        headingLevel="h1"
        metadata={<HelpTopicRegistryProvenanceLine entry={entry} />}
        actions={<PageContextualHelpButton />}
      />

      <div className={contentGridClass}>
        <div className={cn(HELP_PAGE_LAYOUT.contentColumn, "space-y-4")}>
          <p className={cn("m-0 leading-relaxed", OPERATOR_TYPOGRAPHY.body)} data-testid="help-advisory-scans-overview">
            {ADVISORY_SCANS_HELP_OVERVIEW}
          </p>

          <Card className="border-neutral-200 dark:border-neutral-800" data-testid="help-advisory-scans-action-panel">
            <CardHeader className={OPERATOR_CARD.header}>
              <CardTitle as="h2" className={cn("m-0", OPERATOR_TYPOGRAPHY.cardTitle)}>
                {ADVISORY_SCANS_HELP_START_HERE_CARD_TITLE}
              </CardTitle>
            </CardHeader>
            <CardContent className={cn(OPERATOR_CARD.content, "space-y-2")}>
              <p
                className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}
                data-testid="help-advisory-scans-role-precondition"
              >
                {ADVISORY_SCANS_HUB_READER_ROLE_PRECONDITION}
              </p>
              <div className="flex flex-wrap items-center gap-2">
                <Button asChild size="sm" variant="primary">
                  <Link href={ADVISORY_SCANS_HELP_PRIMARY_ACTION.href}>{ADVISORY_SCANS_HELP_PRIMARY_ACTION.label}</Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          <section
            aria-labelledby="what-advisory-scans-show"
            className="space-y-3 border-t border-neutral-200 pt-4 dark:border-neutral-800"
          >
            <HelpSectionHeading id="what-advisory-scans-show">What advisory scans show</HelpSectionHeading>
            <dl
              className={cn("m-0 grid gap-3 sm:grid-cols-2", OPERATOR_TYPOGRAPHY.body)}
              data-testid="help-advisory-scans-tile-items"
            >
              {ADVISORY_SCANS_HELP_TILE_ITEMS.map((item) => (
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
          </section>

          <section
            aria-labelledby="how-advisory-scans-work"
            className="space-y-3 border-t border-neutral-200 pt-4 dark:border-neutral-800"
          >
            <HelpSectionHeading id="how-advisory-scans-work">How advisory scans work</HelpSectionHeading>
            <ol
              className={cn("m-0 list-decimal space-y-2 pl-5", OPERATOR_TYPOGRAPHY.body)}
              data-testid="help-advisory-scans-how-stepper"
            >
              <li>
                <Link className={OPERATOR_LINK.inline} href={ADVISORY_SCANS_HELP_FINALIZE_REVIEW_LINK.href}>
                  {ADVISORY_SCANS_HELP_FINALIZE_REVIEW_LINK.label}
                </Link>
                {" that should drive follow-up recommendations."}
              </li>
              {ADVISORY_SCANS_HELP_HOW_TO_READ_STEPS.slice(1).map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ol>
          </section>

          <AdvisoryScansHelpEvidenceOrientationStrip />
        </div>

        <HelpTopicTableOfContents headings={ADVISORY_SCANS_HELP_GUIDE_HEADINGS} />
      </div>
    </article>
  );
}
