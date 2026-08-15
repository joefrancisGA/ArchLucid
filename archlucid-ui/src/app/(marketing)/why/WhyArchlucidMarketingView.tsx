import Link from "next/link";
import type { ReactNode } from "react";

import { MarketingPageShell } from "@/components/marketing/MarketingPageShell";
import { MarketingProofChainStrip } from "@/components/marketing/MarketingProofChainStrip";
import { WhyEvidenceOrientationStrip } from "@/components/marketing/WhyEvidenceOrientationStrip";
import { WhyMarketingHeroSection } from "@/app/(marketing)/why/WhyMarketingHeroSection";
import { WhyMarketingProofLadderSection } from "@/app/(marketing)/why/WhyMarketingProofLadderSection";
import { Button } from "@/components/ui/button";
import { BUYER_OUTCOME_LED_VALUE_PROPOSITION } from "@/lib/buyer/buyer-polish-copy";
import { BRAND_CATEGORY, BRAND_PROOF_SCOPE_STATEMENT } from "@/lib/brand-category";
import { MARKETING_LAYOUT, MARKETING_MOTION, MARKETING_SURFACES, MARKETING_TYPOGRAPHY } from "@/lib/design-tokens";
import {
  WHY_BRAND_CATEGORY_INTRO,
  WHY_CLOSING_HEADING,
  WHY_CLOSING_LEAD,
  WHY_CLOSING_PRIMARY_CTA_HREF,
  WHY_CLOSING_PRIMARY_CTA_LABEL,
  WHY_CLOSING_SECONDARY_CTA_HREF,
  WHY_CLOSING_SECONDARY_CTA_LABEL,
  WHY_HARD_COMPARISON_DISCLOSURE_LABEL,
  WHY_MARKET_LANDSCAPE_CITATION_NOTE,
  WHY_MARKET_LANDSCAPE_DISCLOSURE_LABEL,
  WHY_MARKETING_PDF_DOWNLOAD_FILENAME,
  WHY_MARKETING_PDF_HREF,
  WHY_PROCUREMENT_PDF_QUIET_LINK_LABEL,
  WHY_PROCUREMENT_PDF_QUIET_PREFIX,
} from "@/lib/why-page-copy";
import { cn } from "@/lib/utils";
import { WHY_MARKET_LANDSCAPE_MARKETING_ROWS } from "@/lib/why-market-landscape-comparison";
import { type WhyVerifyLink, WHY_COMPARISON_VERIFY_LINK_ROWS } from "@/lib/why-comparison-verify-points";
import {
  type WhyHardComparisonRow,
  WHY_GOVERNANCE_SUMMARY_ROWS,
  whyHardCellDisplay,
} from "@/lib/why-comparison";
import { MARKETING_GENERIC_AI_CONTRAST_POINTS } from "@/lib/marketing-generic-ai-contrast";

function renderWhyVerifyLink(link: WhyVerifyLink): ReactNode {
  // min-h-6 + py-1 keeps Verify cell anchors ≥24px for axe target-size / target-offset.
  const className = `inline-flex min-h-6 items-center break-words py-1 ${MARKETING_SURFACES.inlineLink}`;

  const key = `${link.href}|${link.label}`;

  if (link.href.startsWith("http")) {
    return (
      <a key={key} className={className} href={link.href} target="_blank" rel="noopener noreferrer">
        {link.label}
      </a>
    );
  }

  if (link.href.endsWith(".zip")) {
    return (
      <a key={key} className={className} href={link.href} download>
        {link.label}
      </a>
    );
  }

  return (
    <Link key={key} className={className} href={link.href}>
      {link.label}
    </Link>
  );
}

function WhyHardComparisonVerifyCell({ links }: { readonly links: readonly WhyVerifyLink[] }): ReactNode {
  return (
    <div className="flex max-w-[14rem] flex-col gap-2 align-top text-xs leading-snug">{links.map(renderWhyVerifyLink)}</div>
  );
}

