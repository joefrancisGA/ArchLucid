"use client";

import { cn } from "@/lib/utils";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { FieldHelpTooltip } from "@/components/FieldHelpTooltip";
import {
  EVIDENCE_FAITHFULNESS_HEURISTIC_DISCLAIMER,
  evidenceFaithfulnessBadgePresentation,
} from "@/lib/agent-evidence-faithfulness-presenter";

/** Tiered pill for `AgentOutputSemanticScore.agentResultFaithfulnessSupportRatio` (agent-evaluation rows). */
export function AgentEvidenceFaithfulnessBadge(props: { ratio: unknown }) {
  const pres = evidenceFaithfulnessBadgePresentation(props.ratio);

  if (pres.tier === "absent")
    return <span className="text-neutral-400 dark:text-neutral-500">—</span>;

  const hint = `${EVIDENCE_FAITHFULNESS_HEURISTIC_DISCLAIMER} Shown: ${pres.formattedRatio}.`;

  return (
    <span
      className={cn(
        "inline-flex max-w-full items-center gap-1 rounded-full px-2 py-0.5 font-medium",
        pres.badgeClassName,
        OPERATOR_TYPOGRAPHY.helper,
      )}
    >
      <span className="whitespace-nowrap">{pres.tierLabel}</span>
      <span className={cn("font-mono opacity-90", OPERATOR_TYPOGRAPHY.helper)}>({pres.formattedRatio})</span>
      <FieldHelpTooltip label="Evidence grounding" hint={hint} />
    </span>
  );
}
