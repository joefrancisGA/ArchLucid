import { cn } from "@/lib/utils";
import {
  MARKETING_TYPOGRAPHY,
  OPERATOR_SHELL_SCROLL_OFFSET_CLASS,
  OPERATOR_TYPOGRAPHY,
} from "@/lib/design-tokens";
import type { ReactNode } from "react";

import { HelpMarkdownCodeBlock } from "@/components/help/HelpMarkdownCodeBlock";
import { MermaidDiagram } from "@/components/help/MermaidDiagram";
import { PrivacyPolicySectionCopyLink } from "@/components/marketing/privacy-policy/PrivacyPolicySectionCopyLink";
import { ProcurementHelpAnswerPosture } from "@/components/help/ProcurementHelpAnswerPosture";
import {
  CAIQ_SIG_RESPONSE_LITE_PART_HEADING,
  CAIQ_SIG_RESPONSE_SIG_PART_HEADING,
  isCaiqSigResponseHelpTopic,
} from "@/lib/caiq-sig-response-help-presentation";
import {
  isProcurementHelpTopic,
  parseProcurementFaqQuestionNumber,
  resolveProcurementFaqPostureForQuestion,
} from "@/lib/procurement-help-presentation";
import { createHelpHeadingSlugAllocator, resolveHelpHeadingId } from "@/lib/help/help-heading-slug";
import { isMermaidDiagramSource } from "@/lib/help/help-mermaid";
import { HELP_PAGE_LAYOUT } from "@/lib/help/help-page-layout";
import { PRIVACY_POLICY_PROSE } from "@/lib/privacy-policy-layout";
import { prepareHelpMarkdownForPresentation, sanitizeBareMarkdownFileReferences } from "@/lib/help/help-markdown-presentation";
import { isSecurityTrustHelpTopic } from "@/lib/security-trust-help-presentation";

import {
  MarketingAccessibilityMarkdownDetailsBlock,
  parseDetailsSummary,
  parseDetailsTestId,
} from "./MarketingAccessibilityMarkdownDetails";
import { renderInline, type RenderInlineOptions } from "./MarketingAccessibilityMarkdownInline";
import {
  renderMarketingAccessibilityMarkdownTable,
} from "./MarketingAccessibilityMarkdownTables";

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
  const isMarketingPresentation = props.presentation === "marketing";
  const isEngineeringTroubleshooting = props.helpTopicSlug === "engineering-troubleshooting";
  const isCaiqSigResponse = isHelp && isCaiqSigResponseHelpTopic(props.helpTopicSlug);
  const isSecurityTrustHelp = isHelp && isSecurityTrustHelpTopic(props.helpTopicSlug);
  const isProcurementHelp = isHelp && isProcurementHelpTopic(props.helpTopicSlug);
  const isReviewGuideHelp = isHelp && props.helpTopicSlug === "review-guide";
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
      : isMarketingPresentation
        ? cn(OPERATOR_SHELL_SCROLL_OFFSET_CLASS, "mt-8", MARKETING_TYPOGRAPHY.sectionTitle)
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
      const detailsTestId = parseDetailsTestId(line);
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
        <MarketingAccessibilityMarkdownDetailsBlock
          key={`details-${key}`}
          summary={summary}
          detailsTestId={detailsTestId}
          innerMarkdown={innerMarkdown}
          isHelp={isHelp}
          tableCaption={props.tableCaption}
          presentation={props.presentation}
          sourceDocPath={props.sourceDocPath}
        />,
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
        isPrivacy ? (
          <div key={`h2-wrap-${key}`} className={PRIVACY_POLICY_PROSE.sectionHeadingRow}>
            <h2 id={sectionId} className={h2Class}>
              {renderInline(title, `h2-${key}`, renderOptions)}
            </h2>
            <PrivacyPolicySectionCopyLink sectionId={sectionId} sectionTitle={title} />
          </div>
        ) : (
          <h2 key={`h2-${key}`} id={sectionId} className={h2Class}>
            {renderInline(title, `h2-${key}`, renderOptions)}
          </h2>
        ),
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
        isPrivacy ? (
          <div key={`h3-wrap-${key}`} className={PRIVACY_POLICY_PROSE.sectionH3Row}>
            <h3 id={sectionId} className={h3Class}>
              {renderInline(title, `h3-${key}`, renderOptions)}
            </h3>
            <PrivacyPolicySectionCopyLink sectionId={sectionId} sectionTitle={title} />
          </div>
        ) : (
          <h3 key={`h3-${key}`} id={sectionId} className={h3Class}>
            {renderInline(title, `h3-${key}`, renderOptions)}
          </h3>
        ),
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

      if (isPrivacy) {
        privacyTableOrdinal++;
      } else if (isHelp) {
        helpTableOrdinal++;
      }

      const tableNode = renderMarketingAccessibilityMarkdownTable({
        key,
        tableLines,
        isPrivacy,
        isHelp,
        isCaiqSigResponse,
        isSecurityTrustHelp,
        isReviewGuideHelp,
        tableCaptionProp: props.tableCaption,
        privacyTableOrdinal,
        helpTableOrdinal,
        currentPartLabel,
        currentSectionTitle,
        currentSubsectionTitle,
        tableTextClass,
        renderOptions,
      });

      if (tableNode !== null) {
        blocks.push(tableNode);
        key++;
      }

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
