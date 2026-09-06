import Link from "next/link";

import { HelpPolicyPacksClaimOrientationStrip } from "@/app/(operator)/help/_sections/HelpPolicyPacksClaimOrientationStrip";
import { HelpPolicyPacksHeaderActions } from "@/app/(operator)/help/_sections/HelpPolicyPacksHeaderActions";
import { HelpTopicHashScroll } from "@/app/(operator)/help/HelpTopicHashScroll";
import { HelpTopicGuidePageHeader } from "@/components/help/HelpTopicGuidePageHeader";
import { HelpTopicTableOfContents } from "@/components/help/HelpTopicTableOfContents";
import { MermaidDiagram } from "@/components/help/MermaidDiagram";
import { MarketingAccessibilityMarkdownFragment } from "@/components/marketing/MarketingAccessibilityMarkdownFragment";
import { Button } from "@/components/ui/button";
import { resolveGuideHeadingsForStrip } from "@/lib/claim-discipline-policy";
import {
  OPERATOR_LAYOUT,
  OPERATOR_TYPOGRAPHY,
} from "@/lib/design-tokens";
import { appendHelpClaimDisciplineTocHeadings, extractHelpMarkdownHeadings } from "@/lib/help/help-markdown-headings";
import { prepareHelpMarkdownForPresentation } from "@/lib/help/help-markdown-presentation";
import {
  HELP_PAGE_LAYOUT,
  HELP_PAGE_MIN_TOC_HEADINGS,
  resolveHelpPageContentGridClass,
} from "@/lib/help/help-page-layout";
import type { ProductDocumentationEntry } from "@/lib/product-documentation-registry";
import {
  POLICY_PACKS_HELP_CANONICAL_PATH,
  POLICY_PACKS_HELP_CLAIM_DISCIPLINE,
  POLICY_PACKS_HELP_CLAIM_HEADING_ID,
  POLICY_PACKS_HELP_PRIMARY_ACTION,
} from "@/lib/policy/policy-packs-help-evidence-copy";
import {
  POLICY_PACKS_HELP_DIAGRAM_SOURCE,
  POLICY_PACKS_HELP_DIAGRAM_SUMMARY,
} from "@/lib/policy/policy-packs-help-guide-content";
import {
  POLICY_PACKS_HELP_FIRST_VIEWPORT_TEST_ID,
  POLICY_PACKS_HELP_HEADER_CLAIM_DISCIPLINE_TEST_ID,
  POLICY_PACKS_HELP_PRIMARY_CONTENT_ID,
  POLICY_PACKS_HELP_SKIP_LINK_LABEL,
  POLICY_PACKS_HELP_SKIP_TARGET_ID,
} from "@/lib/policy/policy-packs-help-page-copy";
import { cn } from "@/lib/utils";
import { operatorPageContainerClass } from "@/components/operator/OperatorPageContainer";

type HelpPolicyPacksGuideViewProps = {
  readonly entry: ProductDocumentationEntry;
  readonly markdown: string;
};

