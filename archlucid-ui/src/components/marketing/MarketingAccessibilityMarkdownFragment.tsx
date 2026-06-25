import Link from "next/link";
import type { ReactNode } from "react";

import { HelpMarkdownCodeBlock } from "@/components/help/HelpMarkdownCodeBlock";
import { MermaidDiagram } from "@/components/help/MermaidDiagram";
import { createHelpHeadingSlugAllocator, resolveHelpHeadingId } from "@/lib/help-heading-slug";
import { isMermaidDiagramSource } from "@/lib/help-mermaid";
import { prepareHelpMarkdownForPresentation, sanitizeBareMarkdownFileReferences } from "@/lib/help-markdown-presentation";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

type RenderInlineOptions = {
  readonly linkMode: "external-only" | "help";
};

function renderInline(text: string, keyPrefix: string, options: RenderInlineOptions): ReactNode[] {
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
        <code
          key={`${keyPrefix}-ic-${i}`}
          className="rounded bg-neutral-100 px-1 py-0.5 font-mono text-[0.9em] text-neutral-900 dark:bg-neutral-800 dark:text-neutral-100"
        >
          {inner}
        </code>,
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
    const inAppLinkClassName =
      "rounded-sm text-teal-800 underline decoration-teal-700/40 underline-offset-2 hover:text-teal-950 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-600 dark:text-teal-300 dark:hover:text-teal-100 dark:focus-visible:outline-teal-400";

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
              : "text-blue-700 underline underline-offset-2 hover:text-blue-900 dark:text-blue-300 dark:hover:text-blue-200"
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

function parseDetailsSummary(openingLine: string, nextLine: string | undefined): { summary: string; contentStartOffset: number } {
  const attributeMatch = openingLine.match(/<details[^>]*\ssummary="([^"]*)"/i);

  if (attributeMatch?.[1] !== undefined) {
    return { summary: attributeMatch[1], contentStartOffset: 0 };
  }

  const summaryLine = nextLine?.trim() ?? "";
  const inlineSummaryMatch = summaryLine.match(/^<summary>([\s\S]*?)<\/summary>$/i);

  if (inlineSummaryMatch?.[1] !== undefined) {
    return { summary: inlineSummaryMatch[1].trim(), contentStartOffset: 1 };
  }

  return { summary: "Advanced", contentStartOffset: 0 };
}

