import { cn } from "@/lib/utils";
import type { ReactElement } from "react";

import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

export type FindingEvidenceRefSnippetsProps = {
  readonly snippets: readonly string[];
  readonly className?: string;
};

/** Inline evidence ref excerpts for retained findings (TB-385). */
export function FindingEvidenceRefSnippets(props: FindingEvidenceRefSnippetsProps): ReactElement | null {
  if (props.snippets.length === 0) {
    return null;
  }

  return (
    <div
      className={cn("mt-2 space-y-1", props.className)}
      data-testid="finding-evidence-ref-snippets"
      aria-label="Source evidence excerpts"
    >
      <p className={cn("m-0 font-medium text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>Source evidence</p>
      <ul className="m-0 list-none space-y-1 p-0">
        {props.snippets.map((snippet, index) => (
          <li
            key={`${index}-${snippet.slice(0, 24)}`}
            className={cn("rounded border border-neutral-200 bg-white/80 px-2 py-1.5 leading-relaxed text-neutral-800 dark:border-neutral-700 dark:bg-neutral-900/50 dark:text-neutral-200", OPERATOR_TYPOGRAPHY.body)}
          >
            {snippet}
          </li>
        ))}
      </ul>
    </div>
  );
}
