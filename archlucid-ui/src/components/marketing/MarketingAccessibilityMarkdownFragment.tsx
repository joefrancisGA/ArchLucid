import { cn } from "@/lib/utils";
import { OPERATOR_DISCLOSURE_TRIGGER_CLASS, OPERATOR_LINK, OPERATOR_SHELL_SCROLL_OFFSET_CLASS, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import Link from "next/link";
import type { ReactNode } from "react";

import { HelpLazyDetails } from "@/components/help/HelpLazyDetails";
import { HelpMarkdownCodeBlock } from "@/components/help/HelpMarkdownCodeBlock";
import { HelpMarkdownInlineCode } from "@/components/help/HelpMarkdownInlineCode";
import { CaiqSigResponseHelpEvidenceCell } from "@/components/help/CaiqSigResponseHelpEvidenceCell";
import { CaiqSigResponseHelpStatusCell } from "@/components/help/CaiqSigResponseHelpStatusCell";
import { ProcurementHelpAnswerPosture } from "@/components/help/ProcurementHelpAnswerPosture";
import { MermaidDiagram } from "@/components/help/MermaidDiagram";
import {
  CAIQ_SIG_RESPONSE_LITE_PART_HEADING,
  CAIQ_SIG_RESPONSE_SIG_PART_HEADING,
  isCaiqSigResponseHelpTopic,
  resolveCaiqSigHelpTableCaption,
} from "@/lib/caiq-sig-response-help-presentation";
import {
  isProcurementHelpTopic,
  parseProcurementFaqQuestionNumber,
  resolveProcurementFaqPostureForQuestion,
} from "@/lib/procurement-help-presentation";
import { createHelpHeadingSlugAllocator, resolveHelpHeadingId } from "@/lib/help-heading-slug";
import { isMermaidDiagramSource } from "@/lib/help-mermaid";
import { HELP_PAGE_LAYOUT } from "@/lib/help-page-layout";
import { PRIVACY_POLICY_PROSE } from "@/lib/privacy-policy-layout";
import { prepareHelpMarkdownForPresentation, sanitizeBareMarkdownFileReferences } from "@/lib/help-markdown-presentation";

type RenderInlineOptions = {
  readonly linkMode: "external-only" | "help";
  readonly nowrapInlineCode?: boolean;
  readonly copyableInlineCode?: boolean;
};

/** Landmark names must be unique when multiple scrollable table regions appear on one page (axe landmark-unique). */
function privacyScrollableTableRegionLabel(tableOrdinal: number): string {
  return `Scrollable comparison table ${tableOrdinal}`;
}

function helpScrollableTableRegionLabel(sectionTitle: string, tableOrdinal: number): string {
  const base = sectionTitle.length > 0 ? sectionTitle : "Reference";
  return `Scrollable ${base} table ${tableOrdinal}`;
}

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

function isMarkdownTaskListItem(line: string): boolean {
  return /^- \[( |x|X)\] /.test(line.trimStart());
}

function parseMarkdownTaskListItem(line: string): { readonly checked: boolean; readonly text: string } | null {
  const match = line.trim().match(/^- \[( |x|X)\] (.+)$/);

  if (match === null) {
    return null;
  }

  return {
    checked: match[1] !== " ",
    text: match[2] ?? "",
  };
}

function isMarkdownBlockStart(line: string): boolean {
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
  /** Help topics use operator typography and readable code blocks. Privacy uses legal reading typography. */
  presentation?: "marketing" | "help" | "privacy";
  /** Primary repo-relative source path for resolving internal doc links in help topics. */
  sourceDocPath?: string;
  /** In-app help topic slug for topic-specific presentation strips. */
  helpTopicSlug?: string;
  /** Engineering runbooks may show documentation governance metadata (Last reviewed, etc.). */
  preserveMaintenanceMetadata?: boolean;
  /** Optional pre-prepared markdown (for example CAIQ/SIG structured halves). */
  preparedMarkdownOverride?: string;
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
  const isPrivacy = props.presentation === "privacy";
  const isEngineeringTroubleshooting = props.helpTopicSlug === "developer-troubleshooting";
  const isCaiqSigResponse = isHelp && isCaiqSigResponseHelpTopic(props.helpTopicSlug);
  const isProcurementHelp = isHelp && isProcurementHelpTopic(props.helpTopicSlug);
  const bodyTextClass = isPrivacy
    ? PRIVACY_POLICY_PROSE.paragraph
    : isHelp
      ? OPERATOR_TYPOGRAPHY.body
      : "text-neutral-800 dark:text-neutral-200";
  const h2Class = isPrivacy
    ? PRIVACY_POLICY_PROSE.sectionH2
    : isHelp
      ? isCaiqSigResponse
        ? HELP_PAGE_LAYOUT.compactSectionH2
        : HELP_PAGE_LAYOUT.sectionH2
      : cn(
          OPERATOR_SHELL_SCROLL_OFFSET_CLASS,
          "mt-8 font-semibold tracking-tight text-neutral-900 dark:text-neutral-50",
          OPERATOR_TYPOGRAPHY.pageTitle,
        );
  const h3Class = isPrivacy
    ? PRIVACY_POLICY_PROSE.sectionH3
    : isHelp
      ? HELP_PAGE_LAYOUT.sectionH3
      : cn(OPERATOR_SHELL_SCROLL_OFFSET_CLASS, "mt-4 font-semibold text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle);
  const tableTextClass = isPrivacy || isHelp ? OPERATOR_TYPOGRAPHY.body : OPERATOR_TYPOGRAPHY.body;
  // Privacy needs in-app /help, /trust, and #section links (same allowance as help topics).
  const renderOptions: RenderInlineOptions = {
    linkMode: isHelp || isPrivacy ? "help" : "external-only",
    nowrapInlineCode: isHelp,
    copyableInlineCode: isEngineeringTroubleshooting,
  };
  const markdownBody =
    props.preparedMarkdownOverride !== undefined && props.preparedMarkdownOverride.trim().length > 0
      ? props.preparedMarkdownOverride
      : isHelp
        ? props.sourceDocPath !== undefined && props.sourceDocPath.trim().length > 0
          ? prepareHelpMarkdownForPresentation(props.markdownBody, props.sourceDocPath, {
              preserveMaintenanceMetadata: props.preserveMaintenanceMetadata === true,
              helpTopicSlug: props.helpTopicSlug,
            })
          : sanitizeBareMarkdownFileReferences(props.markdownBody)
        : isPrivacy
          ? sanitizeBareMarkdownFileReferences(props.markdownBody)
          : props.markdownBody;

  const lines = markdownBody.replace(/\r\n/g, "\n").split("\n");
  const blocks: ReactNode[] = [];
  let key = 0;
  let privacyTableOrdinal = 0;
  let helpTableOrdinal = 0;
  let currentPartLabel = "";
  let currentSectionTitle = "";
  let currentSubsectionTitle = "";
  let currentProcurementQuestionNumber: number | null = null;
  const allocateSectionSlug = createHelpHeadingSlugAllocator();
  let skippedDuplicateHelpTitle = !isHelp;

  let i = 0;
  while (i < lines.length) {
    const line = lines[i] ?? "";

    if (line.trim().length === 0) {
      i++;
      continue;
    }

    if ((isHelp || isPrivacy) && /^(\*{3,}|-{3,}|_{3,})\s*$/.test(line.trim())) {
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
        <HelpLazyDetails
          key={`details-${key}`}
          className={isHelp ? HELP_PAGE_LAYOUT.details : "my-4 rounded-md border border-neutral-200 bg-neutral-50/80 px-3 py-2 dark:border-neutral-700 dark:bg-neutral-950/40"}
          summaryClassName={cn("cursor-pointer select-none", OPERATOR_DISCLOSURE_TRIGGER_CLASS)}
          summary={summary}
          bodyClassName={isHelp ? HELP_PAGE_LAYOUT.detailsBody : "mt-3 border-t border-neutral-200 pt-3 dark:border-neutral-700"}
        >
          {innerMarkdown.length > 0 ? (
            <MarketingAccessibilityMarkdownFragment
              markdownBody={innerMarkdown}
              tableCaption={props.tableCaption}
              presentation={props.presentation}
              sourceDocPath={props.sourceDocPath}
            />
          ) : null}
        </HelpLazyDetails>,
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
          blocks.push(<MermaidDiagram key={`mermaid-${key}`} source={code} accessibleName="Help topic diagram" />);
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

      if (title === CAIQ_SIG_RESPONSE_LITE_PART_HEADING) {
        currentPartLabel = CAIQ_SIG_RESPONSE_LITE_PART_HEADING;
        currentSectionTitle = title;
      } else if (title === CAIQ_SIG_RESPONSE_SIG_PART_HEADING) {
        currentPartLabel = CAIQ_SIG_RESPONSE_SIG_PART_HEADING;
        currentSectionTitle = title;
      } else {
        currentSectionTitle = title;
        currentSubsectionTitle = "";
      }

      blocks.push(
        <h2
          key={`h2-${key}`}
          id={sectionId}
          className={h2Class}
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
        <h1 key={`h1-${key}`} className={cn("mt-2", OPERATOR_TYPOGRAPHY.pageTitle)}>
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

      if (isCaiqSigResponse) {
        currentSectionTitle = title;
      } else if (isHelp) {
        currentSubsectionTitle = title;
        currentProcurementQuestionNumber = isProcurementHelp ? parseProcurementFaqQuestionNumber(title) : null;
      }

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
            className={
              isHelp
                ? HELP_PAGE_LAYOUT.blockquote
                : cn(
                    "my-4 border-l-4 border-neutral-300 pl-4 italic text-al-text-secondary dark:border-neutral-600",
                    OPERATOR_TYPOGRAPHY.body,
                  )
            }
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

      if (isPrivacy) {
        privacyTableOrdinal++;
      } else if (isHelp) {
        helpTableOrdinal++;
      }

      const nearestTableHeading =
        currentSubsectionTitle.length > 0
          ? currentSubsectionTitle
          : currentSectionTitle.length > 0
            ? currentSectionTitle
            : props.tableCaption;

      const tableCaption = isPrivacy
        ? `${props.tableCaption} ${privacyTableOrdinal}`
        : isCaiqSigResponse
          ? resolveCaiqSigHelpTableCaption(
              currentPartLabel.length > 0 ? currentPartLabel : "Questionnaire",
              currentSectionTitle.length > 0 ? currentSectionTitle : `Section ${helpTableOrdinal}`,
            ) + ` (${helpTableOrdinal})`
          : isHelp
            ? helpScrollableTableRegionLabel(nearestTableHeading, helpTableOrdinal)
            : props.tableCaption;

      const statusColumnIndex = headerCells.findIndex((cell) => /^status$/i.test(cell));
      const responseColumnIndex = headerCells.findIndex((cell) => /^response$/i.test(cell));
      const evidenceColumnIndex = headerCells.findIndex((cell) => /^evidence$/i.test(cell));

      blocks.push(
        <div
          key={`tbl-${key}`}
          className={
            isPrivacy
              ? PRIVACY_POLICY_PROSE.tableWrap
              : isHelp
                ? isCaiqSigResponse
                  ? HELP_PAGE_LAYOUT.compactTableWrap
                  : HELP_PAGE_LAYOUT.tableWrap
                : "my-4 overflow-x-auto"
          }
          {...(isPrivacy
            ? {
                tabIndex: 0 as const,
                role: "region" as const,
                "aria-label": privacyScrollableTableRegionLabel(privacyTableOrdinal),
              }
            : isHelp
              ? {
                  tabIndex: 0 as const,
                  role: "region" as const,
                  "aria-label": helpScrollableTableRegionLabel(nearestTableHeading, helpTableOrdinal),
                }
              : {})}
        >
          <table
            className={
              isPrivacy
                ? PRIVACY_POLICY_PROSE.table
                : isHelp
                  ? HELP_PAGE_LAYOUT.table
                  : cn("w-full border-collapse border border-neutral-200 dark:border-neutral-800", tableTextClass)
            }
          >
            <caption className="sr-only">{tableCaption}</caption>
            <thead className={isPrivacy || isHelp ? undefined : "bg-neutral-100 dark:bg-neutral-900"}>
              <tr>
                {headerCells.map((c, idx) => (
                  <th
                    key={`th-${key}-${idx}`}
                    scope="col"
                    className={
                      isPrivacy
                        ? PRIVACY_POLICY_PROSE.tableHeadCell
                        : isHelp
                          ? HELP_PAGE_LAYOUT.tableHeadCell
                          : "border border-neutral-200 px-3 py-2 text-left font-semibold dark:border-neutral-800"
                    }
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
                  <tr
                    key={`tr-${key}-${rIdx}`}
                    className={
                      isPrivacy
                        ? rIdx % 2 === 0
                          ? PRIVACY_POLICY_PROSE.tableRowOdd
                          : PRIVACY_POLICY_PROSE.tableRowEven
                        : isHelp
                          ? rIdx % 2 === 0
                            ? HELP_PAGE_LAYOUT.tableRowOdd
                            : HELP_PAGE_LAYOUT.tableRowEven
                          : "odd:bg-white even:bg-neutral-50 dark:odd:bg-neutral-950 dark:even:bg-neutral-900/60"
                    }
                  >
                    {cells.map((c, cIdx) => (
                      <td
                        key={`td-${key}-${rIdx}-${cIdx}`}
                        className={
                          isPrivacy
                            ? PRIVACY_POLICY_PROSE.tableBodyCell
                            : isHelp
                              ? HELP_PAGE_LAYOUT.tableBodyCell
                              : "border border-neutral-200 px-3 py-2 dark:border-neutral-800"
                        }
                      >
                        {isCaiqSigResponse && cIdx === statusColumnIndex && statusColumnIndex >= 0 ? (
                          <CaiqSigResponseHelpStatusCell
                            statusLabel={c}
                            renderInline={(text, keyPrefix) => renderInline(text, keyPrefix, renderOptions)}
                          />
                        ) : isCaiqSigResponse &&
                          cIdx === responseColumnIndex &&
                          responseColumnIndex >= 0 ? (
                          <CaiqSigResponseHelpStatusCell
                            statusLabel={c}
                            renderInline={(text, keyPrefix) => renderInline(text, keyPrefix, renderOptions)}
                          />
                        ) : isCaiqSigResponse && cIdx === evidenceColumnIndex && evidenceColumnIndex >= 0 ? (
                          <CaiqSigResponseHelpEvidenceCell
                            evidenceMarkdown={c}
                            statusLabel={statusColumnIndex >= 0 ? (cells[statusColumnIndex] ?? "") : undefined}
                            renderInline={(text, keyPrefix) => renderInline(text, keyPrefix, renderOptions)}
                          />
                        ) : (
                          renderInline(c, `td-${key}-${rIdx}-${cIdx}`, renderOptions)
                        )}
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

    if (isMarkdownTaskListItem(line)) {
      const items: Array<{ readonly checked: boolean; readonly text: string }> = [];
      while (i < lines.length) {
        const l = lines[i] ?? "";

        if (l.trim().length === 0) {
          break;
        }

        const parsed = parseMarkdownTaskListItem(l);

        if (parsed === null) {
          break;
        }

        items.push(parsed);
        i++;
      }

      blocks.push(
        <ul
          key={`task-ul-${key}`}
          className={
            isHelp
              ? cn(HELP_PAGE_LAYOUT.bulletList, "list-none space-y-2 pl-0")
              : cn("my-3 list-none space-y-2 pl-0", bodyTextClass)
          }
        >
          {items.map((item, idx) => (
            <li key={`task-li-${key}-${idx}`} className="flex items-start gap-2">
              <span
                aria-hidden="true"
                className={cn(
                  "mt-0.5 inline-flex h-4 w-4 shrink-0 rounded border border-neutral-400 dark:border-neutral-500",
                  item.checked && "bg-neutral-700 dark:bg-neutral-300",
                )}
              />
              <span>{renderInline(item.text, `task-li-${key}-${idx}`, renderOptions)}</span>
            </li>
          ))}
        </ul>,
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
        <ul
          key={`ul-${key}`}
          className={
            isPrivacy
              ? PRIVACY_POLICY_PROSE.bulletList
              : isHelp
                ? HELP_PAGE_LAYOUT.bulletList
                : cn("my-3 list-disc space-y-2 pl-6", bodyTextClass)
          }
        >
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
        <ol
          key={`ol-${key}`}
          className={
            isPrivacy
              ? PRIVACY_POLICY_PROSE.orderedList
              : isHelp
                ? HELP_PAGE_LAYOUT.orderedList
                : "my-3 list-decimal space-y-2 pl-6 text-neutral-800 dark:text-neutral-200"
          }
        >
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
      const procurementPosture =
        isProcurementHelp && paragraph.startsWith("**Answer:**")
          ? resolveProcurementFaqPostureForQuestion(currentProcurementQuestionNumber ?? -1)
          : null;

      if (procurementPosture !== null) {
        blocks.push(
          <div key={`procurement-answer-${key}`} className={isHelp ? HELP_PAGE_LAYOUT.paragraph : undefined}>
            <ProcurementHelpAnswerPosture
              posture={procurementPosture}
              answerMarkdown={paragraph}
              renderInline={(text, keyPrefix) => renderInline(text, keyPrefix, renderOptions)}
            />
          </div>,
        );
        key++;
        continue;
      }

      blocks.push(
        <p
          key={`p-${key}`}
          className={
            isPrivacy
              ? PRIVACY_POLICY_PROSE.paragraph
              : isHelp
                ? HELP_PAGE_LAYOUT.paragraph
                : cn("my-3 leading-relaxed", bodyTextClass)
          }
        >
          {renderInline(paragraph, `p-${key}`, renderOptions)}
        </p>,
      );
      key++;
    }
  }

  return (
    <div className={isPrivacy ? PRIVACY_POLICY_PROSE.root : isHelp ? HELP_PAGE_LAYOUT.proseRoot : "space-y-1"}>
      {blocks}
    </div>
  );
}
