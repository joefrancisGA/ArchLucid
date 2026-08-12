"use client";

import { useMemo } from "react";

import { Button } from "@/components/ui/button";
import { parseArchitectureGeneratedContent } from "@/lib/architecture/architecture-generated-content-parser";
import type {
  ArchitectureCreationUserAssertions,
  ArchitectureStructuredSection,
} from "@/lib/architecture/architecture-structured-content-types";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import type { ReviewDetailTabId } from "@/lib/review-detail-workspace-tabs";
import { stripInlineMarkdownFromReviewText } from "@/lib/review-display-title";
import { cn } from "@/lib/utils";

const SUMMARY_LINE_LIMIT = 5;
const PREVIEW_LINE_MAX_CHARS = 240;

function clampPreviewLine(line: string): string {
  const stripped = stripInlineMarkdownFromReviewText(line);

  if (stripped.length <= PREVIEW_LINE_MAX_CHARS) {
    return stripped;
  }

  return `${stripped.slice(0, PREVIEW_LINE_MAX_CHARS - 3)}…`;
}

function previewLines(text: string): readonly string[] {
  // Split before stripping: the markdown stripper collapses whitespace, which would erase line breaks.
  const lines = text.split(/\r?\n/).map((line) => line.trim()).filter((line) => line.length > 0);

  if (lines.length > 1) {
    return lines.slice(0, SUMMARY_LINE_LIMIT).map(clampPreviewLine).filter((line) => line.length > 0);
  }

  const stripped = stripInlineMarkdownFromReviewText(lines[0] ?? "");

  if (stripped.length === 0) {
    return [];
  }

  const chunks: string[] = [];
  let remaining = stripped;

  while (remaining.length > 0 && chunks.length < SUMMARY_LINE_LIMIT) {
    if (remaining.length <= PREVIEW_LINE_MAX_CHARS) {
      chunks.push(remaining);
      break;
    }

    chunks.push(`${remaining.slice(0, PREVIEW_LINE_MAX_CHARS - 3)}…`);
    remaining = remaining.slice(PREVIEW_LINE_MAX_CHARS - 3);
  }

  return chunks;
}

function shouldShowArchitectureTitle(title: string, summaryText: string): boolean {
  const normalizedTitle = stripInlineMarkdownFromReviewText(title);
  const normalizedSummary = stripInlineMarkdownFromReviewText(summaryText);

  if (normalizedTitle.length === 0) {
    return false;
  }

  if (normalizedSummary.startsWith(normalizedTitle)) {
    return false;
  }

  return true;
}

function sectionSummary(section: ArchitectureStructuredSection): string {
  const narrative = section.narrativeMarkdown?.trim() ?? "";

  if (narrative.length > 0) {
    return narrative.length > 240 ? `${narrative.slice(0, 237)}…` : narrative;
  }

  if (section.entities.length > 0) {
    return section.entities.map((entity) => entity.label).join(", ");
  }

  return "";
}

function findSection(
  sections: readonly ArchitectureStructuredSection[],
  key: ArchitectureStructuredSection["key"],
): ArchitectureStructuredSection | undefined {
  return sections.find((section) => section.key === key);
}

export type RunDetailArchitectureSummaryCardProps = {
  readonly architectureTitle: string | null;
  readonly architectureText: string | null;
  readonly evidenceCount: number;
  readonly userAssertions: ArchitectureCreationUserAssertions | null;
  readonly hasSubmittedArchitecture: boolean;
  readonly onNavigateTab: (tab: ReviewDetailTabId) => void;
};

