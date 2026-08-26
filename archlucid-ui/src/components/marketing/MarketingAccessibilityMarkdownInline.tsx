import { cn } from "@/lib/utils";
import {
  MARKETING_SURFACES,
  OPERATOR_LINK,
} from "@/lib/design-tokens";
import Link from "next/link";
import type { ReactNode } from "react";

import { HelpMarkdownInlineCode } from "@/components/help/HelpMarkdownInlineCode";

export type RenderInlineOptions = {
  readonly linkMode: "external-only" | "help";
  readonly nowrapInlineCode?: boolean;
  readonly copyableInlineCode?: boolean;
};

/** Landmark names must be unique when multiple scrollable table regions appear on one page (axe landmark-unique). */
export function privacyScrollableTableRegionLabel(tableOrdinal: number): string {
  return `Scrollable comparison table ${tableOrdinal}`;
}

export function helpScrollableTableRegionLabel(sectionTitle: string, tableOrdinal: number): string {
  const base = sectionTitle.length > 0 ? sectionTitle : "Reference";
  return `Scrollable ${base} table ${tableOrdinal}`;
}

export function renderInline(text: string, keyPrefix: string, options: RenderInlineOptions): ReactNode[] {
  const nodes: ReactNode[] = [];
  let remaining = text;
  let i = 0;

  while (remaining.length > 0) {
    const linkOpen = remaining.indexOf("[");
    const boldOpen = remaining.indexOf("**");
    const codeOpen = remaining.indexOf("`");

    const candidates: Array<{ kind: "link" | "bold" | "code"; at: number }> = [];

    if (linkOpen >= 0) {
      candidates.push({ kind: "link", at: linkOpen });
    }

    if (boldOpen >= 0) {
      candidates.push({ kind: "bold", at: boldOpen });
    }

    if (codeOpen >= 0) {
      candidates.push({ kind: "code", at: codeOpen });
    }

    candidates.sort((a, b) => a.at - b.at);
    const next = candidates[0];

    if (next === undefined) {
      nodes.push(<span key={`${keyPrefix}-t-${i}`}>{remaining}</span>);
      break;
    }

    if (next.at > 0) {
      nodes.push(<span key={`${keyPrefix}-p-${i}`}>{remaining.slice(0, next.at)}</span>);
    }

    if (next.kind === "code") {
      const close = remaining.indexOf("`", next.at + 1);

      if (close < 0) {
        nodes.push(<span key={`${keyPrefix}-c-${i}`}>{remaining.slice(next.at)}</span>);
        break;
      }

      const inner = remaining.slice(next.at + 1, close);
      nodes.push(
        options.copyableInlineCode ? (
          <HelpMarkdownInlineCode key={`${keyPrefix}-ic-${i}`} code={inner} />
        ) : (
          <code
            key={`${keyPrefix}-ic-${i}`}
            className={cn(
              "rounded bg-neutral-100 px-1 py-0.5 font-mono text-[0.9em] text-neutral-900 dark:bg-neutral-800 dark:text-neutral-100",
              options.nowrapInlineCode &&
                "inline-block max-w-full overflow-x-auto whitespace-nowrap align-bottom",
            )}
          >
            {inner}
          </code>
        ),
      );
      remaining = remaining.slice(close + 1);
      i++;
      continue;
    }

    if (next.kind === "bold") {
      const close = remaining.indexOf("**", next.at + 2);
      if (close < 0) {
        nodes.push(<span key={`${keyPrefix}-b-${i}`}>{remaining.slice(next.at)}</span>);
        break;
      }

      const inner = remaining.slice(next.at + 2, close);
      nodes.push(
        <strong key={`${keyPrefix}-s-${i}`} className="font-semibold">
          {renderInline(inner, `${keyPrefix}-bi-${i}`, options)}
        </strong>,
      );
      remaining = remaining.slice(close + 2);
      i++;
      continue;
    }

    const closeBracket = remaining.indexOf("]", next.at);
    const openParen = closeBracket >= 0 ? remaining.indexOf("(", closeBracket) : -1;
    const closeParen = openParen >= 0 ? remaining.indexOf(")", openParen) : -1;

    if (closeBracket < 0 || openParen !== closeBracket + 1 || closeParen < 0) {
      nodes.push(<span key={`${keyPrefix}-lbroken-${i}`}>{remaining.slice(next.at)}</span>);
      break;
    }

    const label = remaining.slice(next.at + 1, closeBracket);
    const href = remaining.slice(openParen + 1, closeParen);
    const isExternal =
      href.startsWith("https://") || href.startsWith("http://") || href.startsWith("mailto:");
    const isInAppHelp = options.linkMode === "help" && href.startsWith("/help");
    const isSamePageAnchor = options.linkMode === "help" && href.startsWith("#") && href.length > 1;
    const isInternalOperatorRoute =
      options.linkMode === "help" && href.startsWith("/") && !href.startsWith("//") && !isInAppHelp;
    const safe = isExternal || isInAppHelp || isSamePageAnchor || isInternalOperatorRoute;
    const inAppLinkClassName = cn(OPERATOR_LINK.inline, "rounded-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--al-accent-border-focus)]");

    if (!safe) {
      nodes.push(<span key={`${keyPrefix}-unsafe-${i}`}>{label}</span>);
      remaining = remaining.slice(closeParen + 1);
      i++;
      continue;
    }

    if (isSamePageAnchor) {
      nodes.push(
        <a key={`${keyPrefix}-a-${i}`} href={href} className={inAppLinkClassName}>
          {renderInline(label, `${keyPrefix}-al-${i}`, options)}
        </a>,
      );
    }
    else {
      nodes.push(
        <Link
          key={`${keyPrefix}-a-${i}`}
          href={href}
          className={
            isInAppHelp || isInternalOperatorRoute
              ? inAppLinkClassName
              : MARKETING_SURFACES.inlineLink
          }
          {...(isExternal ? { rel: "noopener noreferrer", target: "_blank" } : {})}
        >
          {renderInline(label, `${keyPrefix}-al-${i}`, options)}
        </Link>,
      );
    }
    remaining = remaining.slice(closeParen + 1);
    i++;
  }

  return nodes;
}
