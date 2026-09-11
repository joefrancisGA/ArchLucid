import { cn } from "@/lib/utils";

import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { finalizeReadinessLayerLabel } from "@/lib/review-quality/finalize-readiness-layer-labels";
import { renderDoThisNextReferenceCopy } from "@/lib/usability/do-this-next-reference-copy";
import type { FinalizeReadinessBlock } from "@/types/finalize-readiness";

export type FinalizeReadinessBlockListProps = {
  readonly blocks: readonly FinalizeReadinessBlock[];
  readonly className?: string;
  readonly testId?: string;
};

/** Renders server-authoritative finalize gate blocks grouped by layer. */
export function FinalizeReadinessBlockList(props: FinalizeReadinessBlockListProps): React.JSX.Element | null {
  if (props.blocks.length === 0) {
    return null;
  }

  const grouped = new Map<string, FinalizeReadinessBlock[]>();

  for (const block of props.blocks) {
    const existing = grouped.get(block.layer);

    if (existing === undefined) {
      grouped.set(block.layer, [block]);
      continue;
    }

    existing.push(block);
  }

  return (
    <ul
      className={cn("m-0 list-none space-y-3 p-0", props.className)}
      data-testid={props.testId ?? "finalize-readiness-block-list"}
    >
      {[...grouped.entries()].map(([layer, layerBlocks]) => (
        <li key={layer} data-testid={`finalize-readiness-layer-${layer}`}>
          <p className={cn("m-0 font-semibold text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}>
            {finalizeReadinessLayerLabel(layer)}
          </p>
          <ul className="m-0 mt-1 list-disc space-y-1 pl-5">
            {layerBlocks.map((block) => (
              <li
                key={`${block.layer}:${block.code}:${block.message}`}
                data-testid={`finalize-readiness-block-${block.code}`}
                className={cn("text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}
              >
                {renderDoThisNextReferenceCopy(block.message)}
              </li>
            ))}
          </ul>
        </li>
      ))}
    </ul>
  );
}
