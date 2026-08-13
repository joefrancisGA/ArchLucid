"use client";

import { InAppHelpLink } from "@/components/InAppHelpLink";
import { cn } from "@/lib/utils";
import {
  BUYER_EVIDENCE_TRAIL_LAYER_DISCLOSURE,
  BUYER_EVIDENCE_TRAIL_LAYER_DISCLOSURE_LEAD,
  BUYER_GRAPH_WHAT_THIS_PROVES,
} from "@/lib/buyer/buyer-polish-copy";
import { mergeLayerGuidanceForGraphDisclosure } from "@/lib/layer-guidance";
import { OPERATOR_DISCLOSURE_TRIGGER_CLASS, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { pageHelpTopicForPathname } from "@/lib/usability/page-help-topic-map";
import { useNavSurface } from "@/lib/use-nav-surface";

export type GraphEvidenceTrailGuidanceDisclosureProps = {
  className?: string;
};

const GRAPH_PAGE_HELP_TOPIC = pageHelpTopicForPathname("/insights/evidence-graph");

/** Collapses long graph explanation so the page leads with selection and load actions. */
export function GraphEvidenceTrailGuidanceDisclosure(props: GraphEvidenceTrailGuidanceDisclosureProps) {
  const surface = useNavSurface("graph");
  const block = mergeLayerGuidanceForGraphDisclosure(surface.layerGuidance);

  return (
    <details
      className={cn(
        "mb-4 max-w-3xl rounded-md border border-neutral-200 bg-neutral-50/80 dark:border-neutral-700 dark:bg-neutral-900/40",
        props.className,
      )}
      data-testid="evidence-trail-guidance-disclosure"
    >
      <summary className={cn("cursor-pointer select-none px-3 py-2", OPERATOR_DISCLOSURE_TRIGGER_CLASS)}>
        {BUYER_EVIDENCE_TRAIL_LAYER_DISCLOSURE}
      </summary>
      <div className={cn("space-y-2 border-t border-neutral-200 px-3 py-2 dark:border-neutral-700", OPERATOR_TYPOGRAPHY.body)}>
        <p className="m-0">{BUYER_EVIDENCE_TRAIL_LAYER_DISCLOSURE_LEAD}</p>
        <p className="m-0">{block.useWhen}</p>
        <p className={cn("m-0", OPERATOR_TYPOGRAPHY.helper)}>{BUYER_GRAPH_WHAT_THIS_PROVES}</p>
        {GRAPH_PAGE_HELP_TOPIC?.slug != null ? (
          <p className={cn("m-0", OPERATOR_TYPOGRAPHY.helper)}>
            <InAppHelpLink
              helpSlug={GRAPH_PAGE_HELP_TOPIC.slug}
              label={`${GRAPH_PAGE_HELP_TOPIC.label} guide`}
              variant="text"
            />
          </p>
        ) : null}
      </div>
    </details>
  );
}
