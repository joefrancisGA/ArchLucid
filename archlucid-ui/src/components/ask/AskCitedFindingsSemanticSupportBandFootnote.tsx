"use client";

import type { ReactElement } from "react";

import { StatusTag } from "@/components/ui/status-tag";
import {
  formatAskCitedFindingsSemanticSupportBandFootnote,
  resolveWeakestAskCitedSemanticSupportBandForFindingIds,
  type AskCitedFindingBandIndexEntry,
} from "@/lib/ask/ask-cited-findings-semantic-support-band";
import { semanticSupportBandStatusTagKind } from "@/lib/findings/semantic-support-band-presentation";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

export type AskCitedFindingsSemanticSupportBandFootnoteProps = {
  readonly referencedFindingIds: readonly string[];
  readonly findingBandIndex: readonly AskCitedFindingBandIndexEntry[];
};

/** AS-069: weakest cited-finding semantic support band footnote above Ask answers. */
export function AskCitedFindingsSemanticSupportBandFootnote(
  props: AskCitedFindingsSemanticSupportBandFootnoteProps,
): ReactElement | null {
  const weakestBand = resolveWeakestAskCitedSemanticSupportBandForFindingIds({
    index: props.findingBandIndex,
    referencedFindingIds: props.referencedFindingIds,
  });
  const footnote = formatAskCitedFindingsSemanticSupportBandFootnote(weakestBand);

  if (footnote === null) {
    return null;
  }

  return (
    <div
      className="space-y-2 rounded-lg border border-neutral-200/90 bg-white/80 p-3 dark:border-neutral-700 dark:bg-neutral-900/40"
      data-testid="ask-cited-findings-semantic-support-band-footnote"
      role="note"
    >
      <div className="flex flex-wrap items-center gap-2">
        <p className={cn("m-0 font-semibold text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
          Semantic support inherited from cited findings
        </p>
        {weakestBand !== null ? (
          <StatusTag kind={semanticSupportBandStatusTagKind(weakestBand)} label={weakestBand} />
        ) : null}
      </div>
      <p className={cn("m-0 text-neutral-700 dark:text-neutral-300", OPERATOR_TYPOGRAPHY.body)}>{footnote}</p>
    </div>
  );
}
