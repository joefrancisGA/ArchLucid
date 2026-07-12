"use client";

import { cn } from "@/lib/utils";
import { useState } from "react";

import { MarketingAccessibilityMarkdownFragment } from "@/components/marketing/MarketingAccessibilityMarkdownFragment";
import {
  ARCHITECTURE_STRUCTURED_SHOW_LESS_LABEL,
  ARCHITECTURE_STRUCTURED_SHOW_MORE_LABEL,
} from "@/lib/architecture-structured-content-copy";
import {
  ARCHITECTURE_NARRATIVE_PREVIEW_WORD_LIMIT,
  truncateToWordLimit,
} from "@/lib/architecture-structured-narrative";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

export type ArchitectureStructuredNarrativeProps = {
  readonly markdown: string;
  readonly wordLimit?: number;
};

/** Collapsed narrative preview with safe markdown rendering for architecture sections. */
export function ArchitectureStructuredNarrative(props: ArchitectureStructuredNarrativeProps): React.JSX.Element | null {
  const [expanded, setExpanded] = useState(false);
  const wordLimit = props.wordLimit ?? ARCHITECTURE_NARRATIVE_PREVIEW_WORD_LIMIT;
  const { preview, truncated } = truncateToWordLimit(props.markdown, wordLimit);
  const displayMarkdown = expanded || !truncated ? props.markdown : preview;

  if (displayMarkdown.trim().length === 0) {
    return null;
  }

  return (
    <div className="space-y-2" data-testid="architecture-structured-narrative">
      <div className={cn("text-neutral-800 dark:text-neutral-200", OPERATOR_TYPOGRAPHY.body)}>
        <MarketingAccessibilityMarkdownFragment
          markdownBody={displayMarkdown}
          tableCaption="Architecture section table"
          presentation="help"
        />
      </div>
      {truncated ? (
        <button
          type="button"
          className={cn(
            "rounded-sm font-medium text-teal-800 underline underline-offset-2 dark:text-teal-300",
            OPERATOR_TYPOGRAPHY.helper,
          )}
          onClick={() => {
            setExpanded((current) => !current);
          }}
          data-testid="architecture-structured-narrative-toggle"
        >
          {expanded ? ARCHITECTURE_STRUCTURED_SHOW_LESS_LABEL : ARCHITECTURE_STRUCTURED_SHOW_MORE_LABEL}
        </button>
      ) : null}
    </div>
  );
}
