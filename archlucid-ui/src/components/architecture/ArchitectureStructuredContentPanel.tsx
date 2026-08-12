"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";
import { useMemo, useState } from "react";

import { ArchitectureStructuredSectionView } from "@/components/architecture/ArchitectureStructuredSectionView";
import { ArchitectureStructuringFailureNotice } from "@/components/architecture/ArchitectureStructuringFailureNotice";
import { parseArchitectureGeneratedContent } from "@/lib/architecture/architecture-generated-content-parser";
import {
  ARCHITECTURE_STRUCTURED_VIEW_SOURCE_LABEL,
} from "@/lib/architecture/architecture-structured-content-copy";
import type { ArchitectureCreationUserAssertions } from "@/lib/architecture/architecture-structured-content-types";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

export type ArchitectureStructuredContentPanelProps = {
  readonly sourceText: string;
  readonly userAssertions: ArchitectureCreationUserAssertions | null;
  readonly correctionHref: string | null;
  readonly runId: string | null;
};

/** Structured presentation for generated architecture text — never shows raw model scaffolding by default. */
export function ArchitectureStructuredContentPanel(
  props: ArchitectureStructuredContentPanelProps,
): React.JSX.Element {
  const [parseAttempt, setParseAttempt] = useState(0);
  const parseResult = useMemo(
    () => {
      void parseAttempt;
      return parseArchitectureGeneratedContent(props.sourceText, props.userAssertions);
    },
  // parseAttempt forces a client-side re-parse when the operator retries structuring.
    [props.sourceText, props.userAssertions, parseAttempt],
  );

  const defaultOpenKeys = new Set(parseResult.sections.slice(0, 2).map((section) => section.key));

  return (
    <div className="space-y-4" data-testid="architecture-structured-content-panel">
      {parseResult.hasPartialParseFailure ? (
        <ArchitectureStructuringFailureNotice
          runId={props.runId}
          onRetry={() => {
            setParseAttempt((current) => current + 1);
          }}
        />
      ) : null}

      {parseResult.sections.length > 0 ? (
        <div className="space-y-3">
          {parseResult.sections.map((section) => (
            <ArchitectureStructuredSectionView
              key={section.key}
              section={section}
              defaultOpen={defaultOpenKeys.has(section.key)}
              correctionHref={props.correctionHref}
            />
          ))}
        </div>
      ) : (
        <p className={cn("m-0 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
          No structured architecture sections were extracted yet. Add more detail in clarifying questions or edit your brief.
        </p>
      )}

      {parseResult.sourceText.length > 0 ? (
        <details
          className="rounded-md border border-dashed border-neutral-200 p-3 dark:border-neutral-700"
          data-testid="architecture-structured-source"
        >
          <summary className={cn("cursor-pointer font-medium text-neutral-700 dark:text-neutral-200", OPERATOR_TYPOGRAPHY.helper)}>
            {ARCHITECTURE_STRUCTURED_VIEW_SOURCE_LABEL}
          </summary>
          <pre
            className={cn(
              "mt-3 max-h-80 overflow-auto whitespace-pre-wrap rounded-md bg-neutral-50 p-3 text-neutral-800 dark:bg-neutral-900 dark:text-neutral-200",
              OPERATOR_TYPOGRAPHY.helper,
            )}
          >
            {parseResult.sourceText}
          </pre>
        </details>
      ) : null}
    </div>
  );
}
