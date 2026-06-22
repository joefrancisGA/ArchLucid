"use client";

import {
  BUYER_EVIDENCE_TRAIL_LAYER_DISCLOSURE,
  BUYER_EVIDENCE_TRAIL_LAYER_DISCLOSURE_LEAD,
  BUYER_GRAPH_WHAT_THIS_PROVES,
} from "@/lib/buyer-polish-copy";
import { mergeLayerGuidanceForBuyerDemoShell } from "@/lib/layer-guidance";
import { useNavSurface } from "@/lib/use-nav-surface";
import { cn } from "@/lib/utils";

export type GraphEvidenceTrailGuidanceDisclosureProps = {
  className?: string;
};

/** Collapses long graph explanation so the page leads with selection and load actions. */
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
      <div className="space-y-2 border-t border-neutral-200 px-3 py-2 text-sm leading-relaxed text-neutral-700 dark:border-neutral-700 dark:text-neutral-300">
        <p className="m-0">{BUYER_EVIDENCE_TRAIL_LAYER_DISCLOSURE_LEAD}</p>
        <p className="m-0">{block.useWhen}</p>
        <p className="m-0 text-neutral-600 dark:text-neutral-400">{BUYER_GRAPH_WHAT_THIS_PROVES}</p>
      </div>
    </details>
  );
}
