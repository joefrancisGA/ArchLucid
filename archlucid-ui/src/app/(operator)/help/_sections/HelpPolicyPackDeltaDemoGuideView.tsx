import Link from "next/link";

import { HelpTopicHashScroll } from "@/app/(operator)/help/HelpTopicHashScroll";
import { HelpTopicPrintButton } from "@/components/help/HelpTopicPrintButton";
import { HelpTopicTableOfContents } from "@/components/help/HelpTopicTableOfContents";
import { MarketingAccessibilityMarkdownFragment } from "@/components/marketing/MarketingAccessibilityMarkdownFragment";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { OperatorPageHeader } from "@/components/OperatorPageHeader";
import { PageContextualHelpButton } from "@/components/usability/PageContextualHelpButton";
import {
  POLICY_PACK_DELTA_DEMO_HELP_CLAIM_DISCIPLINE,
  POLICY_PACK_DELTA_DEMO_HELP_NARRATIVE_ARC,
  POLICY_PACK_DELTA_DEMO_HELP_OVERVIEW,
  POLICY_PACK_DELTA_DEMO_HELP_PAGE_SUBTITLE,
  POLICY_PACK_DELTA_DEMO_HELP_PAGE_TITLE,
  POLICY_PACK_DELTA_DEMO_HELP_PRIMARY_ACTIONS,
} from "@/lib/policy-pack-delta-demo-help-guide-content";
import { POLICY_PACK_DELTA_DEMO_HELP_PATH } from "@/lib/policy-pack-delta-demo-help-route";
import {
  DESIGN_TOKENS,
  OPERATOR_CARD,
  OPERATOR_LAYOUT,
  OPERATOR_TYPOGRAPHY,
} from "@/lib/design-tokens";
import { extractHelpMarkdownHeadings } from "@/lib/help-markdown-headings";
import { prepareHelpMarkdownForPresentation } from "@/lib/help-markdown-presentation";
import { HELP_PAGE_LAYOUT } from "@/lib/help-page-layout";
import type { ProductDocumentationEntry } from "@/lib/product-documentation-registry";
import { cn } from "@/lib/utils";

type HelpPolicyPackDeltaDemoGuideViewProps = {
  readonly entry: ProductDocumentationEntry;
  readonly markdown: string;
};

