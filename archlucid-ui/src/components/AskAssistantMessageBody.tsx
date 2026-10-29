"use client";
import { cn } from "@/lib/utils";
import { OPERATOR_BODY_INLINE_LINK_CLASS, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Fragment, useCallback, useEffect, useState, type ReactNode } from "react";

import { BUYER_ASK_GROUNDING_PRIMARY_SOURCE_LIMIT, BUYER_ASK_UNSTRUCTURED_SPONSOR_FALLBACK_LEAD } from "@/lib/buyer/buyer-polish-copy";
import { splitBuyerAskSponsorLead } from "@/lib/ask-sponsor-lead";
import { parseAskAssistantStructuredSections } from "@/lib/ask-assistant-section-parser";
import {
  ASK_ASSISTANT_MORE_SOURCES_OPEN_PARAM,
  askAssistantMoreSourcesDisclosureHrefFromSearch,
  parseAskAssistantMoreSourcesOpenFromSearch,
} from "@/lib/insights/ask-assistant-more-sources-disclosure-url";

export type AskAssistantGroundingLink = {
  readonly label: string;
  readonly href?: string;
};

const ASK_ANSWER_NOT_STORED = "Answer was not stored";
const ASK_GROUNDING_SOURCES_NOT_STORED = "Sources in this review were not stored on this answer.";
const ASK_ANSWER_STORED_EMPTY = "Answer was stored empty.";
const ASK_ANSWER_LEAD_NOT_STORED = "Answer lead was not stored.";
const ASK_ANSWER_PREAMBLE_NOT_STORED = "Answer preamble was not stored.";
const ASK_GROUNDING_SOURCE_LABEL_STORED_EMPTY = "Source label was stored empty.";
const ASK_GROUNDING_SOURCE_LINK_NOT_STORED = "Source link was not stored.";
const ASK_GROUNDING_SOURCE_LINK_STORED_EMPTY = "Source link was stored empty.";
const ASK_SECTION_STORED_EMPTY = "This section was stored empty." as const;

function renderAskSectionBody(
  body: string,
  buyerPolishedLinks: boolean,
  citedReviewIds?: ReadonlySet<string>,
  reviewIdInScope?: string | null,
): ReactNode {
  const trimmed = body.trim();

  if (trimmed.length === 0) {
    return body.length > 0 ? ASK_ANSWER_STORED_EMPTY : ASK_ANSWER_NOT_STORED;
  }

  return renderTextWithUuidReviewLinks(body, buyerPolishedLinks, citedReviewIds, reviewIdInScope);
}

function renderGroundingLinkLabel(label: string): string {
  return label.trim().length > 0 ? label : ASK_GROUNDING_SOURCE_LABEL_STORED_EMPTY;
}

const UUID_RE =
  /\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b/gi;

function shouldLinkReviewUuid(
  id: string,
  citedReviewIds?: ReadonlySet<string>,
  reviewIdInScope?: string | null,
): boolean {
  if (citedReviewIds !== undefined) {
    return citedReviewIds.size > 0 && citedReviewIds.has(id.toLowerCase());
  }

  const scope = reviewIdInScope?.trim().toLowerCase() ?? "";

  return scope.length > 0 && id.toLowerCase() === scope;
}

