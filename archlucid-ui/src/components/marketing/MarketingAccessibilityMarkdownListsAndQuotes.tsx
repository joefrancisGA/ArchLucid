import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

import { HELP_PAGE_LAYOUT } from "@/lib/help/help-page-layout";
import { PRIVACY_POLICY_PROSE } from "@/lib/privacy-policy-layout";

import { renderInline, type RenderInlineOptions } from "./MarketingAccessibilityMarkdownInline";
import { isTableRow } from "./MarketingAccessibilityMarkdownTables";

export function isMarkdownTaskListItem(line: string): boolean {
  return /^- \[( |x|X)\] /.test(line.trimStart());
}

export function parseMarkdownTaskListItem(line: string): { readonly checked: boolean; readonly text: string } | null {
  const match = line.trim().match(/^- \[( |x|X)\] (.+)$/);

  if (match === null) {
    return null;
  }

  return {
    checked: match[1] !== " ",
    text: match[2] ?? "",
  };
}

export function isMarkdownBlockStart(line: string): boolean {
  const trimmed = line.trim();

  if (trimmed.startsWith("<details")) {
    return true;
  }

  if ((line.startsWith("## ") && !line.startsWith("###")) || (line.startsWith("# ") && !line.startsWith("##"))) {
    return true;
  }

  if (line.startsWith("### ") || trimmed.startsWith(">") || isTableRow(line) || isMarkdownTaskListItem(line) || trimmed.startsWith("- ")) {
    return true;
  }

  if (/^\d+\.\s+/.test(trimmed)) {
    return true;
  }

  if (trimmed.startsWith("```")) {
    return true;
  }

  return false;
}

export type MarketingAccessibilityMarkdownListQuoteContext = {
  readonly key: number;
  readonly lines: readonly string[];
  readonly startIndex: number;
  readonly isHelp: boolean;
  readonly isPrivacy: boolean;
  readonly bodyTextClass: string;
  readonly renderOptions: RenderInlineOptions;
};

export function tryRenderMarketingAccessibilityMarkdownListOrQuote(
  ctx: MarketingAccessibilityMarkdownListQuoteContext,
): { readonly node: ReactNode | null; readonly nextIndex: number } | null {
  const line = ctx.lines[ctx.startIndex] ?? "";

  if (line.trimStart().startsWith(">")) {
    const quoteLines: string[] = [];
    let index = ctx.startIndex;

    while (index < ctx.lines.length) {
      const currentLine = ctx.lines[index] ?? "";
      const trimmed = currentLine.trimStart();

      if (!trimmed.startsWith(">")) {
        break;
      }

      quoteLines.push(trimmed.slice(1).trimStart());
      index++;
    }

    const body = quoteLines.join("\n").trim();

    if (body.length === 0) {
      return { node: null, nextIndex: index };
    }

    return {
      node: (
        <blockquote
          key={`bq-${ctx.key}`}
          className={
            ctx.isHelp
              ? HELP_PAGE_LAYOUT.blockquote
              : cn(
                  "my-4 border-l-4 border-neutral-300 pl-4 italic text-al-text-secondary dark:border-neutral-600",
                  ctx.bodyTextClass,
                )
          }
        >
          <p className="m-0 leading-relaxed">{renderInline(body, `bq-${ctx.key}`, ctx.renderOptions)}</p>
        </blockquote>
      ),
      nextIndex: index,
    };
  }

  if (isMarkdownTaskListItem(line)) {
    const items: Array<{ readonly checked: boolean; readonly text: string }> = [];
    let index = ctx.startIndex;

    while (index < ctx.lines.length) {
      const currentLine = ctx.lines[index] ?? "";

      if (currentLine.trim().length === 0) {
        break;
      }

      const parsed = parseMarkdownTaskListItem(currentLine);

      if (parsed === null) {
        break;
      }

      items.push(parsed);
      index++;
    }

    return {
      node: (
        <ul
          key={`task-ul-${ctx.key}`}
          className={
            ctx.isHelp
              ? cn(HELP_PAGE_LAYOUT.bulletList, "list-none space-y-2 pl-0")
              : cn("my-3 list-none space-y-2 pl-0", ctx.bodyTextClass)
          }
        >
          {items.map((item, idx) => (
            <li key={`task-li-${ctx.key}-${idx}`} className="flex items-start gap-2">
              <span
                aria-hidden="true"
                className={cn(
                  "mt-0.5 inline-flex h-4 w-4 shrink-0 rounded border border-neutral-400 dark:border-neutral-500",
                  item.checked && "bg-neutral-700 dark:bg-neutral-300",
                )}
              />
              <span>{renderInline(item.text, `task-li-${ctx.key}-${idx}`, ctx.renderOptions)}</span>
            </li>
          ))}
        </ul>
      ),
      nextIndex: index,
    };
  }

  if (line.trimStart().startsWith("- ")) {
    const items: string[] = [];
    let index = ctx.startIndex;

    while (index < ctx.lines.length) {
      const currentLine = ctx.lines[index] ?? "";

      if (currentLine.trim().length === 0) {
        break;
      }

      if (!currentLine.trimStart().startsWith("- ")) {
        break;
      }

      items.push(currentLine.trim().slice(2));
      index++;
    }

    return {
      node: (
        <ul
          key={`ul-${ctx.key}`}
          className={
            ctx.isPrivacy
              ? PRIVACY_POLICY_PROSE.bulletList
              : ctx.isHelp
                ? HELP_PAGE_LAYOUT.bulletList
                : cn("my-3 list-disc space-y-2 pl-6", ctx.bodyTextClass)
          }
        >
          {items.map((item, idx) => (
            <li key={`li-${ctx.key}-${idx}`}>{renderInline(item, `li-${ctx.key}-${idx}`, ctx.renderOptions)}</li>
          ))}
        </ul>
      ),
      nextIndex: index,
    };
  }

  if (/^\d+\.\s+/.test(line.trimStart())) {
    const items: string[] = [];
    let index = ctx.startIndex;

    while (index < ctx.lines.length) {
      const currentLine = ctx.lines[index] ?? "";

      if (currentLine.trim().length === 0) {
        break;
      }

      const trimmed = currentLine.trimStart();

      if (!/^\d+\.\s+/.test(trimmed)) {
        break;
      }

      items.push(trimmed.replace(/^\d+\.\s+/, ""));
      index++;
    }

    return {
      node: (
        <ol
          key={`ol-${ctx.key}`}
          className={
            ctx.isPrivacy
              ? PRIVACY_POLICY_PROSE.orderedList
              : ctx.isHelp
                ? HELP_PAGE_LAYOUT.orderedList
                : "my-3 list-decimal space-y-2 pl-6 text-neutral-800 dark:text-neutral-200"
          }
        >
          {items.map((item, idx) => (
            <li key={`oli-${ctx.key}-${idx}`}>{renderInline(item, `oli-${ctx.key}-${idx}`, ctx.renderOptions)}</li>
          ))}
        </ol>
      ),
      nextIndex: index,
    };
  }

  return null;
}
