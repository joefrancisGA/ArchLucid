"use client";

import { cn } from "@/lib/utils";
import { useMemo, useState } from "react";

import { ArchitectureNarrativeMarkdownView } from "@/components/architecture/ArchitectureNarrativeMarkdownView";
import {
  ARCHITECTURE_STRUCTURED_SHOW_LESS_LABEL,
  ARCHITECTURE_STRUCTURED_SHOW_MORE_LABEL,
} from "@/lib/architecture/architecture-structured-content-copy";
import {
  ARCHITECTURE_NARRATIVE_PREVIEW_WORD_LIMIT,
  shouldUseSectionLevelNarrativeDisclosure,
  truncateMarkdownPreservingStructure,
} from "@/lib/architecture/architecture-structured-narrative";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

export type ArchitectureStructuredNarrativeProps = {
  readonly markdown: string;
  readonly wordLimit?: number;
};

/** Collapsed narrative preview with safe markdown rendering for architecture sections. */
export function ArchitectureStructuredNarrative(props: ArchitectureStructuredNarrativeProps): React.JSX.Element | null {
  const [expanded, setExpanded] = useState(false);
  const wordLimit = props.wordLimit ?? ARCHITECTURE_NARRATIVE_PREVIEW_WORD_LIMIT;
  const { preview, truncated } = useMemo(
    () => truncateMarkdownPreservingStructure(props.markdown, wordLimit),
    [props.markdown, wordLimit],
  );
  const displayMarkdown = expanded || !truncated ? props.markdown : preview;
  const useSectionDisclosure = shouldUseSectionLevelNarrativeDisclosure(props.markdown, wordLimit);

  if (props.markdown.trim().length === 0) {
    return null;
  }

  return (
    <div className="space-y-2" data-testid="architecture-structured-narrative">
      <div className={cn("text-neutral-800 dark:text-neutral-200", OPERATOR_TYPOGRAPHY.body)}>
        <ArchitectureNarrativeMarkdownView
          markdown={displayMarkdown}
          tableCaption="Architecture section table"
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
          aria-expanded={expanded}
        >
          {expanded
            ? ARCHITECTURE_STRUCTURED_SHOW_LESS_LABEL
            : useSectionDisclosure
              ? "Show remaining sections"
              : ARCHITECTURE_STRUCTURED_SHOW_MORE_LABEL}
        </button>
      ) : null}
    </div>
  );
}
