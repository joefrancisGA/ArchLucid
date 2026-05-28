"use client";

import Link from "next/link";
import { Fragment, type ReactNode } from "react";

import { BUYER_ASK_GROUNDING_PRIMARY_SOURCE_LIMIT, BUYER_ASK_UNSTRUCTURED_EXECUTIVE_FALLBACK_LEAD } from "@/lib/buyer-polish-copy";
import { splitBuyerAskExecutiveLead } from "@/lib/ask-executive-lead";
import { parseAskAssistantStructuredSections } from "@/lib/ask-assistant-section-parser";

export type AskAssistantGroundingLink = {
  readonly label: string;
  readonly href: string;
};

const UUID_RE =
  /\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b/gi;

function renderTextWithUuidReviewLinks(body: string, buyerPolishedLinks: boolean): ReactNode {
  const parts: ReactNode[] = [];
  let lastIndex = 0;

  for (const match of body.matchAll(UUID_RE)) {
    const m = match;

    if (m.index === undefined) {
      continue;
    }

    if (m.index > lastIndex) {
      parts.push(<Fragment key={`t-${lastIndex}`}>{body.slice(lastIndex, m.index)}</Fragment>);
    }

    const id = m[0];
    const linkChildren = buyerPolishedLinks ? "Open linked review" : id;

    parts.push(
      <Link
        key={`id-${m.index}-${id}`}
        href={`/reviews/${encodeURIComponent(id)}`}
        className="font-medium text-teal-800 underline decoration-teal-300/60 underline-offset-2 hover:text-teal-900 dark:text-teal-300 dark:decoration-teal-700 dark:hover:text-teal-200"
        aria-label={buyerPolishedLinks ? `Open linked review ${id}` : undefined}
        title={
          buyerPolishedLinks
            ? id
            : "Open as review detail (IDs may reference manifests in some answers — confirm in context)."
        }
      >
        {linkChildren}
      </Link>,
    );

    lastIndex = m.index + id.length;
  }

  if (lastIndex < body.length) {
    parts.push(<Fragment key={`t-${lastIndex}`}>{body.slice(lastIndex)}</Fragment>);
  }

  if (parts.length === 0) {
    return body;
  }

  return parts;
}