function isMarkdownBlockStart(line: string): boolean {
  const trimmed = line.trim();

  if (trimmed.startsWith("<details")) {
    return true;
  }

  if ((line.startsWith("## ") && !line.startsWith("###")) || (line.startsWith("# ") && !line.startsWith("##"))) {
    return true;
  }

  if (line.startsWith("### ") || trimmed.startsWith(">") || isTableRow(line) || trimmed.startsWith("- ")) {
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

function isTableRow(line: string): boolean {
  const t = line.trim();
  return t.startsWith("|") && t.endsWith("|");
}

function isTableDivider(line: string): boolean {
  const t = line.trim();
  return /^\|?[\s|:-]+\|?$/.test(t) && t.includes("-");
}

type MarketingAccessibilityMarkdownFragmentProps = {
  markdownBody: string;
  tableCaption: string;
  /** Help topics use operator typography and readable code blocks. */
  presentation?: "marketing" | "help";
  /** Primary repo-relative source path for resolving internal doc links in help topics. */
  sourceDocPath?: string;
};

/**
 * Minimal Markdown → HTML for trusted repo policy fragments (no `dangerouslySetInnerHTML`).
 * Supports paragraphs, headings, lists, tables, fenced code, inline code, **bold**, and `[text](url)` links.
 */
export function MarketingAccessibilityMarkdownFragment(props: MarketingAccessibilityMarkdownFragmentProps): React.ReactNode {
  if (props.markdownBody.length === 0) {
    return null;
  }

  const isHelp = props.presentation === "help";
  const bodyTextClass = isHelp ? OPERATOR_TYPOGRAPHY.body : "text-neutral-800 dark:text-neutral-200";
  const h3Class = isHelp
    ? "scroll-mt-24 mt-6 text-base font-semibold text-al-text-primary"
    : "scroll-mt-24 mt-4 text-sm font-semibold text-al-text-primary";
  const tableTextClass = isHelp ? "text-sm" : "text-sm";
  const renderOptions: RenderInlineOptions = { linkMode: isHelp ? "help" : "external-only" };
  const markdownBody =
    isHelp
      ? props.sourceDocPath !== undefined && props.sourceDocPath.trim().length > 0
        ? prepareHelpMarkdownForPresentation(props.markdownBody, props.sourceDocPath)
        : sanitizeBareMarkdownFileReferences(props.markdownBody)
      : props.markdownBody;

  const lines = markdownBody.replace(/\r\n/g, "\n").split("\n");
  const blocks: ReactNode[] = [];
  let key = 0;
  const allocateSectionSlug = createHelpHeadingSlugAllocator();
  let skippedDuplicateHelpTitle = !isHelp;

  let i = 0;
  while (i < lines.length) {
    const line = lines[i] ?? "";

    if (line.trim().length === 0) {
      i++;
      continue;
    }

    if (line.trim().startsWith("<details")) {
      const { summary, contentStartOffset } = parseDetailsSummary(line, lines[i + 1]);
      i++;

      if (contentStartOffset > 0) {
        i++;
      }

      const innerLines: string[] = [];

      while (i < lines.length) {
        const innerLine = lines[i] ?? "";

        if (innerLine.trim().toLowerCase() === "</details>") {
          i++;
          break;
        }

        innerLines.push(innerLine);
        i++;
      }

      const innerMarkdown = innerLines.join("\n").trim();

      blocks.push(
        <details
          key={`details-${key}`}
          className="my-4 rounded-md border border-neutral-200 bg-neutral-50/80 px-3 py-2 dark:border-neutral-700 dark:bg-neutral-950/40"
        >
          <summary className="cursor-pointer select-none text-sm font-medium text-neutral-800 dark:text-neutral-200">
            {summary}
          </summary>
          <div className="mt-3 border-t border-neutral-200 pt-3 dark:border-neutral-700">
            {innerMarkdown.length > 0 ? (
              <MarketingAccessibilityMarkdownFragment
                markdownBody={innerMarkdown}
                tableCaption={props.tableCaption}
                presentation={props.presentation}
                sourceDocPath={props.sourceDocPath}
              />
            ) : null}
          </div>
        </details>,
      );
      key++;
      continue;
    }

    if (line.trimStart().startsWith("```")) {
      const fence = line.trim();
      const language = fence.length > 3 ? fence.slice(3).trim() : "";
      const codeLines: string[] = [];
      i++;

      while (i < lines.length) {
        const codeLine = lines[i] ?? "";

        if (codeLine.trimStart().startsWith("```")) {
          i++;
          break;
        }

        codeLines.push(codeLine);
        i++;
      }

      const code = codeLines.join("\n").replace(/\n$/, "");

      if (code.length > 0) {
        if (isMermaidDiagramSource(code, language)) {
          blocks.push(<MermaidDiagram key={`mermaid-${key}`} source={code} />);
        }
        else {
          blocks.push(<HelpMarkdownCodeBlock key={`code-${key}`} code={code} language={language} />);
        }

        key++;
      }

      continue;
    }

    if (line.startsWith("## ") && !line.startsWith("###")) {
      const rawTitle = line.slice(3).trim();
      const { id: sectionId, title } = resolveHelpHeadingId(rawTitle, allocateSectionSlug);
      blocks.push(
        <h2
          key={`h2-${key}`}
          id={sectionId}
          className="scroll-mt-24 mt-8 text-xl font-semibold tracking-tight text-neutral-900 dark:text-neutral-50"
        >
          {renderInline(title, `h2-${key}`, renderOptions)}
        </h2>,
      );
      key++;
      i++;
      continue;
    }

    if (line.startsWith("# ") && !line.startsWith("##")) {
      if (isHelp && !skippedDuplicateHelpTitle) {
        skippedDuplicateHelpTitle = true;
        i++;
        continue;
      }

      const title = line.slice(2).trim();
      blocks.push(
        <h1 key={`h1-${key}`} className="mt-2 text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-50">
          {renderInline(title, `h1-${key}`, renderOptions)}
        </h1>,
      );
      key++;
      i++;
      continue;
    }

    if (line.startsWith("### ")) {
      const rawTitle = line.slice(4).trim();
      const { id: sectionId, title } = resolveHelpHeadingId(rawTitle, allocateSectionSlug);
      blocks.push(
        <h3
          key={`h3-${key}`}
          id={sectionId}
          className={h3Class}
        >
          {renderInline(title, `h3-${key}`, renderOptions)}
        </h3>,
      );
      key++;
      i++;
      continue;
    }

    if (line.trimStart().startsWith(">")) {
      const quoteLines: string[] = [];
      while (i < lines.length) {
        const l = lines[i] ?? "";
        const t = l.trimStart();
        if (!t.startsWith(">")) {
          break;
        }

        quoteLines.push(t.slice(1).trimStart());
        i++;
      }

      const body = quoteLines.join("\n").trim();
      if (body.length > 0) {
        blocks.push(
          <blockquote
            key={`bq-${key}`}
            className="my-4 border-l-4 border-neutral-300 pl-4 text-sm italic text-neutral-700 dark:border-neutral-600 dark:text-neutral-300"
          >
            <p className="m-0 leading-relaxed">{renderInline(body, `bq-${key}`, renderOptions)}</p>
          </blockquote>,
        );
        key++;
      }

      continue;
    }

    if (isTableRow(line)) {
      const tableLines: string[] = [];
      while (i < lines.length && isTableRow(lines[i] ?? "")) {
        tableLines.push(lines[i] ?? "");
        i++;
      }

      const bodyRows = tableLines.filter((r) => !isTableDivider(r));
      if (bodyRows.length === 0) {
        continue;
      }

      const headerCells = bodyRows[0]!
        .split("|")
        .map((c) => c.trim())
        .filter((c) => c.length > 0);
      const dataStart = isTableDivider(bodyRows[1] ?? "") ? 2 : 1;

      blocks.push(
        <div key={`tbl-${key}`} className="my-4 overflow-x-auto">
          <table className={cn("w-full border-collapse border border-neutral-200 dark:border-neutral-800", tableTextClass)}>
            <caption className="sr-only">{props.tableCaption}</caption>
            <thead className="bg-neutral-100 dark:bg-neutral-900">
              <tr>
                {headerCells.map((c, idx) => (
                  <th
                    key={`th-${key}-${idx}`}
                    scope="col"
                    className="border border-neutral-200 px-3 py-2 text-left font-semibold dark:border-neutral-800"
                  >
                    {renderInline(c, `th-${key}-${idx}`, renderOptions)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {bodyRows.slice(dataStart).map((row, rIdx) => {
                const cells = row
                  .split("|")
                  .map((c) => c.trim())
                  .filter((c) => c.length > 0);

                return (
                  <tr key={`tr-${key}-${rIdx}`} className="odd:bg-white even:bg-neutral-50 dark:odd:bg-neutral-950 dark:even:bg-neutral-900/60">
                    {cells.map((c, cIdx) => (
                      <td key={`td-${key}-${rIdx}-${cIdx}`} className="border border-neutral-200 px-3 py-2 dark:border-neutral-800">
                        {renderInline(c, `td-${key}-${rIdx}-${cIdx}`, renderOptions)}
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>,
      );
      key++;
      continue;
    }

    if (line.trimStart().startsWith("- ")) {
      const items: string[] = [];
      while (i < lines.length) {
        const l = lines[i] ?? "";
        if (l.trim().length === 0) {
          break;
        }

        if (!l.trimStart().startsWith("- ")) {
          break;
        }

        items.push(l.trim().slice(2));
        i++;
      }

      blocks.push(
        <ul key={`ul-${key}`} className={cn("my-3 list-disc space-y-2 pl-6", bodyTextClass)}>
          {items.map((it, idx) => (
            <li key={`li-${key}-${idx}`}>{renderInline(it, `li-${key}-${idx}`, renderOptions)}</li>
          ))}
        </ul>,
      );
      key++;
      continue;
    }

    if (/^\d+\.\s+/.test(line.trimStart())) {
      const items: string[] = [];
      while (i < lines.length) {
        const l = lines[i] ?? "";
        if (l.trim().length === 0) {
          break;
        }

        const t = l.trimStart();
        if (!/^\d+\.\s+/.test(t)) {
          break;
        }

        items.push(t.replace(/^\d+\.\s+/, ""));
        i++;
      }

      blocks.push(
        <ol key={`ol-${key}`} className="my-3 list-decimal space-y-2 pl-6 text-neutral-800 dark:text-neutral-200">
          {items.map((it, idx) => (
            <li key={`oli-${key}-${idx}`}>{renderInline(it, `oli-${key}-${idx}`, renderOptions)}</li>
          ))}
        </ol>,
      );
      key++;
      continue;
    }

    const paraLines: string[] = [];
    while (i < lines.length) {
      const l = lines[i] ?? "";
      if (l.trim().length === 0) {
        break;
      }

      if (
        isMarkdownBlockStart(l)
      ) {
        break;
      }

      paraLines.push(l);
      i++;
    }

    const paragraph = paraLines.join(" ").trim();
    if (paragraph.length > 0) {
      blocks.push(
        <p key={`p-${key}`} className={cn("my-3 leading-relaxed", bodyTextClass)}>
          {renderInline(paragraph, `p-${key}`, renderOptions)}
        </p>,
      );
      key++;
    }
  }

  return <div className="space-y-1">{blocks}</div>;
}
