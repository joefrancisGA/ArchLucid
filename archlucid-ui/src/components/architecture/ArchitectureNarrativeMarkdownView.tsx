"use client";

import { useEffect, useMemo } from "react";

import { MarketingAccessibilityMarkdownFragment } from "@/components/marketing/MarketingAccessibilityMarkdownFragment";
import { ArchitectureNarrativePlainFallback } from "@/components/architecture/ArchitectureNarrativePlainFallback";
import {
  peekArchitectureNarrativeRenderDiagnostic,
  prepareArchitectureNarrativeForPresentation,
  recordArchitectureNarrativeRenderDiagnostic,
} from "@/lib/architecture/architecture-narrative-presentation";
import { OPERATOR_PAGE_CONTAINER, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

export type ArchitectureNarrativeMarkdownViewProps = {
  readonly markdown: string;
  readonly tableCaption?: string;
  readonly emptyStateMessage?: string;
  readonly className?: string;
};

/** Bounded, sanitized markdown rendering for architecture review narratives. */
export function ArchitectureNarrativeMarkdownView(
  props: ArchitectureNarrativeMarkdownViewProps,
): React.JSX.Element | null {
  const prepared = useMemo(
    () => prepareArchitectureNarrativeForPresentation(props.markdown),
    [props.markdown],
  );

  useEffect(() => {
    if (prepared.markdown.trim().length === 0) {
      recordArchitectureNarrativeRenderDiagnostic({
        reason: "empty",
        normalizationApplied: prepared.normalizationApplied,
        sourceLength: props.markdown.length,
      });

      return;
    }

    if (prepared.usePlainFallback) {
      recordArchitectureNarrativeRenderDiagnostic({
        reason: "plain-fallback",
        normalizationApplied: prepared.normalizationApplied,
        sourceLength: props.markdown.length,
      });

      return;
    }

    recordArchitectureNarrativeRenderDiagnostic({
      reason: "markdown",
      normalizationApplied: prepared.normalizationApplied,
      sourceLength: props.markdown.length,
    });
  }, [prepared.markdown, prepared.normalizationApplied, prepared.usePlainFallback, props.markdown.length]);

  if (prepared.markdown.trim().length === 0) {
    if (props.emptyStateMessage === undefined) {
      return null;
    }

    return (
      <p className={cn("m-0 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
        {props.emptyStateMessage}
      </p>
    );
  }

  if (prepared.usePlainFallback) {
    return <ArchitectureNarrativePlainFallback text={prepared.markdown} />;
  }

  return (
    <div
      className={cn(
        OPERATOR_PAGE_CONTAINER.variant.reading,
        "min-w-0 [&_a]:break-words [&_code]:break-words [&_pre]:max-w-full [&_pre]:overflow-x-auto [&_table]:min-w-0",
        props.className,
      )}
      data-testid="architecture-narrative-markdown-view"
    >
      <MarketingAccessibilityMarkdownFragment
        markdownBody={prepared.markdown}
        tableCaption={props.tableCaption ?? "Architecture narrative table"}
        presentation="help"
      />
    </div>
  );
}

export function readArchitectureNarrativeRenderDiagnostic() {
  return peekArchitectureNarrativeRenderDiagnostic();
}
