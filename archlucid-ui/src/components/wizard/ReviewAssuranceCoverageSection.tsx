"use client";
import { cn } from "@/lib/utils";
import { OPERATOR_LAYOUT } from "@/lib/design-tokens";

import { AssuranceCoveragePreviewPanel } from "@/components/wizard/AssuranceCoveragePreviewPanel";
import { PilotModePolicyPackToggle } from "@/components/wizard/PilotModePolicyPackToggle";

export type ReviewAssuranceCoverageSectionProps = {
  readonly focusedPilotModeEnabled: boolean;
  readonly onFocusedPilotModeEnabledChange: (enabled: boolean) => void;
  readonly togglePresentation?: "checkbox" | "scope-card" | "choice";
  readonly className?: string;
  readonly cloudProvider?: string;
  readonly securityIntakeAnswer?: string;
  readonly descriptionText?: string;
  readonly showCoveragePreview?: boolean;
};

/** Explainable assurance coverage selection — review scope choice plus optional live preview. */
export function ReviewAssuranceCoverageSection(props: ReviewAssuranceCoverageSectionProps): React.JSX.Element {
  const showCoveragePreview = props.showCoveragePreview ?? true;

  return (
    <div className={cn(OPERATOR_LAYOUT.sectionStack, props.className)} data-testid="review-assurance-coverage-section">
      <PilotModePolicyPackToggle
        presentation={props.togglePresentation ?? "choice"}
        enabled={props.focusedPilotModeEnabled}
        onEnabledChange={props.onFocusedPilotModeEnabledChange}
      />
      {showCoveragePreview ? (
        <AssuranceCoveragePreviewPanel
          focusedPilotModeEnabled={props.focusedPilotModeEnabled}
          cloudProvider={props.cloudProvider}
          securityIntakeAnswer={props.securityIntakeAnswer}
          descriptionText={props.descriptionText}
        />
      ) : null}
    </div>
  );
}
