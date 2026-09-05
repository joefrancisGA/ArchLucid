import Link from "next/link";

import { HelpTopicHashScroll } from "@/app/(operator)/help/HelpTopicHashScroll";
import { HelpTopicMarkdownPageHeader } from "@/app/(operator)/help/_sections/HelpTopicMarkdownPageHeader";
import { HelpSecurityTrustHeaderActions } from "@/app/(operator)/help/_sections/HelpSecurityTrustHeaderActions";
import { HelpSecurityTrustSourcesOrientationStrip } from "@/app/(operator)/help/_sections/HelpSecurityTrustSourcesOrientationStrip";
import { SecurityTrustHelpClaimDisciplineStrip } from "@/components/help/SecurityTrustHelpClaimDisciplineStrip";
import { SecurityTrustHelpEvidenceOrientationStrip } from "@/components/help/SecurityTrustHelpEvidenceOrientationStrip";
import { SecurityTrustHelpNextSteps } from "@/components/help/SecurityTrustHelpNextSteps";
import { SecurityTrustHelpPostureSummary } from "@/components/help/SecurityTrustHelpPostureSummary";
import { HelpTopicGuidePageHeader } from "@/components/help/HelpTopicGuidePageHeader";
import { HelpTopicTableOfContents } from "@/components/help/HelpTopicTableOfContents";
import { MarketingAccessibilityMarkdownFragment } from "@/components/marketing/MarketingAccessibilityMarkdownFragment";
import { SecurityTrustHelpHubVocabularyRail } from "@/components/SecurityTrustHelpHubVocabularyRail";
import { Button } from "@/components/ui/button";
import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";
import { appendHelpClaimDisciplineTocHeadings } from "@/lib/help/help-markdown-headings";
import { extractHelpMarkdownHeadings } from "@/lib/help/help-markdown-headings";
import { prepareHelpMarkdownForPresentation } from "@/lib/help/help-markdown-presentation";
import { HELP_PAGE_LAYOUT, resolveHelpPageContentGridClass } from "@/lib/help/help-page-layout";
import type { ProductDocumentationEntry } from "@/lib/product-documentation-registry";
import { OPERATOR_LAYOUT, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import {
  SECURITY_TRUST_HELP_ACTION_PANEL_TITLE,
  SECURITY_TRUST_HELP_CLAIM_DISCIPLINE_EXPORT,
  SECURITY_TRUST_HELP_PAGE_SUBTITLE,
  SECURITY_TRUST_HELP_PAGE_TITLE,
} from "@/lib/security-trust-help-guide-content";
import {
  SECURITY_TRUST_HELP_CANONICAL_PATH,
  SECURITY_TRUST_HELP_CLAIM_DISCIPLINE_HEADING,
  SECURITY_TRUST_HELP_CLAIM_HEADING_ID,
  SECURITY_TRUST_HELP_FOLLOW_UPS_TITLE,
  SECURITY_TRUST_HELP_PRIMARY_ACTION,
} from "@/lib/security-trust-help-evidence-copy";
import {
  SECURITY_TRUST_HELP_FIRST_VIEWPORT_TEST_ID,
  SECURITY_TRUST_HELP_HEADER_CLAIM_DISCIPLINE_TEST_ID,
  SECURITY_TRUST_HELP_PRIMARY_CONTENT_ID,
  SECURITY_TRUST_HELP_SKIP_LINK_LABEL,
  SECURITY_TRUST_HELP_SKIP_TARGET_ID,
} from "@/lib/security-trust-help-page-copy";
import {
  buildSecurityTrustTocGroups,
  computeSecurityTrustPostureCounts,
  countSecurityTrustPostureTableRows,
} from "@/lib/security-trust-help-presentation";
import { cn } from "@/lib/utils";
import { operatorPageContainerClass } from "@/components/operator/OperatorPageContainer";

type HelpSecurityTrustGuideViewProps = {
  readonly entry: ProductDocumentationEntry;
  readonly markdown: string;
};

/** Buyer security and trust orientation for `/help/security-trust` (HSE). */
export function HelpSecurityTrustGuideView(props: HelpSecurityTrustGuideViewProps): React.ReactElement {
  const { entry, markdown } = props;
  const buyerPolishedShell = isBuyerPolishedOperatorShellEnv();
  const sourceDocPath = entry.sourcePaths[0] ?? "";
  const preparedMarkdown = prepareHelpMarkdownForPresentation(markdown, sourceDocPath, {
    helpTopicSlug: entry.slug,
  });
  const extractedHeadings = extractHelpMarkdownHeadings(preparedMarkdown);
  const headings = buyerPolishedShell
    ? extractedHeadings
    : appendHelpClaimDisciplineTocHeadings(
        extractedHeadings,
        SECURITY_TRUST_HELP_CLAIM_HEADING_ID,
        SECURITY_TRUST_HELP_CLAIM_DISCIPLINE_HEADING,
        SECURITY_TRUST_HELP_FOLLOW_UPS_TITLE,
      );
  const tocGroups = buildSecurityTrustTocGroups(headings);
  const securityTrustPostureCounts = computeSecurityTrustPostureCounts(preparedMarkdown);
  const postureTableRowTotal = countSecurityTrustPostureTableRows(preparedMarkdown);
  const contentGridClass = resolveHelpPageContentGridClass(headings.length);

  return (
    <article
      className={cn(operatorPageContainerClass("workflow"), OPERATOR_LAYOUT.majorSectionGap)}
      data-testid="help-security-trust-guide"
    >
      <a href={`#${SECURITY_TRUST_HELP_SKIP_TARGET_ID}`} className={HELP_PAGE_LAYOUT.technicalReferenceSkipLink}>
        {SECURITY_TRUST_HELP_SKIP_LINK_LABEL}
      </a>
      <HelpTopicHashScroll />

      <div
        id={SECURITY_TRUST_HELP_PRIMARY_CONTENT_ID}
        data-testid={SECURITY_TRUST_HELP_PRIMARY_CONTENT_ID}
        className={cn("scroll-mt-24 space-y-6", OPERATOR_LAYOUT.sectionStack)}
      >
        {buyerPolishedShell ? (
          <HelpTopicGuidePageHeader
            title={SECURITY_TRUST_HELP_PAGE_TITLE}
            titleTestId="help-security-trust-page-title"
            subtitle={SECURITY_TRUST_HELP_PAGE_SUBTITLE}
            navHref={SECURITY_TRUST_HELP_CANONICAL_PATH}
            headingLevel="h1"
            claimDiscipline={SECURITY_TRUST_HELP_CLAIM_DISCIPLINE_EXPORT}
            claimDisciplineTestId={SECURITY_TRUST_HELP_HEADER_CLAIM_DISCIPLINE_TEST_ID}
            actions={<HelpSecurityTrustHeaderActions entry={entry} />}
          />
        ) : (
          <HelpTopicMarkdownPageHeader
            entry={entry}
            showContextualHelp
            primaryAction={SECURITY_TRUST_HELP_PRIMARY_ACTION}
          />
        )}

        {!buyerPolishedShell ? <SecurityTrustHelpClaimDisciplineStrip /> : null}

        {!buyerPolishedShell ? (
          <SecurityTrustHelpHubVocabularyRail currentSurfaceId="security-trust-help" />
        ) : null}

        <div
          id={SECURITY_TRUST_HELP_SKIP_TARGET_ID}
          data-testid={SECURITY_TRUST_HELP_FIRST_VIEWPORT_TEST_ID}
          className={cn(
            buyerPolishedShell ? "scroll-mt-24 space-y-4 border-b border-neutral-200 pb-6 dark:border-neutral-800" : undefined,
            buyerPolishedShell ? OPERATOR_LAYOUT.sectionStack : undefined,
          )}
        >
          {securityTrustPostureCounts !== null ? (
            <SecurityTrustHelpPostureSummary
              counts={securityTrustPostureCounts}
              tableRowTotal={postureTableRowTotal}
            />
          ) : null}

          {buyerPolishedShell ? (
            <section
              className="space-y-3 rounded-md border border-neutral-200 bg-neutral-50/80 p-4 dark:border-neutral-700 dark:bg-neutral-900/40"
              data-testid="help-security-trust-action-panel"
              aria-labelledby="help-security-trust-action-panel-heading"
            >
              <h2
                id="help-security-trust-action-panel-heading"
                className={cn("m-0 text-al-text-primary", OPERATOR_TYPOGRAPHY.sectionTitle)}
              >
                {SECURITY_TRUST_HELP_ACTION_PANEL_TITLE}
              </h2>
              <div className="flex flex-wrap items-center gap-2">
                <Button asChild size="sm" variant="primary" data-testid={SECURITY_TRUST_HELP_PRIMARY_ACTION.testId}>
                  <Link href={SECURITY_TRUST_HELP_PRIMARY_ACTION.href}>{SECURITY_TRUST_HELP_PRIMARY_ACTION.label}</Link>
                </Button>
                <Button asChild size="sm" variant="outline">
                  <Link href="/trust">Open Trust Center</Link>
                </Button>
                <Button asChild size="sm" variant="outline">
                  <Link href="/assurance-status">Assurance status</Link>
                </Button>
              </div>
            </section>
          ) : null}
        </div>

        <div className={contentGridClass}>
          <div className={HELP_PAGE_LAYOUT.contentColumn} data-testid="help-topic-content">
            {!buyerPolishedShell ? <SecurityTrustHelpEvidenceOrientationStrip /> : null}

            <MarketingAccessibilityMarkdownFragment
              markdownBody={markdown}
              tableCaption={`${entry.title} reference table`}
              presentation="help"
              sourceDocPath={sourceDocPath}
              helpTopicSlug={entry.slug}
              preparedMarkdownOverride={preparedMarkdown}
            />
          </div>

          <HelpTopicTableOfContents headings={headings} groups={tocGroups} enableScrollSpy />
        </div>

        {!buyerPolishedShell ? <SecurityTrustHelpNextSteps /> : null}

        {buyerPolishedShell ? (
          <div data-testid="help-security-trust-orientation-bottom">
            <HelpSecurityTrustSourcesOrientationStrip />
          </div>
        ) : null}
      </div>
    </article>
  );
}
