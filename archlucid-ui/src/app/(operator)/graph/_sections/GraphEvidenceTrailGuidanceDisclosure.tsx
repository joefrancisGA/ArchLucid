"use client";

import { ARCHITECTURE_REVIEW_VOCABULARY } from "@/lib/architecture-review-vocabulary";
import { BUYER_EVIDENCE_TRAIL_LAYER_DISCLOSURE } from "@/lib/buyer-polish-copy";
import { mergeLayerGuidanceForBuyerDemoShell } from "@/lib/layer-guidance";
import { useNavSurface } from "@/lib/use-nav-surface";
import { cn } from "@/lib/utils";

export type GraphEvidenceTrailGuidanceDisclosureProps = {
  className?: string;
};

/** Collapses pilot-layer guidance so the evidence graph page leads with action, not doctrine. */
export function GraphEvidenceTrailGuidanceDisclosure(props: GraphEvidenceTrailGuidanceDisclosureProps) {
  const surface = useNavSurface("graph");
  const block = mergeLayerGuidanceForBuyerDemoShell("graph", surface.layerGuidance, true);

  return (
    <details
      className={cn(
        "mb-4 max-w-3xl rounded-md border border-neutral-200 bg-neutral-50/80 dark:border-neutral-700 dark:bg-neutral-900/40",
        props.className,
      )}
      data-testid="evidence-trail-guidance-disclosure"
    >
      <summary className="cursor-pointer select-none px-3 py-2 text-sm font-medium text-neutral-800 dark:text-neutral-200">
        {BUYER_EVIDENCE_TRAIL_LAYER_DISCLOSURE}
      </summary>
      <div className="space-y-1.5 border-t border-neutral-200 px-3 py-2 text-xs leading-snug text-neutral-600 dark:border-neutral-700 dark:text-neutral-400">
        <p className="m-0 font-semibold uppercase tracking-wide text-neutral-700 dark:text-neutral-300">
          {block.layerBadge}
        </p>
        <p className="m-0 text-sm font-medium text-neutral-900 dark:text-neutral-100">{block.headline}</p>
        <p className="m-0">{block.useWhen}</p>
        <p className="m-0 text-neutral-500 dark:text-neutral-500">
          <span className="font-medium text-neutral-800 dark:text-neutral-200">Review package · Evidence · Trace:</span>{" "}
          {ARCHITECTURE_REVIEW_VOCABULARY.buyerReviewPackageScopeHelp}
        </p>
      </div>
    </details>
  );
}
