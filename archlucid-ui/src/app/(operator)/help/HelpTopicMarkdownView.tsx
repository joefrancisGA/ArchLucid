import Link from "next/link";

import type { ReactNode } from "react";



import { HelpTopicMarkdownPageHeader } from "@/app/(operator)/help/_sections/HelpTopicMarkdownPageHeader";

import { CaiqSigResponseHelpPostureSummary } from "@/components/help/CaiqSigResponseHelpPostureSummary";

import { ScopeHelpClaimDisciplineStrip } from "@/components/help/ScopeHelpClaimDisciplineStrip";

import { HelpTopicExportClaimDiscipline } from "@/components/help/HelpTopicExportClaimDiscipline";

import { HelpTopicHashScroll } from "@/app/(operator)/help/HelpTopicHashScroll";

import { HelpTopicTableOfContents } from "@/components/help/HelpTopicTableOfContents";

import { MarketingAccessibilityMarkdownFragment } from "@/components/marketing/MarketingAccessibilityMarkdownFragment";

import {

  buildCaiqSigResponseTocGroups,

  computeCaiqSigResponsePostureCounts,

  countCaiqSigResponseTableRows,

  isCaiqSigResponseHelpTopic,

  prepareCaiqSigResponseHelpMarkdown,

  type HelpTopicTocGroup,

} from "@/lib/caiq-sig-response-help-presentation";

