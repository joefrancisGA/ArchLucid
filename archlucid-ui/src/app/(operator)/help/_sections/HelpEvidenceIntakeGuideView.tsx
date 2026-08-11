import Link from "next/link";

import { HelpEvidenceIntakePathStrip } from "@/app/(operator)/help/_sections/HelpEvidenceIntakePathStrip";
import { HelpEvidenceIntakeRelatedGuidesLinks } from "@/app/(operator)/help/_sections/HelpEvidenceIntakeRelatedGuidesLinks";
import { HelpEvidenceIntakeVerifyIntakePanel } from "@/app/(operator)/help/_sections/HelpEvidenceIntakeVerifyIntakePanel";
import { HelpTopicHashScroll } from "@/app/(operator)/help/HelpTopicHashScroll";
import { HelpTopicMarkdownPageHeader } from "@/app/(operator)/help/_sections/HelpTopicMarkdownPageHeader";
import { EvidenceIntakeHelpClaimDisciplineStrip } from "@/components/help/EvidenceIntakeHelpClaimDisciplineStrip";
import { HelpTopicTableOfContents } from "@/components/help/HelpTopicTableOfContents";
import { MarketingAccessibilityMarkdownFragment } from "@/components/marketing/MarketingAccessibilityMarkdownFragment";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DESIGN_TOKENS,
  OPERATOR_CARD,
  OPERATOR_LAYOUT,
  OPERATOR_TYPOGRAPHY,
} from "@/lib/design-tokens";
import { EVIDENCE_INTAKE_HELP_PRIMARY_ACTION } from "@/lib/evidence-intake-help-evidence-copy";
import {
  EVIDENCE_INTAKE_HELP_HERO_OVERVIEW,
  EVIDENCE_INTAKE_HELP_PRIMARY_ACTIONS,
} from "@/lib/evidence-intake-help-guide-content";
import { extractHelpMarkdownHeadings } from "@/lib/help-markdown-headings";
import { prepareHelpMarkdownForPresentation } from "@/lib/help-markdown-presentation";
import { HELP_PAGE_LAYOUT } from "@/lib/help-page-layout";
import type { ProductDocumentationEntry } from "@/lib/product-documentation-registry";
import { cn } from "@/lib/utils";

type HelpEvidenceIntakeGuideViewProps = {
  readonly entry: ProductDocumentationEntry;
  readonly markdown: string;
};

/** Wizard companion for `/help/evidence-intake` (TB-1350). */
export function HelpEvidenceIntakeGuideView(props: HelpEvidenceIntakeGuideViewProps): React.ReactElement {
  const { entry, markdown } = props;
  const sourceDocPath = entry.sourcePaths[0] ?? "";
  const preparedMarkdown = prepareHelpMarkdownForPresentation(markdown, sourceDocPath, {
    helpTopicSlug: entry.slug,
  });
  const headings = extractHelpMarkdownHeadings(preparedMarkdown);

  return (
    <article
      className={cn(OPERATOR_LAYOUT.majorSectionGap, "w-full max-w-[72rem]")}
      data-testid="help-evidence-intake-guide"
    >
      <HelpTopicHashScroll />

      <HelpTopicMarkdownPageHeader
        entry={entry}
        showContextualHelp
        primaryAction={EVIDENCE_INTAKE_HELP_PRIMARY_ACTION}
      />

      <div
        className="space-y-4 border-b border-neutral-200 pb-6 dark:border-neutral-800"
        data-testid="help-evidence-intake-first-viewport"
      >
        <p className={cn("m-0 max-w-3xl text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)} data-testid="help-evidence-intake-overview">
          {EVIDENCE_INTAKE_HELP_HERO_OVERVIEW}
        </p>

        <Card
          className="border-teal-200/80 bg-teal-50/40 dark:border-teal-900/50 dark:bg-teal-950/20"
          data-testid="help-evidence-intake-action-panel"
        >
          <CardHeader className={OPERATOR_CARD.header}>
            <CardTitle className={cn("text-lg", OPERATOR_TYPOGRAPHY.sectionTitle)}>
              Start evidence intake
            </CardTitle>
          </CardHeader>
          <CardContent className={cn(OPERATOR_CARD.content, "flex flex-wrap items-center gap-2")}>
            <Button asChild size="sm" variant="primary">
              <Link href={EVIDENCE_INTAKE_HELP_PRIMARY_ACTIONS.startReview.href}>
                {EVIDENCE_INTAKE_HELP_PRIMARY_ACTIONS.startReview.label}
              </Link>
            </Button>
            <Button asChild size="sm" variant="outline">
              <Link href={EVIDENCE_INTAKE_HELP_PRIMARY_ACTIONS.openCloudConnections.href}>
                {EVIDENCE_INTAKE_HELP_PRIMARY_ACTIONS.openCloudConnections.label}
              </Link>
            </Button>
            <Link
              href={EVIDENCE_INTAKE_HELP_PRIMARY_ACTIONS.openCloudConnectionsHelp.href}
              className={cn(
                "text-sm underline-offset-2 hover:underline",
                DESIGN_TOKENS.accent.link,
                OPERATOR_TYPOGRAPHY.body,
              )}
            >
              {EVIDENCE_INTAKE_HELP_PRIMARY_ACTIONS.openCloudConnectionsHelp.label}
            </Link>
          </CardContent>
        </Card>

        <HelpEvidenceIntakePathStrip />
        <HelpEvidenceIntakeVerifyIntakePanel />
        <EvidenceIntakeHelpClaimDisciplineStrip />
      </div>

      <div className={HELP_PAGE_LAYOUT.contentGrid}>
        <div className={cn("min-w-0 space-y-6", HELP_PAGE_LAYOUT.contentColumn)} data-testid="help-topic-content">
          <MarketingAccessibilityMarkdownFragment
            markdownBody={markdown}
            tableCaption={`${entry.title} reference table`}
            presentation="help"
            sourceDocPath={sourceDocPath}
            helpTopicSlug={entry.slug}
            preparedMarkdownOverride={preparedMarkdown}
          />

          <section
            aria-labelledby="help-evidence-intake-related-heading"
            className="rounded-md border border-neutral-200 bg-white p-3 dark:border-neutral-800 dark:bg-neutral-950"
            data-testid="help-evidence-intake-related-guides"
            id="related-guides"
          >
            <h2
              id="help-evidence-intake-related-heading"
              className={cn("m-0 text-al-text-primary", OPERATOR_TYPOGRAPHY.sectionTitle)}
            >
              Related guides
            </h2>
            <div className="mt-2">
              <HelpEvidenceIntakeRelatedGuidesLinks />
            </div>
          </section>
        </div>

        <HelpTopicTableOfContents headings={headings} enableScrollSpy />
      </div>
    </article>
  );
}