export type WhyArchlucidMarketingViewProps = {
  /** Parsed from `WHY_COMPARISON_ROWS_SERIALIZED` on the marketing route for a single JSON source path. */
  frontDoorRows: readonly WhyHardComparisonRow[];
};

/**
 * Public “Why ArchLucid” differentiation page — no operator auth.
 */
export function WhyArchlucidMarketingView({ frontDoorRows }: WhyArchlucidMarketingViewProps) {
  return (
    <MarketingPageShell className={MARKETING_MOTION.revealIn}>
      <WhyMarketingHeroSection />

      <section className={`${MARKETING_LAYOUT.majorSectionGap} ${MARKETING_SURFACES.highlightPanel}`}>
        <p className={MARKETING_TYPOGRAPHY.eyebrow}>First-principles outcome</p>
        <h2 id="why-hero-outcome-heading" className={`mt-2 ${MARKETING_TYPOGRAPHY.sectionTitle}`}>
          One buyer problem, one proof export
        </h2>
        <p
          className={`mt-3 max-w-3xl ${MARKETING_TYPOGRAPHY.body} text-al-text-secondary`}
          data-testid="why-outcome-led-value-proposition"
        >
          {BUYER_OUTCOME_LED_VALUE_PROPOSITION}
        </p>
      </section>

      <div className="mt-8">
        <MarketingProofChainStrip />
      </div>

      <section className="mt-10" data-testid="why-brand-category-detail" aria-label="Differentiation context">
        <p className={cn("max-w-3xl", MARKETING_TYPOGRAPHY.body, "text-al-text-secondary")} data-testid="why-brand-category-paragraph">
          {`ArchLucid is an ${BRAND_CATEGORY}: ${WHY_BRAND_CATEGORY_INTRO}`}
        </p>
        <p
          className={cn("mt-3 max-w-3xl", MARKETING_TYPOGRAPHY.meta, "text-al-text-secondary")}
          data-testid="why-proof-scope-statement"
        >
          {BRAND_PROOF_SCOPE_STATEMENT}
        </p>
      </section>

      <section className="mt-12" aria-labelledby="why-vs-chat-assistant-heading" data-testid="why-vs-chat-assistant">
        <h2 id="why-vs-chat-assistant-heading" className={MARKETING_TYPOGRAPHY.sectionTitle}>
          vs a chat assistant (ChatGPT, Copilot, Claude)
        </h2>
        <p className={`mt-2 max-w-3xl ${MARKETING_TYPOGRAPHY.meta}`}>
          Many buyers already use a general LLM for architecture questions. ArchLucid persists a committed review,
          governance gate, and audit trail a session cannot replace.
        </p>
        <ul className="mt-4 grid gap-3 sm:grid-cols-2">
          {MARKETING_GENERIC_AI_CONTRAST_POINTS.map((point) => (
            <li
              key={point.label}
              className={MARKETING_SURFACES.card}
            >
              <p className={cn("m-0 font-semibold text-neutral-900 dark:text-neutral-100", MARKETING_TYPOGRAPHY.cardTitle)}>
                {point.label}
              </p>
              <p className={cn("m-0 mt-2 text-neutral-700 dark:text-neutral-300", MARKETING_TYPOGRAPHY.body)}>
                <span className="font-medium text-teal-800 dark:text-teal-300">ArchLucid:</span>
                {` ${point.archlucid}`}
              </p>
              <p className={cn("m-0 mt-1 text-neutral-600 dark:text-neutral-400", MARKETING_TYPOGRAPHY.meta)}>
                <span className="font-medium">Typical chat:</span>
                {` ${point.genericAi}`}
              </p>
            </li>
          ))}
        </ul>
        <p className={cn("mt-3 text-neutral-600 dark:text-neutral-400", MARKETING_TYPOGRAPHY.meta)}>
          More detail:{" "}
          <Link className={MARKETING_SURFACES.inlineLink} href="/faq">
            FAQ — vs ChatGPT/Copilot
          </Link>
          .
        </p>
      </section>

      <section className="mt-12" aria-labelledby="why-market-landscape-heading">
        <details className="group rounded-lg border border-neutral-200 dark:border-neutral-800" data-testid="why-market-landscape-disclosure">
          <summary
            className="cursor-pointer list-none px-4 py-3 font-semibold text-neutral-900 marker:content-none dark:text-neutral-100 [&::-webkit-details-marker]:hidden"
            data-testid="why-market-landscape-disclosure-trigger"
          >
            <span className={MARKETING_TYPOGRAPHY.sectionTitle}>{WHY_MARKET_LANDSCAPE_DISCLOSURE_LABEL}</span>
          </summary>
          <div className="border-t border-neutral-200 px-4 pb-4 pt-3 dark:border-neutral-800">
            <p className={cn("max-w-3xl text-neutral-600 dark:text-neutral-400", MARKETING_TYPOGRAPHY.meta)}>
              {WHY_MARKET_LANDSCAPE_CITATION_NOTE}
            </p>
            <div className="mt-4 overflow-x-auto rounded-lg border border-neutral-200 dark:border-neutral-800">
              <table
                data-testid="why-market-landscape-mini-table"
                className={cn("w-full min-w-[60rem] border-collapse text-left", MARKETING_TYPOGRAPHY.meta)}
              >
                <thead>
                  <tr className="border-b border-neutral-200 bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-900/80">
                    <th scope="col" className="px-3 py-2 font-semibold text-neutral-900 dark:text-neutral-100">
                      Dimension
                    </th>
                    <th scope="col" className="min-w-[12rem] px-3 py-2 font-semibold text-neutral-900 dark:text-neutral-100">
                      ArchLucid
                    </th>
                    <th scope="col" className="min-w-[12rem] px-3 py-2 font-semibold text-neutral-900 dark:text-neutral-100">
                      GitHub Copilot (architecture ad-hoc)
                    </th>
                    <th scope="col" className="min-w-[12rem] px-3 py-2 font-semibold text-neutral-900 dark:text-neutral-100">
                      ChatGPT / Claude (manual prompting)
                    </th>
                    <th scope="col" className="min-w-[12rem] px-3 py-2 font-semibold text-neutral-900 dark:text-neutral-100">
                      Structurizr (+ AI assist)
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {WHY_MARKET_LANDSCAPE_MARKETING_ROWS.map((row) => (
                    <tr
                      key={row.dimension}
                      className="border-b border-neutral-100 odd:bg-white even:bg-neutral-50/80 dark:border-neutral-800 dark:odd:bg-neutral-950 dark:even:bg-neutral-900/40"
                    >
                      <th
                        scope="row"
                        className="max-w-[200px] px-3 py-3 align-top font-medium text-neutral-900 dark:text-neutral-100"
                      >
                        {row.dimension}
                      </th>
                      <td className="px-3 py-3 align-top text-neutral-800 dark:text-neutral-200">{row.archlucid}</td>
                      <td className="px-3 py-3 align-top text-neutral-800 dark:text-neutral-200">
                        {row.githubCopilotAdHocArchitecture}
                      </td>
                      <td className="px-3 py-3 align-top text-neutral-800 dark:text-neutral-200">
                        {row.manualChatgptClaude}
                      </td>
                      <td className="px-3 py-3 align-top text-neutral-800 dark:text-neutral-200">
                        {row.structurizrWithAssist}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </details>
      </section>

      <section className="mt-12" aria-labelledby="why-hard-compare-heading" data-testid="why-governance-comparison">
        <h2 id="why-hard-compare-heading" className={MARKETING_TYPOGRAPHY.sectionTitle}>
          Governance capability comparison
        </h2>
        <p className={cn("mt-2 max-w-3xl text-neutral-600 dark:text-neutral-400", MARKETING_TYPOGRAPHY.meta)}>
          Five differentiators that matter most in procurement — not a vendor scorecard.
        </p>

        <div className="mt-4 overflow-x-auto rounded-lg border border-neutral-200 dark:border-neutral-800">
          <table className={cn("w-full border-collapse text-left", MARKETING_TYPOGRAPHY.meta)} data-testid="why-governance-summary-table">
            <caption className="border-b border-neutral-200 bg-neutral-100 px-3 py-2 text-left text-neutral-800 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-200">
              ArchLucid vs typical chat AI — governance at a glance
            </caption>
            <thead>
              <tr className="border-b border-neutral-200 bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-900/80">
                <th scope="col" className="min-w-[220px] px-3 py-2 font-semibold text-neutral-900 dark:text-neutral-100">
                  Capability
                </th>
                <th scope="col" className="min-w-[120px] px-3 py-2 font-semibold text-neutral-900 dark:text-neutral-100">
                  ArchLucid
                </th>
                <th scope="col" className="min-w-[120px] px-3 py-2 font-semibold text-neutral-900 dark:text-neutral-100">
                  Typical chat AI
                </th>
              </tr>
            </thead>
            <tbody>
              {WHY_GOVERNANCE_SUMMARY_ROWS.map((summaryRow) => {
                const row = frontDoorRows[summaryRow.fullRowIndex];

                if (row == null) {
                  return null;
                }

                return (
                  <tr
                    key={summaryRow.label}
                    className="border-b border-neutral-100 odd:bg-white even:bg-neutral-50/80 dark:border-neutral-800 dark:odd:bg-neutral-950 dark:even:bg-neutral-900/40"
                  >
                    <th
                      scope="row"
                      className="max-w-[320px] px-3 py-3 align-top font-medium text-neutral-900 dark:text-neutral-100"
                    >
                      {summaryRow.label}
                    </th>
                    <td className="whitespace-nowrap px-3 py-3 align-top text-neutral-800 dark:text-neutral-200">
                      {whyHardCellDisplay(row.archlucid)}
                    </td>
                    <td className="whitespace-nowrap px-3 py-3 align-top text-neutral-800 dark:text-neutral-200">
                      {whyHardCellDisplay(row.genericAiArchitect)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <p className={cn("mt-4 text-neutral-600 dark:text-neutral-400", MARKETING_TYPOGRAPHY.meta)}>
          {WHY_PROCUREMENT_PDF_QUIET_PREFIX}
          <a
            className={MARKETING_SURFACES.inlineLink}
            data-testid="why-proof-pack-download"
            href={WHY_MARKETING_PDF_HREF}
            download={WHY_MARKETING_PDF_DOWNLOAD_FILENAME}
          >
            {WHY_PROCUREMENT_PDF_QUIET_LINK_LABEL}
          </a>
          {" →"}
        </p>

        <details className="group mt-6 rounded-lg border border-neutral-200 dark:border-neutral-800" data-testid="why-hard-comparison-disclosure">
          <summary
            className="cursor-pointer list-none px-4 py-3 font-semibold text-neutral-900 marker:content-none dark:text-neutral-100 [&::-webkit-details-marker]:hidden"
            data-testid="why-hard-comparison-disclosure-trigger"
          >
            <span className={MARKETING_TYPOGRAPHY.sectionTitle}>{WHY_HARD_COMPARISON_DISCLOSURE_LABEL}</span>
          </summary>
          <div className="border-t border-neutral-200 px-4 pb-4 pt-3 dark:border-neutral-800">
            <p className={cn("max-w-3xl text-neutral-600 dark:text-neutral-400", MARKETING_TYPOGRAPHY.meta)}>
              Symbols in the product columns (✓ / partial / —) summarize capability depth; each row links to diligence
              references.
            </p>
            <div className="mt-4 overflow-x-auto rounded-lg border border-neutral-200 dark:border-neutral-800">
              <table className={cn("w-full min-w-[72rem] border-collapse text-left", MARKETING_TYPOGRAPHY.meta)} data-testid="why-hard-comparison-table">
                <caption className="border-b border-neutral-200 bg-neutral-100 px-3 py-2 text-left text-neutral-800 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-200">
                  ArchLucid vs typical adjacent stacks — governance-focused capability rows
                </caption>
                <thead>
                  <tr className="border-b border-neutral-200 bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-900/80">
                    <th scope="col" className="min-w-[220px] px-3 py-2 font-semibold text-neutral-900 dark:text-neutral-100">
                      Claim
                    </th>
                    <th scope="col" className="min-w-[140px] px-3 py-2 font-semibold text-neutral-900 dark:text-neutral-100">
                      Verify
                    </th>
                    <th scope="col" className="px-3 py-2 font-semibold text-neutral-900 dark:text-neutral-100">
                      ArchLucid
                    </th>
                    <th scope="col" className="min-w-[120px] px-3 py-2 font-semibold text-neutral-900 dark:text-neutral-100">
                      draw.io+Confluence
                    </th>
                    <th scope="col" className="min-w-[140px] px-3 py-2 font-semibold text-neutral-900 dark:text-neutral-100">
                      GitHub Copilot for generic IaC review
                    </th>
                    <th scope="col" className="min-w-[120px] px-3 py-2 font-semibold text-neutral-900 dark:text-neutral-100">
                      Generic AI architect tool
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {frontDoorRows.map((row, index) => (
                    <tr
                      key={`why-hard-row-${index}`}
                      className="border-b border-neutral-100 odd:bg-white even:bg-neutral-50/80 dark:border-neutral-800 dark:odd:bg-neutral-950 dark:even:bg-neutral-900/40"
                    >
                      <th
                        scope="row"
                        className="max-w-[320px] px-3 py-3 align-top font-medium text-neutral-900 dark:text-neutral-100"
                      >
                        {row.label}
                      </th>
                      <td className="px-3 py-3 align-top text-neutral-800 dark:text-neutral-200">
                        <WhyHardComparisonVerifyCell links={WHY_COMPARISON_VERIFY_LINK_ROWS[index] ?? []} />
                      </td>
                      <td className="whitespace-nowrap px-3 py-3 align-top text-neutral-800 dark:text-neutral-200">
                        {whyHardCellDisplay(row.archlucid)}
                      </td>
                      <td className="whitespace-nowrap px-3 py-3 align-top text-neutral-800 dark:text-neutral-200">
                        {whyHardCellDisplay(row.drawioConfluence)}
                      </td>
                      <td className="whitespace-nowrap px-3 py-3 align-top text-neutral-800 dark:text-neutral-200">
                        {whyHardCellDisplay(row.githubCopilotIac)}
                      </td>
                      <td className="whitespace-nowrap px-3 py-3 align-top text-neutral-800 dark:text-neutral-200">
                        {whyHardCellDisplay(row.genericAiArchitect)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </details>
      </section>

      <WhyMarketingProofLadderSection />

      <section
        className="mt-10 border-t border-neutral-200 pt-8 dark:border-neutral-800"
        aria-labelledby="why-closing-cta-heading"
        data-testid="why-closing-cta"
      >
        <h2 id="why-closing-cta-heading" className={MARKETING_TYPOGRAPHY.sectionTitle}>
          {WHY_CLOSING_HEADING}
        </h2>
        <p className={`mt-2 max-w-3xl ${MARKETING_TYPOGRAPHY.body} text-al-text-secondary`}>
          {WHY_CLOSING_LEAD}
        </p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
          <Button asChild variant="primary" size="lg" data-testid="why-closing-primary-cta">
            <Link href={WHY_CLOSING_PRIMARY_CTA_HREF}>{WHY_CLOSING_PRIMARY_CTA_LABEL}</Link>
          </Button>
          <Button asChild variant="outline" size="lg" data-testid="why-closing-secondary-cta">
            <Link href={WHY_CLOSING_SECONDARY_CTA_HREF}>{WHY_CLOSING_SECONDARY_CTA_LABEL}</Link>
          </Button>
        </div>
        <p className={cn("mt-4 text-neutral-600 dark:text-neutral-400", MARKETING_TYPOGRAPHY.meta)}>
          For sponsor-ready language and procurement context, see the{" "}
          <Link className={MARKETING_SURFACES.inlineLink} href="/get-started">
            getting started guide
          </Link>
          .
        </p>
      </section>

      <WhyEvidenceOrientationStrip />
    </MarketingPageShell>
  );
}
