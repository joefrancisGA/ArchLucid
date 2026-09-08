import { cn } from "@/lib/utils";
import {
  MARKETING_TYPOGRAPHY,
  OPERATOR_SHELL_SCROLL_OFFSET_CLASS,
  OPERATOR_TYPOGRAPHY,
} from "@/lib/design-tokens";
import type { ReactNode } from "react";

import { ProcurementHelpAnswerPosture } from "@/components/help/ProcurementHelpAnswerPosture";
import {
  isCaiqSigResponseHelpTopic,
} from "@/lib/caiq-sig-response-help-presentation";
import {
  isProcurementHelpTopic,
  resolveProcurementFaqPostureForQuestion,
} from "@/lib/procurement-help-presentation";
import { createHelpHeadingSlugAllocator } from "@/lib/help/help-heading-slug";
import { HELP_PAGE_LAYOUT } from "@/lib/help/help-page-layout";
import { PRIVACY_POLICY_PROSE } from "@/lib/privacy-policy-layout";
import { prepareHelpMarkdownForPresentation, sanitizeBareMarkdownFileReferences } from "@/lib/help/help-markdown-presentation";
import { resolveProductLineId } from "@/lib/product-line/resolve-product-line-id";
import type { ProductLineId } from "@/lib/product-line/product-line-id";
import { isSecurityTrustHelpTopic } from "@/lib/security-trust-help-presentation";

import {
  isMarkdownCodeFenceLine,
  parseMarkdownCodeFenceBlock,
  renderMarketingAccessibilityMarkdownCodeFence,
} from "./MarketingAccessibilityMarkdownCodeFences";
import {
  MarketingAccessibilityMarkdownDetailsBlock,
  parseDetailsSummary,
  parseDetailsTestId,
} from "./MarketingAccessibilityMarkdownDetails";
import { tryRenderMarketingAccessibilityMarkdownHeading } from "./MarketingAccessibilityMarkdownHeadings";
import { renderInline, type RenderInlineOptions } from "./MarketingAccessibilityMarkdownInline";
import {
  isMarkdownBlockStart,
  tryRenderMarketingAccessibilityMarkdownListOrQuote,
} from "./MarketingAccessibilityMarkdownListsAndQuotes";
import {
  isTableRow,
  renderMarketingAccessibilityMarkdownTable,
} from "./MarketingAccessibilityMarkdownTables";

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
  /** Override active product line for help markdown brand rewrite (defaults to {@link resolveProductLineId}). */
  productLineId?: ProductLineId;
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
  const productLineId = props.productLineId ?? resolveProductLineId();
  const markdownBody =
    props.preparedMarkdownOverride !== undefined && props.preparedMarkdownOverride.trim().length > 0
      ? props.preparedMarkdownOverride
      : isHelp
        ? props.sourceDocPath !== undefined && props.sourceDocPath.trim().length > 0
          ? prepareHelpMarkdownForPresentation(props.markdownBody, props.sourceDocPath, {
              preserveMaintenanceMetadata: props.preserveMaintenanceMetadata === true,
              helpTopicSlug: props.helpTopicSlug,
              productLineId,
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

    if (isMarkdownCodeFenceLine(line)) {
      const parsed = parseMarkdownCodeFenceBlock(lines, i);
      const codeNode = renderMarketingAccessibilityMarkdownCodeFence({
        key,
        language: parsed.language,
        code: parsed.code,
      });

      if (codeNode !== null) {
        blocks.push(codeNode);
        key++;
      }

      i = parsed.nextIndex;
      continue;
    }

    const headingResult = tryRenderMarketingAccessibilityMarkdownHeading({
      key,
      line,
      isHelp,
      isPrivacy,
      isCaiqSigResponse,
      isProcurementHelp,
      skippedDuplicateHelpTitle,
      h2Class,
      h3Class,
      renderOptions,
      allocateSectionSlug,
    });

    if (headingResult !== null) {
      if (headingResult.stateUpdate.currentPartLabel !== undefined) {
        currentPartLabel = headingResult.stateUpdate.currentPartLabel;
      }

      if (headingResult.stateUpdate.currentSectionTitle !== undefined) {
        currentSectionTitle = headingResult.stateUpdate.currentSectionTitle;
      }

      if (headingResult.stateUpdate.currentSubsectionTitle !== undefined) {
        currentSubsectionTitle = headingResult.stateUpdate.currentSubsectionTitle;
      }

      if (headingResult.stateUpdate.currentProcurementQuestionNumber !== undefined) {
        currentProcurementQuestionNumber = headingResult.stateUpdate.currentProcurementQuestionNumber;
      }

      if (headingResult.stateUpdate.skippedDuplicateHelpTitle !== undefined) {
        skippedDuplicateHelpTitle = headingResult.stateUpdate.skippedDuplicateHelpTitle;
      }

      if (headingResult.node !== null) {
        blocks.push(headingResult.node);
        key++;
      }

      i++;
      continue;
    }

    const listOrQuoteResult = tryRenderMarketingAccessibilityMarkdownListOrQuote({
      key,
      lines,
      startIndex: i,
      isHelp,
      isPrivacy,
      bodyTextClass,
      renderOptions,
    });

    if (listOrQuoteResult !== null) {
      if (listOrQuoteResult.node !== null) {
        blocks.push(listOrQuoteResult.node);
        key++;
      }

      i = listOrQuoteResult.nextIndex;
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