function GroundingLinksFooter(props: {
  readonly links: readonly AskAssistantGroundingLink[];
  readonly buyerPolishedLinks?: boolean;
}) {
  const primaryLimit =
    props.buyerPolishedLinks === true ? BUYER_ASK_GROUNDING_PRIMARY_SOURCE_LIMIT : props.links.length;
  const primaryLinks = props.links.slice(0, primaryLimit);
  const overflowLinks = props.links.slice(primaryLimit);

  return (
    <div className="mt-4 rounded-lg border border-neutral-200/90 bg-white/80 p-3 dark:border-neutral-700 dark:bg-neutral-900/40">
      <p className="m-0 text-xs font-semibold text-neutral-600 dark:text-neutral-400">
        Sources in this review package
      </p>
      <ul className="m-0 mt-2 list-none space-y-1.5 p-0 text-sm">
        {primaryLinks.map((link) => (
          <li key={link.href}>
            <Link
              href={link.href}
              className="font-medium text-teal-800 underline decoration-teal-300/60 underline-offset-2 hover:text-teal-900 dark:text-teal-300 dark:decoration-teal-700 dark:hover:text-teal-200"
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
      {overflowLinks.length > 0 ? (
        <details className="mt-2">
          <summary className="cursor-pointer select-none text-xs font-medium text-neutral-700 dark:text-neutral-300">
            More sources ({overflowLinks.length})
          </summary>
          <ul className="m-0 mt-2 list-none space-y-1.5 p-0 text-sm">
            {overflowLinks.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="font-medium text-teal-800 underline decoration-teal-300/60 underline-offset-2 hover:text-teal-900 dark:text-teal-300 dark:decoration-teal-700 dark:hover:text-teal-200"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </details>
      ) : null}
    </div>
  );
}

/**
 * Renders assistant markdown-free content with best-effort deep links for run-shaped UUIDs in plain text.
 * When responses include Risk:/Evidence:/Mitigation:/Validation: blocks, renders them as labeled sections
 * for faster executive scanning (still driven by the model; see Ask service system prompt).
 */
export function AskAssistantMessageBody(props: {
  readonly content: string;
  readonly buyerPolishedLinks?: boolean;
  readonly groundingLinks?: readonly AskAssistantGroundingLink[];
}) {
  const { content, buyerPolishedLinks = false, groundingLinks } = props;
  const structured = parseAskAssistantStructuredSections(content);
  const footer =
    groundingLinks !== undefined && groundingLinks.length > 0 ? (
      <GroundingLinksFooter links={groundingLinks} buyerPolishedLinks={buyerPolishedLinks} />
    ) : null;

  const buyerAnswerLeadPlain = buyerPolishedLinks ? (
    <p className="m-0 mb-2 text-xs font-medium text-neutral-600 dark:text-neutral-400">
      Based on the evidence indexed for this review package:
    </p>
  ) : null;

  if (structured !== null && buyerPolishedLinks) {
    const preambleTrim = structured.preamble.trim();
    let executiveLead: string | null = null;
    let preambleForRender = preambleTrim;
    let sectionsForRender = structured.sections;

    if (preambleTrim.length > 0) {
      const sp = splitBuyerAskExecutiveLead(preambleTrim);

      executiveLead = sp.sentence.length > 0 ? sp.sentence : null;
      preambleForRender = sp.rest.trim();
    } else {
      const riskIx = structured.sections.findIndex((section) => section.key === "risk");

      if (riskIx >= 0) {
        const rawRisk = structured.sections[riskIx]?.body.trim() ?? "";

        if (rawRisk.length > 0) {
          const sp = splitBuyerAskExecutiveLead(rawRisk);

          executiveLead = sp.sentence.length > 0 ? sp.sentence : null;
          sectionsForRender = structured.sections.map((s, i) =>
            i === riskIx ? { ...s, body: sp.rest.trim().length > 0 ? sp.rest.trim() : rawRisk } : s,
          );
        }
      }
    }

    if (executiveLead === null || executiveLead.length === 0) {
      executiveLead =
        "The sections below summarize risk framing, cited evidence, mitigation commitments, and validation checks for this package.";
    }

    const bodyClass = "m-0 whitespace-pre-wrap text-sm text-neutral-800 dark:text-neutral-200";

    return (
      <div className="space-y-4">
        <p className="m-0 text-sm font-semibold leading-snug text-neutral-900 dark:text-neutral-100">{executiveLead}</p>
        {preambleForRender.length > 0 ? (
          <p className={bodyClass}>{renderTextWithUuidReviewLinks(preambleForRender, buyerPolishedLinks)}</p>
        ) : null}
        {sectionsForRender.map((section, index) => (
          <section key={`${section.key}-${index}`} aria-label={section.title} className="border-t border-neutral-100 pt-3 dark:border-neutral-800">
            <h4 className="m-0 text-sm font-semibold text-neutral-900 dark:text-neutral-100">{section.title}</h4>
            <div className={`${bodyClass} mt-2`}>
              {section.body.length > 0 ? renderTextWithUuidReviewLinks(section.body, buyerPolishedLinks) : "—"}
            </div>
          </section>
        ))}
        {footer}
      </div>
    );
  }

  if (structured !== null) {
    const bodyClass =
      "m-0 whitespace-pre-wrap text-sm text-neutral-800 dark:text-neutral-200";

    return (
      <div className="space-y-4">
        {structured.preamble.length > 0 ? (
          <p className={bodyClass}>{renderTextWithUuidReviewLinks(structured.preamble, buyerPolishedLinks)}</p>
        ) : null}
        {structured.sections.map((section, index) => (
          <section key={`${section.key}-${index}`} aria-label={section.title} className="border-t border-neutral-100 pt-3 dark:border-neutral-800">
            <h4 className="m-0 text-sm font-semibold text-neutral-900 dark:text-neutral-100">
              {section.title}
            </h4>
            <div className={`${bodyClass} mt-2`}>
              {section.body.length > 0
                ? renderTextWithUuidReviewLinks(section.body, buyerPolishedLinks)
                : "—"}
            </div>
          </section>
        ))}
        {footer}
      </div>
    );
  }

  if (buyerPolishedLinks) {
    const trimmed = content.trim();
    const split = splitBuyerAskExecutiveLead(trimmed);
    const executiveLead =
      split.sentence.length > 0 ? split.sentence : BUYER_ASK_UNSTRUCTURED_EXECUTIVE_FALLBACK_LEAD;
    const bodyText = split.rest.trim().length > 0 ? split.rest.trim() : split.sentence.length > 0 ? "" : trimmed;

    return (
      <div className="space-y-4">
        <p className="m-0 text-sm font-semibold leading-snug text-neutral-900 dark:text-neutral-100">
          {renderTextWithUuidReviewLinks(executiveLead, buyerPolishedLinks)}
        </p>
        {bodyText.length > 0 ? (
          <p className="m-0 whitespace-pre-wrap text-sm text-neutral-800 dark:text-neutral-200">
            {renderTextWithUuidReviewLinks(bodyText, buyerPolishedLinks)}
          </p>
        ) : null}
        {footer}
      </div>
    );
  }

  return (
    <div className="space-y-0">
      {buyerAnswerLeadPlain}
      <p className="m-0 whitespace-pre-wrap text-sm text-neutral-800 dark:text-neutral-200">
        {renderTextWithUuidReviewLinks(content, buyerPolishedLinks)}
      </p>
      {footer}
    </div>
  );
}