import { DESIGN_TOKENS, OPERATOR_BODY_INLINE_LINK_CLASS, OPERATOR_LAYOUT, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

import { CAIQ_SIG_RESPONSE_HELP_PRIMARY_ACTION } from "@/lib/caiq-sig-response-help-evidence-copy";
import { INTEGRATION_READINESS_HELP_PRIMARY_ACTION } from "@/lib/integration-readiness-help-evidence-copy";
import { PROCUREMENT_HELP_CLAIM_DISCIPLINE } from "@/lib/procurement-help-evidence-copy";
import { isProcurementHelpTopic } from "@/lib/procurement-help-presentation";
import { POLICY_PACKS_HELP_PRIMARY_ACTION } from "@/lib/policy/policy-packs-help-evidence-copy";
import { REPORT_A_PROBLEM_HELP_PRIMARY_ACTION } from "@/lib/report-a-problem-help-evidence-copy";
import { SCOPE_HELP_PRIMARY_ACTION } from "@/lib/scope-help-evidence-copy";
import { SUBPROCESSORS_HELP_PRIMARY_ACTION } from "@/lib/subprocessors-help-evidence-copy";

import { HelpTopicCatchallSourcesOrientationStrip } from "@/components/help/HelpTopicCatchallSourcesOrientationStrip";
import { operatorPageContainerClass } from "@/components/operator/OperatorPageContainer";
import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";
import { resolveGuideHeadingsForStrip } from "@/lib/claim-discipline-policy";
import {
  HELP_TOPIC_CATCHALL_CLAIM_DISCIPLINE,
  HELP_TOPIC_CATCHALL_CLAIM_HEADING_ID,
  HELP_TOPIC_CATCHALL_FOLLOW_UPS_TITLE,
} from "@/lib/help/help-topic-catchall-evidence-copy";
import {
  HELP_TOPIC_CATCHALL_BUYER_START_HERE_HELPER,
  HELP_TOPIC_CATCHALL_FIRST_VIEWPORT_TEST_ID,
  HELP_TOPIC_CATCHALL_HEADER_CLAIM_DISCIPLINE_TEST_ID,
  HELP_TOPIC_CATCHALL_ORIENTATION_BOTTOM_TEST_ID,
  HELP_TOPIC_CATCHALL_OVERVIEW,
  HELP_TOPIC_CATCHALL_PAGE_LEAD,
  HELP_TOPIC_CATCHALL_PRIMARY_CONTENT_ID,
  HELP_TOPIC_CATCHALL_SKIP_LINK_LABEL,
  HELP_TOPIC_CATCHALL_SKIP_TARGET_ID,
  HELP_TOPIC_CATCHALL_START_HERE_CARD_TITLE,
} from "@/lib/help/help-topic-catchall-page-copy";

import { prepareHelpMarkdownForPresentation } from "@/lib/help/help-markdown-presentation";
import {
  appendHelpClaimDisciplineTocHeadings,
  extractHelpMarkdownHeadings,
} from "@/lib/help/help-markdown-headings";

import { HELP_PAGE_LAYOUT, resolveHelpPageContentGridClass } from "@/lib/help/help-page-layout";

import { resolveProductLineIdFromEnv } from "@/lib/product-line/resolve-product-line-id";

import type { ProductDocumentationEntry } from "@/lib/product-documentation-registry";

import { inAppHelpHref } from "@/lib/product-documentation-registry";

import { cn } from "@/lib/utils";



type HelpTopicMarkdownViewProps = {

  entry: ProductDocumentationEntry;

  markdown: string;

  /** Optional Evidence orientation strip (Sources + claim discipline). */

  readonly evidenceOrientation?: ReactNode;

  /** Optional header metadata under the title (status tag, reviewed date). */

  readonly titleBlockOrientation?: ReactNode;

  /** When true, show Category-1 PageContextualHelpButton in the header actions. */

  readonly showContextualHelp?: boolean;

  /** Optional grouped TOC parents (for example CAIQ Lite vs SIG Core). */

  readonly tocGroups?: readonly HelpTopicTocGroup[];

  /** When set with `evidenceOrientation`, appends claim-discipline + where-to-go-next TOC rows. */

  readonly claimDisciplineTocHeadingId?: string;

  readonly claimDisciplineTocHeadingTitle?: string;

  readonly followUpsTocTitle?: string;

  /** Wider technical-reference grid for dense questionnaire tables. */

  readonly layoutVariant?: "default" | "technicalReference";

  /** When true, render export claim discipline near PDF / print actions. */

  readonly showExportClaimDiscipline?: boolean;

  /** When true, render buyer-polished catch-all residual chrome (HE. fallthrough). */

  readonly catchallResidualBuyerChrome?: boolean;

};



/** Renders curated repo markdown inside the operator help shell (no GitHub chrome). */

export function HelpTopicMarkdownView(props: HelpTopicMarkdownViewProps): React.ReactElement {

  const {

    entry,

    markdown,

    evidenceOrientation,

    titleBlockOrientation,

    showContextualHelp,

    tocGroups,

    layoutVariant = "default",

    showExportClaimDiscipline = false,

    claimDisciplineTocHeadingId,

    claimDisciplineTocHeadingTitle,

    followUpsTocTitle,

    catchallResidualBuyerChrome = false,

  } = props;

  const buyerCatchallResidualChrome =
    catchallResidualBuyerChrome && isBuyerPolishedOperatorShellEnv();

  const sourceDocPath = entry.sourcePaths[0] ?? "";

  const preserveMaintenanceMetadata = entry.audience === "developer";

  const productLineId = resolveProductLineIdFromEnv();

  const isCaiqSigResponse = isCaiqSigResponseHelpTopic(entry.slug);

  const preparedMarkdown = isCaiqSigResponse

    ? prepareCaiqSigResponseHelpMarkdown(markdown, sourceDocPath)

    : prepareHelpMarkdownForPresentation(markdown, sourceDocPath, {

        preserveMaintenanceMetadata,

        helpTopicSlug: entry.slug,

        productLineId,

      });

  const extractedHeadings = extractHelpMarkdownHeadings(preparedMarkdown);

  const catchallHeadings = buyerCatchallResidualChrome
    ? resolveGuideHeadingsForStrip(
        "help-topic-catchall",
        appendHelpClaimDisciplineTocHeadings(
          extractedHeadings,
          HELP_TOPIC_CATCHALL_CLAIM_HEADING_ID,
          undefined,
          HELP_TOPIC_CATCHALL_FOLLOW_UPS_TITLE,
        ),
        HELP_TOPIC_CATCHALL_CLAIM_HEADING_ID,
      )
    : extractedHeadings;

  const headings =
    evidenceOrientation !== undefined && claimDisciplineTocHeadingId !== undefined
      ? appendHelpClaimDisciplineTocHeadings(
          extractedHeadings,
          claimDisciplineTocHeadingId,
          claimDisciplineTocHeadingTitle,
          followUpsTocTitle,
        )
      : catchallHeadings;

  const isScopeHelp = entry.slug === "scope";

  const resolvedTocGroups =

    tocGroups

    ?? (isCaiqSigResponse ? buildCaiqSigResponseTocGroups(headings) : undefined);

  const caiqSigPostureCounts = isCaiqSigResponse
    ? computeCaiqSigResponsePostureCounts(preparedMarkdown)
    : null;
  const postureTableRowTotal = isCaiqSigResponse
    ? countCaiqSigResponseTableRows(preparedMarkdown)
    : 0;

  const isIntegrationReadinessHelp = entry.slug === "integration-readiness";
  const isPolicyPacksHelp = entry.slug === "policy-packs";
  const isSubprocessorsHelp = entry.slug === "subprocessors";
  const isProcurementHelp = isProcurementHelpTopic(entry.slug);
  const allowWithoutServerPdf = entry.pdfStatus === null && (entry.audience === "buyer" || isProcurementHelp);

  const isTechnicalReferenceLayout = layoutVariant === "technicalReference";

  const contentGridClass = isTechnicalReferenceLayout

    ? HELP_PAGE_LAYOUT.technicalReferenceGrid

    : resolveHelpPageContentGridClass(headings.length);

  const contentColumnClass = isTechnicalReferenceLayout

    ? HELP_PAGE_LAYOUT.technicalReferenceColumn

    : HELP_PAGE_LAYOUT.contentColumn;

  const resolvedShowContextualHelp = buyerCatchallResidualChrome ? false : showContextualHelp;

  const header = (
    <HelpTopicMarkdownPageHeader
      entry={entry}
      showContextualHelp={resolvedShowContextualHelp}
      showExportClaimDiscipline={showExportClaimDiscipline}
      allowWithoutServerPdf={allowWithoutServerPdf}
      exportClaimDiscipline={
        showExportClaimDiscipline ? (
          <HelpTopicExportClaimDiscipline
            claimDiscipline={isProcurementHelp ? PROCUREMENT_HELP_CLAIM_DISCIPLINE : undefined}
          />
        ) : undefined
      }
      titleBlockOrientation={titleBlockOrientation}
      claimDiscipline={buyerCatchallResidualChrome ? HELP_TOPIC_CATCHALL_CLAIM_DISCIPLINE : undefined}
      claimDisciplineTestId={
        buyerCatchallResidualChrome ? HELP_TOPIC_CATCHALL_HEADER_CLAIM_DISCIPLINE_TEST_ID : undefined
      }
      primaryAction={
        isCaiqSigResponse
          ? CAIQ_SIG_RESPONSE_HELP_PRIMARY_ACTION
          : isIntegrationReadinessHelp
            ? INTEGRATION_READINESS_HELP_PRIMARY_ACTION
            : isPolicyPacksHelp
              ? POLICY_PACKS_HELP_PRIMARY_ACTION
              : isScopeHelp
                ? SCOPE_HELP_PRIMARY_ACTION
                : isSubprocessorsHelp
                  ? SUBPROCESSORS_HELP_PRIMARY_ACTION
                  : entry.slug === "report-a-problem"
                    ? REPORT_A_PROBLEM_HELP_PRIMARY_ACTION
                    : undefined
      }
    />
  );

  const developerRunbookLine =
    entry.audience === "developer" ? (
      <p className={`m-0 max-w-3xl ${OPERATOR_TYPOGRAPHY.label}`}>
        Engineering runbook — CLI commands, environment variables, and log detail. For symptom-first operator help,
        open{" "}
        <Link href={inAppHelpHref("troubleshooting")} className={OPERATOR_BODY_INLINE_LINK_CLASS}>
          Troubleshooting
        </Link>
        .
      </p>
    ) : null;

  const contentGrid = (
    <div className={contentGridClass}>
      <div className={contentColumnClass} data-testid="help-topic-content">
        {!evidenceOrientation ? null : evidenceOrientation}

        <MarketingAccessibilityMarkdownFragment
          markdownBody={markdown}
          tableCaption={`${entry.title} reference table`}
          presentation="help"
          sourceDocPath={entry.sourcePaths[0]}
          helpTopicSlug={entry.slug}
          preserveMaintenanceMetadata={preserveMaintenanceMetadata}
          preparedMarkdownOverride={preparedMarkdown}
          productLineId={productLineId}
        />
      </div>

      <HelpTopicTableOfContents headings={headings} groups={resolvedTocGroups} enableScrollSpy />
    </div>
  );

  return (
    <article
      className={cn(
        OPERATOR_LAYOUT.majorSectionGap,
        isTechnicalReferenceLayout ? HELP_PAGE_LAYOUT.technicalReferenceArticle : undefined,
        buyerCatchallResidualChrome ? operatorPageContainerClass("workflow") : undefined,
      )}
      data-testid={
        buyerCatchallResidualChrome
          ? "help-topic-catchall-residual"
          : isCaiqSigResponse
            ? "help-caiq-sig-response-topic"
            : undefined
      }
    >
      {buyerCatchallResidualChrome ? (
        <a href={`#${HELP_TOPIC_CATCHALL_SKIP_TARGET_ID}`} className={HELP_PAGE_LAYOUT.technicalReferenceSkipLink}>
          {HELP_TOPIC_CATCHALL_SKIP_LINK_LABEL}
        </a>
      ) : null}

      <HelpTopicHashScroll />

      {buyerCatchallResidualChrome ? (
        <div
          id={HELP_TOPIC_CATCHALL_PRIMARY_CONTENT_ID}
          data-testid={HELP_TOPIC_CATCHALL_PRIMARY_CONTENT_ID}
          className={cn("scroll-mt-24 space-y-6", OPERATOR_LAYOUT.sectionStack)}
        >
          {header}
          <div
            data-testid={HELP_TOPIC_CATCHALL_FIRST_VIEWPORT_TEST_ID}
            className={cn(
              "scroll-mt-24 border-b border-neutral-200 pb-6 dark:border-neutral-800",
              OPERATOR_LAYOUT.sectionStack,
            )}
          >
            <p
              className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}
              data-testid="help-topic-catchall-intro"
            >
              {HELP_TOPIC_CATCHALL_PAGE_LEAD}
            </p>
            <section
              className="space-y-2 rounded-md border border-neutral-200 bg-neutral-50/80 p-4 dark:border-neutral-700 dark:bg-neutral-900/40"
              data-testid="help-topic-catchall-start-here-panel"
              aria-labelledby="help-topic-catchall-start-here-heading"
            >
              <h2
                id="help-topic-catchall-start-here-heading"
                className={cn("m-0 text-al-text-primary", OPERATOR_TYPOGRAPHY.sectionTitle)}
              >
                {HELP_TOPIC_CATCHALL_START_HERE_CARD_TITLE}
              </h2>
              <p
                className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}
                data-testid="help-topic-catchall-buyer-start-here-helper"
              >
                {HELP_TOPIC_CATCHALL_BUYER_START_HERE_HELPER}
              </p>
            </section>
            <p
              className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}
              data-testid="help-topic-catchall-overview"
            >
              {HELP_TOPIC_CATCHALL_OVERVIEW}
            </p>
          </div>
          {developerRunbookLine}
          {caiqSigPostureCounts !== null ? (
            <CaiqSigResponseHelpPostureSummary counts={caiqSigPostureCounts} tableRowTotal={postureTableRowTotal} />
          ) : null}
          {contentGrid}
          <HelpTopicCatchallSourcesOrientationStrip />
        </div>
      ) : (
        <>
          {header}
          {isScopeHelp ? <ScopeHelpClaimDisciplineStrip /> : null}
          {developerRunbookLine}
          {caiqSigPostureCounts !== null ? (
            <CaiqSigResponseHelpPostureSummary counts={caiqSigPostureCounts} tableRowTotal={postureTableRowTotal} />
          ) : null}
          {contentGrid}
        </>
      )}
    </article>
  );
}


