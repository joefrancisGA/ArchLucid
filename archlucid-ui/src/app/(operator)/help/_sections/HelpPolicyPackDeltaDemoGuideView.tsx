import Link from "next/link";

import { HelpTopicHashScroll } from "@/app/(operator)/help/HelpTopicHashScroll";
import { PolicyPackDeltaDemoHelpClaimDisciplineStrip } from "@/components/help/PolicyPackDeltaDemoHelpClaimDisciplineStrip";
import { HelpTopicPrintButton } from "@/components/help/HelpTopicPrintButton";
import { HelpTopicTableOfContents } from "@/components/help/HelpTopicTableOfContents";
import { MarketingAccessibilityMarkdownFragment } from "@/components/marketing/MarketingAccessibilityMarkdownFragment";
import { Button } from "@/components/ui/button";
import { OperatorPageHeader } from "@/components/operator/OperatorPageHeader";
import { PageContextualHelpButton } from "@/components/usability/PageContextualHelpButton";
import {
  POLICY_PACK_DELTA_DEMO_HELP_NARRATIVE_ARC,
  POLICY_PACK_DELTA_DEMO_HELP_OVERVIEW,
  POLICY_PACK_DELTA_DEMO_HELP_PAGE_SUBTITLE,
  POLICY_PACK_DELTA_DEMO_HELP_PAGE_TITLE,
  POLICY_PACK_DELTA_DEMO_HELP_PRIMARY_ACTIONS,
} from "@/lib/policy/policy-pack-delta-demo-help-guide-content";
import { POLICY_PACK_DELTA_DEMO_HELP_PATH } from "@/lib/policy/policy-pack-delta-demo-help-route";
import {
  DESIGN_TOKENS,
  OPERATOR_LAYOUT,
  OPERATOR_TYPOGRAPHY,
} from "@/lib/design-tokens";
import { extractHelpMarkdownHeadings } from "@/lib/help/help-markdown-headings";
import { prepareHelpMarkdownForPresentation } from "@/lib/help/help-markdown-presentation";
import { HELP_PAGE_LAYOUT } from "@/lib/help/help-page-layout";
import type { ProductDocumentationEntry } from "@/lib/product-documentation-registry";
import { cn } from "@/lib/utils";
import { operatorPageContainerClass } from "@/components/operator/OperatorPageContainer";

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
      className={cn(operatorPageContainerClass("workflow"), OPERATOR_LAYOUT.majorSectionGap)}
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

      <PolicyPackDeltaDemoHelpClaimDisciplineStrip />

      <div className={HELP_PAGE_LAYOUT.contentGrid}>
        <div className={cn("min-w-0 space-y-6", "max-w-[42rem] lg:max-w-none")}>
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

          <p className={cn("m-0", OPERATOR_TYPOGRAPHY.body)} data-testid="help-policy-pack-delta-demo-overview">
            {POLICY_PACK_DELTA_DEMO_HELP_OVERVIEW}
          </p>

          <section
            className="space-y-3 rounded-md border border-neutral-200 bg-neutral-50/80 p-4 dark:border-neutral-700 dark:bg-neutral-900/40"
            data-testid="help-policy-pack-delta-demo-action-panel"
            aria-labelledby="help-policy-pack-delta-demo-action-panel-heading"
          >
            <h2
              id="help-policy-pack-delta-demo-action-panel-heading"
              className={cn("m-0 text-al-text-primary", OPERATOR_TYPOGRAPHY.sectionTitle)}
            >
              Run the demo surfaces
            </h2>
            <div className="flex flex-wrap items-center gap-2">
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
            </div>
          </section>

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