/** Customer policy packs help — buyer-polished shell for `/help/policy-packs` (HEO). */
export function HelpPolicyPacksGuideView(props: HelpPolicyPacksGuideViewProps): React.ReactElement {
  const { entry, markdown } = props;
  const sourceDocPath = entry.sourcePaths[0] ?? "";
  const preparedMarkdown = prepareHelpMarkdownForPresentation(markdown, sourceDocPath, {
    helpTopicSlug: entry.slug,
  });
  const markdownHeadings = extractHelpMarkdownHeadings(preparedMarkdown);
  const headings = resolveGuideHeadingsForStrip(
    "help-policy-packs",
    appendHelpClaimDisciplineTocHeadings(markdownHeadings, POLICY_PACKS_HELP_CLAIM_HEADING_ID),
    POLICY_PACKS_HELP_CLAIM_HEADING_ID,
  );
  const contentGridClass = resolveHelpPageContentGridClass(headings.length);
  const showSectionNav = headings.length >= HELP_PAGE_MIN_TOC_HEADINGS;
  const readingBodyClass = cn("m-0 max-w-3xl leading-relaxed", HELP_PAGE_LAYOUT.readingBody);

  return (
    <article
      className={cn(operatorPageContainerClass("workflow"), OPERATOR_LAYOUT.majorSectionGap)}
      data-testid="help-policy-packs-guide"
    >
      <a href={`#${POLICY_PACKS_HELP_SKIP_TARGET_ID}`} className={HELP_PAGE_LAYOUT.technicalReferenceSkipLink}>
        {POLICY_PACKS_HELP_SKIP_LINK_LABEL}
      </a>
      <HelpTopicHashScroll />

      <div
        id={POLICY_PACKS_HELP_PRIMARY_CONTENT_ID}
        data-testid={POLICY_PACKS_HELP_PRIMARY_CONTENT_ID}
        className={cn("scroll-mt-24 space-y-6", OPERATOR_LAYOUT.sectionStack)}
      >
        <HelpTopicGuidePageHeader
          title={entry.title}
          titleTestId="help-policy-packs-page-title"
          subtitle={entry.summary}
          navHref={POLICY_PACKS_HELP_CANONICAL_PATH}
          headingLevel="h1"
          claimDiscipline={POLICY_PACKS_HELP_CLAIM_DISCIPLINE}
          claimDisciplineTestId={POLICY_PACKS_HELP_HEADER_CLAIM_DISCIPLINE_TEST_ID}
          actions={<HelpPolicyPacksHeaderActions entry={entry} />}
        />

        <div
          id={POLICY_PACKS_HELP_SKIP_TARGET_ID}
          data-testid={POLICY_PACKS_HELP_FIRST_VIEWPORT_TEST_ID}
          className={cn(
            "scroll-mt-24 space-y-6 border-b border-neutral-200 pb-6 dark:border-neutral-800",
            OPERATOR_LAYOUT.sectionStack,
          )}
        >
          <p className={readingBodyClass} data-testid="help-policy-packs-overview">
            {entry.summary}
          </p>

          <section
            aria-labelledby="help-policy-packs-merge-diagram-heading"
            className="space-y-3"
            data-testid="help-policy-packs-merge-diagram"
          >
            <h2
              id="help-policy-packs-merge-diagram-heading"
              className={cn("m-0 text-al-text-primary", OPERATOR_TYPOGRAPHY.sectionTitle)}
            >
              How packs merge across scope
            </h2>
            <p className={cn("m-0", readingBodyClass)}>{POLICY_PACKS_HELP_DIAGRAM_SUMMARY}</p>
            <div
              className={cn(
                "space-y-3 rounded-lg border border-neutral-200 bg-al-surface-raised p-4 dark:border-neutral-800",
                OPERATOR_TYPOGRAPHY.body,
              )}
              data-testid="help-policy-packs-mermaid-diagram"
            >
              <MermaidDiagram
                source={POLICY_PACKS_HELP_DIAGRAM_SOURCE}
                accessibleName="Policy pack hierarchical merge diagram"
              />
            </div>
          </section>

          <section
            className="space-y-3 rounded-md border border-neutral-200 bg-neutral-50/80 p-4 dark:border-neutral-700 dark:bg-neutral-900/40"
            data-testid="help-policy-packs-action-panel"
            aria-labelledby="help-policy-packs-action-panel-heading"
          >
            <h2
              id="help-policy-packs-action-panel-heading"
              className={cn("m-0 text-al-text-primary", OPERATOR_TYPOGRAPHY.sectionTitle)}
            >
              Open live policy packs
            </h2>
            <Button asChild size="sm" variant="primary">
              <Link href={POLICY_PACKS_HELP_PRIMARY_ACTION.href}>{POLICY_PACKS_HELP_PRIMARY_ACTION.label}</Link>
            </Button>
          </section>

          <div className={contentGridClass}>
            <div className={cn(HELP_PAGE_LAYOUT.contentColumn, "min-w-0")} data-testid="help-topic-content">
              <MarketingAccessibilityMarkdownFragment
                markdownBody={markdown}
                tableCaption={`${entry.title} reference table`}
                presentation="help"
                sourceDocPath={sourceDocPath}
                helpTopicSlug={entry.slug}
                preparedMarkdownOverride={preparedMarkdown}
              />
            </div>

            {showSectionNav ? <HelpTopicTableOfContents headings={headings} enableScrollSpy /> : null}
          </div>
        </div>

        <div data-testid="help-policy-packs-orientation-bottom">
          <HelpPolicyPacksClaimOrientationStrip />
        </div>
      </div>
    </article>
  );
}
