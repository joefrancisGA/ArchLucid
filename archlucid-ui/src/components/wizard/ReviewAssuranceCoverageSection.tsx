"use client";
import { cn } from "@/lib/utils";
import { OPERATOR_LAYOUT } from "@/lib/design-tokens";

import { FocusedPilotScopeDisclosureBanner } from "@/components/wizard/FocusedPilotScopeDisclosureBanner";
import { PilotModePolicyPackToggle } from "@/components/wizard/PilotModePolicyPackToggle";

export type ReviewAssuranceCoverageSectionProps = {
  readonly focusedPilotModeEnabled: boolean;
  readonly onFocusedPilotModeEnabledChange: (enabled: boolean) => void;
  readonly togglePresentation?: "checkbox" | "scope-card" | "choice";
  readonly className?: string;
};

/**
 * Explainable assurance coverage selection — review scope choice and focused-scope disclosure.
 */
export function ReviewAssuranceCoverageSection(props: ReviewAssuranceCoverageSectionProps): React.JSX.Element {
  return (
    <div className={cn(OPERATOR_LAYOUT.sectionStack, props.className)} data-testid="review-assurance-coverage-section">
      <PilotModePolicyPackToggle
        presentation={props.togglePresentation ?? "choice"}
        enabled={props.focusedPilotModeEnabled}
        onEnabledChange={props.onFocusedPilotModeEnabledChange}
      />
      <FocusedPilotScopeDisclosureBanner focusedModeEnabled={props.focusedPilotModeEnabled} />
    </div>
  );
}
