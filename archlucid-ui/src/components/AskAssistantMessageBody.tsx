"use client";

import Link from "next/link";
import { Fragment, type ReactNode } from "react";

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

function GroundingLinksFooter(props: { readonly links: readonly AskAssistantGroundingLink[] }) {
  return (
    <div className="mt-4 rounded-lg border border-neutral-200/90 bg-white/80 p-3 dark:border-neutral-700 dark:bg-neutral-900/40">
      <p className="m-0 text-xs font-semibold text-neutral-600 dark:text-neutral-400">
        Sources in this review package
      </p>
      <ul className="m-0 mt-2 list-none space-y-1.5 p-0 text-sm">
        {props.links.map((link) => (
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
      <GroundingLinksFooter links={groundingLinks} />
    ) : null;

  if (structured !== null) {
    const bodyClass =
      "m-0 whitespace-pre-wrap text-sm text-neutral-800 dark:text-neutral-200";

    return (
      <div className="space-y-4">
        {structured.preamble.length > 0 ? (
          <p className={bodyClass}>{renderTextWithUuidReviewLinks(structured.preamble, buyerPolishedLinks)}</p>
        ) : null}
        {structured.sections.map((section, index) => (
          <section key={`${section.key}-${index}`} aria-label={section.title}>
            <h4 className="m-0 text-xs font-semibold text-neutral-600 dark:text-neutral-400">
              {section.title}
            </h4>
            <div className={`${bodyClass} mt-1.5`}>
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

  return (
    <div className="space-y-0">
      <p className="m-0 whitespace-pre-wrap text-sm text-neutral-800 dark:text-neutral-200">
        {renderTextWithUuidReviewLinks(content, buyerPolishedLinks)}
      </p>
      {footer}
    </div>
  );
}
