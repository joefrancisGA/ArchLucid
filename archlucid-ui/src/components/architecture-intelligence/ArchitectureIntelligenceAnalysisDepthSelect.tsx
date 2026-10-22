"use client";

import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ARCHITECTURE_INTELLIGENCE_REVIEW_TIERS,
  architectureIntelligenceReviewTierLabel,
  isArchitectureIntelligenceReviewTier,
  type ArchitectureIntelligenceReviewTier,
} from "@/lib/architecture/architecture-intelligence-review-tier";

export type ArchitectureIntelligenceAnalysisDepthSelectProps = {
  readonly id: string;
  readonly testId: string;
  readonly value: ArchitectureIntelligenceReviewTier;
  readonly disabled?: boolean;
  readonly onValueChange: (tier: ArchitectureIntelligenceReviewTier) => void;
};

/**
 * First-class analysis-depth control. Shows operator labels, never the raw tier token.
 */
export function ArchitectureIntelligenceAnalysisDepthSelect(
  props: ArchitectureIntelligenceAnalysisDepthSelectProps,
): React.JSX.Element {
  return (
    <div className="space-y-2">
      <Label htmlFor={props.id}>Analysis depth</Label>
      <Select
        value={props.value}
        disabled={props.disabled === true}
        onValueChange={(next) => {
          if (isArchitectureIntelligenceReviewTier(next)) {
            props.onValueChange(next);
          }
        }}
      >
        <SelectTrigger id={props.id} data-testid={props.testId} className="max-w-md">
          <SelectValue>{architectureIntelligenceReviewTierLabel(props.value)}</SelectValue>
        </SelectTrigger>
        <SelectContent>
          {ARCHITECTURE_INTELLIGENCE_REVIEW_TIERS.map((tier) => (
            <SelectItem key={tier} value={tier}>
              {architectureIntelligenceReviewTierLabel(tier)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