function renderTextWithUuidReviewLinks(
  body: string,
  buyerPolishedLinks: boolean,
  citedReviewIds?: ReadonlySet<string>,
  reviewIdInScope?: string | null,
): ReactNode {
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
    const isCitedReview = shouldLinkReviewUuid(id, citedReviewIds, reviewIdInScope);

    if (!isCitedReview) {
      parts.push(<Fragment key={`id-${m.index}-${id}`}>{id}</Fragment>);
      lastIndex = m.index + id.length;
      continue;
    }

    const linkChildren = buyerPolishedLinks ? "Open linked review" : id;

    parts.push(
      <Link
        key={`id-${m.index}-${id}`}
        href={`/architecture/reviews/${encodeURIComponent(id)}`}
        className={OPERATOR_BODY_INLINE_LINK_CLASS}
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
  const router = useRouter();
  const pathname = usePathname() ?? "/";
  const searchParams = useSearchParams();
  const askAssistantMoreSourcesParam = searchParams.get(ASK_ASSISTANT_MORE_SOURCES_OPEN_PARAM);
  const [askAssistantMoreSourcesOpen, setAskAssistantMoreSourcesOpenState] = useState(() =>
    parseAskAssistantMoreSourcesOpenFromSearch(askAssistantMoreSourcesParam),
  );
  const syncAskAssistantMoreSourcesOpenToUrl = useCallback(
    (open: boolean) => {
      router.replace(
        askAssistantMoreSourcesDisclosureHrefFromSearch(searchParams.toString(), open, pathname),
        { scroll: false },
      );
    },
    [pathname, router, searchParams],
  );
  const setAskAssistantMoreSourcesOpen = useCallback(
    (open: boolean) => {
      setAskAssistantMoreSourcesOpenState(open);
      syncAskAssistantMoreSourcesOpenToUrl(open);
    },
    [syncAskAssistantMoreSourcesOpenToUrl],
  );
  useEffect(() => {
    setAskAssistantMoreSourcesOpenState(parseAskAssistantMoreSourcesOpenFromSearch(askAssistantMoreSourcesParam));
  }, [askAssistantMoreSourcesParam]);
  const primaryLimit =
    props.buyerPolishedLinks === true ? BUYER_ASK_GROUNDING_PRIMARY_SOURCE_LIMIT : props.links.length;
  const primaryLinks = props.links.slice(0, primaryLimit);
  const overflowLinks = props.links.slice(primaryLimit);

  return (
    <div className="mt-4 rounded-lg border border-neutral-200/90 bg-white/80 p-3 dark:border-neutral-700 dark:bg-neutral-900/40">
      <p className={cn("m-0 font-semibold text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
        Sources in this review
      </p>
      {props.buyerPolishedLinks === true && overflowLinks.length > 0 ? (
        <p className={cn("m-0 mt-1 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
          First {primaryLimit} review sources are listed; expand for {overflowLinks.length} more.
        </p>
      ) : null}
      <ul className={cn("m-0 mt-2 list-none space-y-1.5 p-0", OPERATOR_TYPOGRAPHY.body)}>
        {primaryLinks.map((link, index) => (
          <li key={link.href ?? `label-only-${index}-${link.label}`}>
            {link.href != null && link.href.length > 0 ? (
              <Link href={link.href} className={OPERATOR_BODY_INLINE_LINK_CLASS}>
                {renderGroundingLinkLabel(link.label)}
              </Link>
            ) : (
              <span className="text-neutral-800 dark:text-neutral-200">
                {renderGroundingLinkLabel(link.label)} ·{" "}
                {link.href === null || link.href === undefined
                  ? ASK_GROUNDING_SOURCE_LINK_NOT_STORED
                  : ASK_GROUNDING_SOURCE_LINK_STORED_EMPTY}
              </span>
            )}
          </li>
        ))}
      </ul>
      {overflowLinks.length > 0 ? (
        <details
          className="mt-2"
          open={askAssistantMoreSourcesOpen}
          onToggle={(event) => setAskAssistantMoreSourcesOpen(event.currentTarget.open)}
        >
          <summary className={cn("cursor-pointer select-none font-medium text-neutral-700 dark:text-neutral-300", OPERATOR_TYPOGRAPHY.helper)}>
            More sources ({overflowLinks.length})
          </summary>
          <ul className={cn("m-0 mt-2 list-none space-y-1.5 p-0", OPERATOR_TYPOGRAPHY.body)}>
            {overflowLinks.map((link, index) => (
              <li key={link.href ?? `overflow-label-only-${index}-${link.label}`}>
                {link.href != null && link.href.length > 0 ? (
                  <Link href={link.href} className={OPERATOR_BODY_INLINE_LINK_CLASS}>
                    {renderGroundingLinkLabel(link.label)}
                  </Link>
                ) : (
                  <span className="text-neutral-800 dark:text-neutral-200">
                    {renderGroundingLinkLabel(link.label)} ·{" "}
                    {link.href === null || link.href === undefined
                      ? ASK_GROUNDING_SOURCE_LINK_NOT_STORED
                      : ASK_GROUNDING_SOURCE_LINK_STORED_EMPTY}
                  </span>
                )}
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
 * for faster sponsor scanning (still driven by the model; see Ask service system prompt).
 */
export function AskAssistantMessageBody(props: {
  readonly content: string;
  readonly buyerPolishedLinks?: boolean;
  readonly groundingLinks?: readonly AskAssistantGroundingLink[];
  readonly citedReviewIds?: ReadonlySet<string>;
  /** When set, only UUIDs matching this review id are linkified. */
  readonly reviewIdInScope?: string | null;
}) {
  const { content, buyerPolishedLinks = false, groundingLinks, citedReviewIds: citedReviewIdsProp, reviewIdInScope } = props;
  const citedReviewIds =
    citedReviewIdsProp !== undefined
      ? citedReviewIdsProp
      : reviewIdInScope !== undefined && reviewIdInScope !== null && reviewIdInScope.trim().length > 0
        ? new Set([reviewIdInScope.trim().toLowerCase()])
        : undefined;
  const structured = parseAskAssistantStructuredSections(content);
  const footer =
    groundingLinks !== undefined && groundingLinks.length > 0 ? (
      <GroundingLinksFooter links={groundingLinks} buyerPolishedLinks={buyerPolishedLinks} />
    ) : null;

  const buyerAnswerLeadPlain = buyerPolishedLinks ? (
    <p className={cn("m-0 mb-2 font-medium text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
      Based on the evidence indexed for this review:
    </p>
  ) : null;

  if (structured !== null && buyerPolishedLinks) {
    const preambleTrim = structured.preamble.trim();
    let executiveLead: string | null = null;
    let executiveLeadRemainderNote: string | null = null;
    let preambleForRender = preambleTrim;
    let sectionsForRender = structured.sections;

    if (preambleTrim.length > 0) {
      const sp = splitBuyerAskSponsorLead(preambleTrim);

      executiveLead = sp.sentence.length > 0 ? sp.sentence : null;
      preambleForRender = sp.rest.trim();
      if (sp.rest.trim().length > 0) {
        executiveLeadRemainderNote = "Additional detail from this answer is in the sections below.";
      }
    } else {
      const riskIx = structured.sections.findIndex((section) => section.key === "risk");

      if (riskIx >= 0) {
        const rawRisk = structured.sections[riskIx]?.body.trim() ?? "";

        if (rawRisk.length > 0) {
          const sp = splitBuyerAskSponsorLead(rawRisk);

          executiveLead = sp.sentence.length > 0 ? sp.sentence : null;
          sectionsForRender = structured.sections.map((s, i) =>
            i === riskIx ? { ...s, body: sp.rest.trim().length > 0 ? sp.rest.trim() : rawRisk } : s,
          );
          if (sp.rest.trim().length > 0) {
            executiveLeadRemainderNote = "Additional detail from this answer is in the sections below.";
          }
        }
      }
    }

    if (executiveLead === null || executiveLead.length === 0) {
      executiveLead = ASK_ANSWER_LEAD_NOT_STORED;
    }

    const bodyClass = (cn("m-0 whitespace-pre-wrap text-neutral-800 dark:text-neutral-200", OPERATOR_TYPOGRAPHY.body));

    return (
      <div className="space-y-4">
        <p className={cn("m-0 font-semibold leading-snug text-neutral-900 dark:text-neutral-100", OPERATOR_TYPOGRAPHY.cardTitle)}>{executiveLead}</p>
        {executiveLeadRemainderNote !== null ? (
          <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>{executiveLeadRemainderNote}</p>
        ) : null}
        {preambleForRender.length > 0 ? (
          <p className={bodyClass}>
            {renderTextWithUuidReviewLinks(preambleForRender, buyerPolishedLinks, citedReviewIds, reviewIdInScope)}
          </p>
        ) : (
          <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>{ASK_ANSWER_PREAMBLE_NOT_STORED}</p>
        )}
        {sectionsForRender.map((section, index) => (
          <section key={`${section.key}-${index}`} aria-label={section.title} className="border-t border-neutral-100 pt-3 dark:border-neutral-800">
            <h4 className={cn("m-0 font-semibold text-neutral-900 dark:text-neutral-100", OPERATOR_TYPOGRAPHY.cardTitle)}>{section.title}</h4>
            <div className={`${bodyClass} mt-2`}>
              {section.body.length > 0
                ? renderAskSectionBody(section.body, buyerPolishedLinks, citedReviewIds, reviewIdInScope)
                : ASK_SECTION_STORED_EMPTY}
            </div>
          </section>
        ))}
        {footer}
      </div>
    );
  }

  if (structured !== null) {
    const bodyClass =
      (cn("m-0 whitespace-pre-wrap text-neutral-800 dark:text-neutral-200", OPERATOR_TYPOGRAPHY.body));

    return (
      <div className="space-y-4">
        {structured.preamble.trim().length > 0 ? (
          <p className={bodyClass}>
            {renderTextWithUuidReviewLinks(structured.preamble, buyerPolishedLinks, citedReviewIds, reviewIdInScope)}
          </p>
        ) : (
          <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>{ASK_ANSWER_PREAMBLE_NOT_STORED}</p>
        )}
        {structured.sections.map((section, index) => (
          <section key={`${section.key}-${index}`} aria-label={section.title} className="border-t border-neutral-100 pt-3 dark:border-neutral-800">
            <h4 className={cn("m-0 font-semibold text-neutral-900 dark:text-neutral-100", OPERATOR_TYPOGRAPHY.cardTitle)}>
              {section.title}
            </h4>
            <div className={`${bodyClass} mt-2`}>
              {section.body.length > 0
                ? renderAskSectionBody(section.body, buyerPolishedLinks, citedReviewIds, reviewIdInScope)
                : ASK_SECTION_STORED_EMPTY}
            </div>
          </section>
        ))}
        {footer}
      </div>
    );
  }

  if (buyerPolishedLinks) {
    const trimmed = content.trim();
    const split = splitBuyerAskSponsorLead(trimmed);
    const executiveLead =
      split.sentence.length > 0 ? split.sentence : BUYER_ASK_UNSTRUCTURED_SPONSOR_FALLBACK_LEAD;
    const bodyText =
      split.rest.trim().length > 0
        ? split.rest.trim()
        : split.sentence.length > 0
          ? ""
          : trimmed.length > 0
            ? trimmed
            : ASK_ANSWER_NOT_STORED;

    return (
      <div className="space-y-4">
        <p className={cn("m-0 font-semibold leading-snug text-neutral-900 dark:text-neutral-100", OPERATOR_TYPOGRAPHY.cardTitle)}>
          {renderTextWithUuidReviewLinks(executiveLead, buyerPolishedLinks, citedReviewIds, reviewIdInScope)}
        </p>
        <p className={cn("m-0 whitespace-pre-wrap text-neutral-800 dark:text-neutral-200", OPERATOR_TYPOGRAPHY.body)}>
          {renderTextWithUuidReviewLinks(bodyText, buyerPolishedLinks, citedReviewIds, reviewIdInScope)}
        </p>
        {footer}
      </div>
    );
  }

  return (
    <div className="space-y-0">
      {buyerAnswerLeadPlain}
      <p className={cn("m-0 whitespace-pre-wrap text-neutral-800 dark:text-neutral-200", OPERATOR_TYPOGRAPHY.body)}>
        {renderTextWithUuidReviewLinks(
          content.trim().length > 0 ? content : ASK_ANSWER_NOT_STORED,
          buyerPolishedLinks,
          citedReviewIds,
          reviewIdInScope,
        )}
      </p>
      {footer}
    </div>
  );
}