/** SE/Admin policy-pack delta demo orientation for `/help/policy-pack-delta-demo` (TB-1726). */
export function HelpPolicyPackDeltaDemoGuideView(
  props: HelpPolicyPackDeltaDemoGuideViewProps,
): React.ReactElement {
  const { entry, markdown } = props;
  const sourceDocPath = entry.sourcePaths[0] ?? "";
  const preparedMarkdown = prepareHelpMarkdownForPresentation(markdown, sourceDocPath, {
    helpTopicSlug: entry.slug,
  });
  const headings = extractHelpMarkdownHeadings(preparedMarkdown);

  return (
    <article
      className={cn(OPERATOR_LAYOUT.majorSectionGap, "w-full max-w-[72rem]")}
      data-testid="help-policy-pack-delta-demo-guide"
    >
      <HelpTopicHashScroll />

      <OperatorPageHeader
        title={POLICY_PACK_DELTA_DEMO_HELP_PAGE_TITLE}
        titleTestId="help-policy-pack-delta-demo-page-title"
        subtitle={POLICY_PACK_DELTA_DEMO_HELP_PAGE_SUBTITLE}
        navHref={POLICY_PACK_DELTA_DEMO_HELP_PATH}
        actions={
          <div
            className="flex flex-wrap items-center gap-2"
            data-testid="help-policy-pack-delta-demo-header-actions"
          >
            <PageContextualHelpButton />
            <HelpTopicPrintButton entry={entry} />
          </div>
        }
      />

      <div className="space-y-4 border-b border-neutral-200 pb-6 dark:border-neutral-800">
        <Card
          className="border-teal-200/80 bg-teal-50/40 dark:border-teal-900/50 dark:bg-teal-950/20"
          data-testid="help-policy-pack-delta-demo-action-panel"
        >
          <CardHeader className={OPERATOR_CARD.header}>
            <CardTitle className={cn("text-lg", OPERATOR_TYPOGRAPHY.sectionTitle)}>Run the demo surfaces</CardTitle>
          </CardHeader>
          <CardContent className={cn(OPERATOR_CARD.content, "flex flex-wrap items-center gap-2")}>
            <Button asChild size="sm" variant="primary">
              <Link href={POLICY_PACK_DELTA_DEMO_HELP_PRIMARY_ACTIONS.openPolicyPacks.href}>
                {POLICY_PACK_DELTA_DEMO_HELP_PRIMARY_ACTIONS.openPolicyPacks.label}
              </Link>
            </Button>
            <Button asChild size="sm" variant="outline">
              <Link href={POLICY_PACK_DELTA_DEMO_HELP_PRIMARY_ACTIONS.openStandardsAndRules.href}>
                {POLICY_PACK_DELTA_DEMO_HELP_PRIMARY_ACTIONS.openStandardsAndRules.label}
              </Link>
            </Button>
            <Link
              href={POLICY_PACK_DELTA_DEMO_HELP_PRIMARY_ACTIONS.openAuditTrail.href}
              className={cn(
                "text-sm underline-offset-2 hover:underline",
                DESIGN_TOKENS.accent.link,
                OPERATOR_TYPOGRAPHY.body,
              )}
            >
              {POLICY_PACK_DELTA_DEMO_HELP_PRIMARY_ACTIONS.openAuditTrail.label}
            </Link>
          </CardContent>
        </Card>
      </div>

      <div className={HELP_PAGE_LAYOUT.contentGrid}>
        <div className={cn("min-w-0 space-y-6", "max-w-[42rem] lg:max-w-none")}>
          <p className={cn("m-0", OPERATOR_TYPOGRAPHY.body)} data-testid="help-policy-pack-delta-demo-overview">
            {POLICY_PACK_DELTA_DEMO_HELP_OVERVIEW}
          </p>

          <section
            aria-labelledby="help-policy-pack-delta-demo-arc-heading"
            data-testid="help-policy-pack-delta-demo-narrative-arc"
          >
            <h2
              id="help-policy-pack-delta-demo-arc-heading"
              className={cn("m-0 text-al-text-primary", OPERATOR_TYPOGRAPHY.sectionTitle)}
            >
              Narrative arc (5 minutes)
            </h2>
            <ol className={cn("m-0 mt-2 list-decimal space-y-2 pl-5", OPERATOR_TYPOGRAPHY.body)}>
              {POLICY_PACK_DELTA_DEMO_HELP_NARRATIVE_ARC.map((beat) => (
                <li key={beat}>{beat}</li>
              ))}
            </ol>
          </section>

          <aside
            className="rounded-md border border-neutral-200 bg-white p-3 dark:border-neutral-800 dark:bg-neutral-950"
            data-testid="help-policy-pack-delta-demo-claim-discipline"
          >
            <h2 className={cn("m-0 text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}>Claim discipline</h2>
            <p className={cn("m-0 mt-2", OPERATOR_TYPOGRAPHY.body)}>{POLICY_PACK_DELTA_DEMO_HELP_CLAIM_DISCIPLINE}</p>
          </aside>

          <div className={HELP_PAGE_LAYOUT.contentColumn} data-testid="help-policy-pack-delta-demo-content">
            <MarketingAccessibilityMarkdownFragment
              markdownBody={markdown}
              tableCaption={`${entry.title} reference table`}
              presentation="help"
              sourceDocPath={sourceDocPath}
              helpTopicSlug={entry.slug}
            />
          </div>
        </div>

        <HelpTopicTableOfContents headings={headings} />
      </div>
    </article>
  );
}