/** Concise architecture summary for Overview — full source lives in the Architecture tab. */
export function RunDetailArchitectureSummaryCard(
  props: RunDetailArchitectureSummaryCardProps,
): React.JSX.Element | null {
  const text = props.architectureText?.trim() ?? "";

  const structured = useMemo(
    () => (text.length > 0 ? parseArchitectureGeneratedContent(text, props.userAssertions) : null),
    [props.userAssertions, text],
  );

  const purposeSection = structured !== null ? findSection(structured.sections, "executive-summary") : undefined;
  const outcomeSection = structured !== null ? findSection(structured.sections, "business-outcome") : undefined;
  const scopeSection = structured !== null ? findSection(structured.sections, "scope") : undefined;
  const domainsSection = structured !== null ? findSection(structured.sections, "systems-and-services") : undefined;

  const summaryLines =
    props.hasSubmittedArchitecture && text.length > 0 ? previewLines(text) : [];

  const architectureTitle = props.architectureTitle?.trim() ?? "";
  const showArchitectureTitle =
    architectureTitle.length > 0 && shouldShowArchitectureTitle(architectureTitle, text);

  if (
    !props.hasSubmittedArchitecture &&
    architectureTitle.length === 0 &&
    props.evidenceCount > 0 &&
    structured === null
  ) {
    return null;
  }

  return (
    <section
      className="rounded-lg border border-neutral-200 bg-al-surface-raised p-4 dark:border-neutral-800"
      data-testid="run-detail-architecture-summary-card"
      aria-labelledby="run-detail-architecture-summary-heading"
    >
      <h2
        id="run-detail-architecture-summary-heading"
        className={cn("m-0 mb-3 text-base font-semibold text-neutral-900 dark:text-neutral-100")}
      >
        Architecture summary
      </h2>
      <dl className={cn("m-0 grid gap-2 sm:grid-cols-2", OPERATOR_TYPOGRAPHY.body)}>
        {showArchitectureTitle ? (
          <div>
            <dt className="text-neutral-500 dark:text-neutral-400">Architecture</dt>
            <dd className="m-0 mt-0.5 font-medium text-neutral-900 dark:text-neutral-100">{architectureTitle}</dd>
          </div>
        ) : null}
        <div>
          <dt className="text-neutral-500 dark:text-neutral-400">Evidence items</dt>
          <dd className="m-0 mt-0.5 font-medium tabular-nums text-neutral-900 dark:text-neutral-100">
            {props.evidenceCount}
          </dd>
          {props.evidenceCount > 0 ? (
            <dd className={cn("m-0 mt-0.5 text-neutral-500 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
              Extracted from uploaded files
            </dd>
          ) : null}
        </div>
        {purposeSection !== undefined ? (
          <div className="sm:col-span-2">
            <dt className="text-neutral-500 dark:text-neutral-400">Purpose</dt>
            <dd className="m-0 mt-0.5 text-neutral-800 dark:text-neutral-200">{sectionSummary(purposeSection)}</dd>
          </div>
        ) : null}
        {outcomeSection !== undefined ? (
          <div className="sm:col-span-2">
            <dt className="text-neutral-500 dark:text-neutral-400">Business outcome</dt>
            <dd className="m-0 mt-0.5 text-neutral-800 dark:text-neutral-200">{sectionSummary(outcomeSection)}</dd>
          </div>
        ) : null}
        {scopeSection !== undefined ? (
          <div>
            <dt className="text-neutral-500 dark:text-neutral-400">Scope</dt>
            <dd className="m-0 mt-0.5 text-neutral-800 dark:text-neutral-200">{sectionSummary(scopeSection)}</dd>
          </div>
        ) : null}
        {domainsSection !== undefined ? (
          <div>
            <dt className="text-neutral-500 dark:text-neutral-400">Major systems</dt>
            <dd className="m-0 mt-0.5 text-neutral-800 dark:text-neutral-200">{sectionSummary(domainsSection)}</dd>
          </div>
        ) : null}
      </dl>
      {summaryLines.length > 0 ? (
        <div className={cn("mt-3 space-y-1", OPERATOR_TYPOGRAPHY.body)}>
          {summaryLines.map((line, index) => (
            <p key={`arch-summary-line-${index}`} className="m-0 text-neutral-700 dark:text-neutral-300">
              {line}
            </p>
          ))}
        </div>
      ) : !props.hasSubmittedArchitecture ? (
        <p className={cn("m-0 mt-3 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.body)}>
          No architecture description was submitted with this review.
        </p>
      ) : null}
      {props.hasSubmittedArchitecture ? (
        <div className="mt-4">
          <Button
            type="button"
            variant="outline"
            size="sm"
            data-testid="run-detail-view-submitted-architecture"
            onClick={() => props.onNavigateTab("architecture")}
          >
            View submitted architecture
          </Button>
        </div>
      ) : null}
    </section>
  );
}
