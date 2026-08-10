import Link from "next/link";
import type { ReactNode } from "react";

import { HelpTopicTitleRow } from "@/components/help/HelpTopicPageHeader";
import { CaiqSigResponseHelpPostureSummary } from "@/components/help/CaiqSigResponseHelpPostureSummary";
import { HelpTopicExportClaimDiscipline } from "@/components/help/HelpTopicExportClaimDiscipline";
import { HelpTopicPdfDownloadButton } from "@/components/help/HelpTopicPdfDownloadButton";
import { HelpTopicPrintButton } from "@/components/help/HelpTopicPrintButton";
import { HelpTopicRegistryProvenanceLine } from "@/components/help/HelpTopicRegistryProvenanceLine";
import { HelpTopicSignInFailureTriageLine } from "@/components/help/HelpTopicSignInFailureTriageLine";
import { HelpTopicHashScroll } from "@/app/(operator)/help/HelpTopicHashScroll";
import { HelpTopicTableOfContents } from "@/components/help/HelpTopicTableOfContents";
import { MarketingAccessibilityMarkdownFragment } from "@/components/marketing/MarketingAccessibilityMarkdownFragment";
import { PageContextualHelpButton } from "@/components/usability/PageContextualHelpButton";
import {
  buildCaiqSigResponseTocGroups,
  computeCaiqSigResponsePostureCounts,
  isCaiqSigResponseHelpTopic,
  prepareCaiqSigResponseHelpMarkdown,
  type HelpTopicTocGroup,
} from "@/lib/caiq-sig-response-help-presentation";
import { DESIGN_TOKENS, OPERATOR_LAYOUT, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { extractHelpMarkdownHeadings } from "@/lib/help-markdown-headings";
import { prepareHelpMarkdownForPresentation } from "@/lib/help-markdown-presentation";
import { HELP_PAGE_LAYOUT } from "@/lib/help-page-layout";
import type { ProductDocumentationEntry } from "@/lib/product-documentation-registry";
import { inAppHelpHref } from "@/lib/product-documentation-registry";
import { cn } from "@/lib/utils";

type HelpTopicMarkdownViewProps = {
  entry: ProductDocumentationEntry;
  markdown: string;
  /** Optional Evidence orientation strip (Sources + claim discipline). */
  readonly evidenceOrientation?: ReactNode;
  /** When true, show Category-1 PageContextualHelpButton in the header actions. */
  readonly showContextualHelp?: boolean;
  /** Optional grouped TOC parents (for example CAIQ Lite vs SIG Core). */
  readonly tocGroups?: readonly HelpTopicTocGroup[];
  /** Wider technical-reference grid for dense questionnaire tables. */
  readonly layoutVariant?: "default" | "technicalReference";
  /** When true, render export claim discipline near PDF / print actions. */
  readonly showExportClaimDiscipline?: boolean;
};

/** Renders curated repo markdown inside the operator help shell (no GitHub chrome). */
export function HelpTopicMarkdownView(props: HelpTopicMarkdownViewProps): React.ReactElement {
  const {
    entry,
    markdown,
    evidenceOrientation,
    showContextualHelp,
    tocGroups,
    layoutVariant = "default",
    showExportClaimDiscipline = false,
  } = props;
  const sourceDocPath = entry.sourcePaths[0] ?? "";
  const preserveMaintenanceMetadata = entry.audience === "developer";
  const isCaiqSigResponse = isCaiqSigResponseHelpTopic(entry.slug);
  const preparedMarkdown = isCaiqSigResponse
    ? prepareCaiqSigResponseHelpMarkdown(markdown, sourceDocPath)
    : prepareHelpMarkdownForPresentation(markdown, sourceDocPath, {
        preserveMaintenanceMetadata,
        helpTopicSlug: entry.slug,
      });
  const headings = extractHelpMarkdownHeadings(preparedMarkdown);
  const resolvedTocGroups =
    tocGroups ?? (isCaiqSigResponse ? buildCaiqSigResponseTocGroups(headings) : undefined);
  const postureCounts = isCaiqSigResponse ? computeCaiqSigResponsePostureCounts(preparedMarkdown) : null;
  const isAuthenticationSignInHelp = entry.slug === "authentication-sign-in";
  const isTechnicalReferenceLayout = layoutVariant === "technicalReference";
  const contentGridClass = isTechnicalReferenceLayout
    ? HELP_PAGE_LAYOUT.technicalReferenceGrid
    : HELP_PAGE_LAYOUT.contentGrid;
  const contentColumnClass = isTechnicalReferenceLayout
    ? HELP_PAGE_LAYOUT.technicalReferenceColumn
    : HELP_PAGE_LAYOUT.contentColumn;

  return (
    <article
      className={cn(
        OPERATOR_LAYOUT.majorSectionGap,
        isTechnicalReferenceLayout ? HELP_PAGE_LAYOUT.technicalReferenceArticle : undefined,
      )}
      data-testid={isCaiqSigResponse ? "help-caiq-sig-response-topic" : undefined}
    >
      <HelpTopicHashScroll />
      <header className={HELP_PAGE_LAYOUT.articleHeader}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 flex-1 space-y-2">
            <HelpTopicTitleRow title={entry.title} />
            <p className={`m-0 ${OPERATOR_TYPOGRAPHY.helper}`}>{entry.summary}</p>
            <HelpTopicRegistryProvenanceLine entry={entry} />
            {isAuthenticationSignInHelp ? <HelpTopicSignInFailureTriageLine /> : null}
            {showExportClaimDiscipline ? <HelpTopicExportClaimDiscipline /> : null}
          </div>
          <div className="flex flex-wrap items-center gap-2" data-testid="help-topic-export-actions">
            {showContextualHelp ? <PageContextualHelpButton /> : null}
            <HelpTopicPdfDownloadButton entry={entry} />
            {isAuthenticationSignInHelp ? null : <HelpTopicPrintButton entry={entry} />}
          </div>
        </div>
        {entry.audience === "developer" ? (
          <p className={`m-0 max-w-3xl ${OPERATOR_TYPOGRAPHY.label}`}>
            Engineering runbook — CLI commands, environment variables, and log detail. For symptom-first operator help,
            open{" "}
            <Link href={inAppHelpHref("troubleshooting")} className={`underline-offset-2 hover:underline ${DESIGN_TOKENS.accent.link}`}>
              Troubleshooting
            </Link>
            .
          </p>
        ) : null}
      </header>

      {evidenceOrientation}

      {postureCounts !== null ? <CaiqSigResponseHelpPostureSummary counts={postureCounts} /> : null}

      <div className={contentGridClass}>
        <div className={contentColumnClass} data-testid="help-topic-content">
          <MarketingAccessibilityMarkdownFragment
            markdownBody={markdown}
            tableCaption={`${entry.title} reference table`}
            presentation="help"
            sourceDocPath={entry.sourcePaths[0]}
            helpTopicSlug={entry.slug}
            preserveMaintenanceMetadata={preserveMaintenanceMetadata}
            preparedMarkdownOverride={preparedMarkdown}
          />
        </div>
        <HelpTopicTableOfContents headings={headings} groups={resolvedTocGroups} />
      </div>
    </article>
  );
}
