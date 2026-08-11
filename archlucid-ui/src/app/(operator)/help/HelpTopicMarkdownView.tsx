import Link from "next/link";

import type { ReactNode } from "react";



import { HelpTopicMarkdownPageHeader } from "@/app/(operator)/help/_sections/HelpTopicMarkdownPageHeader";

import { CaiqSigResponseHelpPostureSummary } from "@/components/help/CaiqSigResponseHelpPostureSummary";

import { HelpTopicExportClaimDiscipline } from "@/components/help/HelpTopicExportClaimDiscipline";
import { HelpTopicRegistryProvenanceLine } from "@/components/help/HelpTopicRegistryProvenanceLine";
import { ProcurementHelpHeaderAsOfLine } from "@/components/help/ProcurementHelpHeaderAsOfLine";

import { HelpTopicSignInFailureTriageLine } from "@/components/help/HelpTopicSignInFailureTriageLine";

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

import { DESIGN_TOKENS, OPERATOR_LAYOUT, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

import { AUTHENTICATION_SIGN_IN_HELP_PRIMARY_ACTION } from "@/lib/authentication-sign-in-help-copy";
import { CAIQ_SIG_RESPONSE_HELP_PRIMARY_ACTION } from "@/lib/caiq-sig-response-help-evidence-copy";
import { INTEGRATION_READINESS_HELP_PRIMARY_ACTION } from "@/lib/integration-readiness-help-evidence-copy";
import { PROCUREMENT_HELP_CLAIM_DISCIPLINE } from "@/lib/procurement-help-evidence-copy";
import { isProcurementHelpTopic } from "@/lib/procurement-help-presentation";
import { POLICY_PACKS_HELP_PRIMARY_ACTION } from "@/lib/policy-packs-help-evidence-copy";

import { extractHelpMarkdownHeadings } from "@/lib/help-markdown-headings";

import { prepareHelpMarkdownForPresentation } from "@/lib/help-markdown-presentation";

import { HELP_PAGE_LAYOUT, resolveHelpPageContentGridClass } from "@/lib/help-page-layout";

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

  const extractedHeadings = extractHelpMarkdownHeadings(preparedMarkdown);

  const headings = extractedHeadings;

  const resolvedTocGroups =

    tocGroups ?? (isCaiqSigResponse ? buildCaiqSigResponseTocGroups(headings) : undefined);

  const postureCounts = isCaiqSigResponse ? computeCaiqSigResponsePostureCounts(preparedMarkdown) : null;
  const postureTableRowTotal = isCaiqSigResponse ? countCaiqSigResponseTableRows(preparedMarkdown) : 0;

  const isIntegrationReadinessHelp = entry.slug === "integration-readiness";
  const isPolicyPacksHelp = entry.slug === "policy-packs";
  const isProcurementHelp = isProcurementHelpTopic(entry.slug);
  const isAuthenticationSignInHelp = entry.slug === "authentication-sign-in";
  const allowWithoutServerPdf = entry.pdfStatus === null && (entry.audience === "buyer" || isProcurementHelp);

  const isTechnicalReferenceLayout = layoutVariant === "technicalReference";

  const contentGridClass = isTechnicalReferenceLayout

    ? HELP_PAGE_LAYOUT.technicalReferenceGrid

    : resolveHelpPageContentGridClass(headings.length);

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

      <HelpTopicMarkdownPageHeader

        entry={entry}

        showContextualHelp={showContextualHelp}

        showExportClaimDiscipline={showExportClaimDiscipline}

        allowWithoutServerPdf={allowWithoutServerPdf}

        exportClaimDiscipline={
          showExportClaimDiscipline ? (
            <HelpTopicExportClaimDiscipline
              claimDiscipline={isProcurementHelp ? PROCUREMENT_HELP_CLAIM_DISCIPLINE : undefined}
            />
          ) : undefined
        }

        titleBlockOrientation={
          isProcurementHelp ? (
            <ProcurementHelpHeaderAsOfLine />
          ) : isPolicyPacksHelp ? (
            <HelpTopicRegistryProvenanceLine entry={entry} />
          ) : undefined
        }

        signInFailureTriageLine={isAuthenticationSignInHelp ? <HelpTopicSignInFailureTriageLine /> : undefined}

        primaryAction={
          isAuthenticationSignInHelp
            ? AUTHENTICATION_SIGN_IN_HELP_PRIMARY_ACTION
            : isCaiqSigResponse
              ? CAIQ_SIG_RESPONSE_HELP_PRIMARY_ACTION
              : isIntegrationReadinessHelp
                ? INTEGRATION_READINESS_HELP_PRIMARY_ACTION
                : isPolicyPacksHelp
                  ? POLICY_PACKS_HELP_PRIMARY_ACTION
                  : undefined
        }

      />



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



      {!evidenceOrientation ? null : evidenceOrientation}



      {postureCounts !== null ? (
        <CaiqSigResponseHelpPostureSummary counts={postureCounts} tableRowTotal={postureTableRowTotal} />
      ) : null}



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

        <HelpTopicTableOfContents headings={headings} groups={resolvedTocGroups} enableScrollSpy />

      </div>

    </article>

  );

}


