"use client";

import Link from "next/link";

import { cn } from "@/lib/utils";

import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { finalizeReadinessLayerLabel } from "@/lib/review-quality/finalize-readiness-layer-labels";
import { resolveFinalizeReadinessBlockAction } from "@/lib/review-quality/finalize-readiness-block-action";
import { renderDoThisNextReferenceCopy } from "@/lib/usability/do-this-next-reference-copy";
import type { FinalizeReadinessBlock } from "@/types/finalize-readiness";

export type FinalizeReadinessBlockListProps = {
  readonly runId?: string;
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
            {layerBlocks.map((block) => {
              const action =
                props.runId === undefined
                  ? null
                  : resolveFinalizeReadinessBlockAction(props.runId, block);

              return (
                <li
                  key={`${block.layer}:${block.code}:${block.message}`}
                  data-testid={`finalize-readiness-block-${block.code}`}
                  className={cn("text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}
                >
                  {renderDoThisNextReferenceCopy(block.message)}
                  {block.blockExplanation !== undefined &&
                  block.blockExplanation !== null &&
                  block.blockExplanation.trim().length > 0 ? (
                    <p
                      className={cn("m-0 mt-1 leading-relaxed text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}
                      data-testid={`finalize-readiness-block-explanation-${block.code}`}
                    >
                      {block.blockExplanation}
                    </p>
                  ) : null}
                  {action !== null ? (
                    <span className="mt-1 block">
                      <Link
                        href={action.href}
                        className="font-medium text-al-text-primary underline-offset-2 hover:underline"
                        data-testid={`finalize-readiness-block-action-${block.code}`}
                      >
                        {action.label}
                      </Link>
                    </span>
                  ) : null}
                </li>
              );
            })}
          </ul>
        </li>
      ))}
    </ul>
  );
}
