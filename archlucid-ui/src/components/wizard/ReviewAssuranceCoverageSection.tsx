"use client";

import { useCallback, useEffect, useState } from "react";

import { AssuranceCoveragePreviewPanel } from "@/components/wizard/AssuranceCoveragePreviewPanel";
import { PilotModePolicyPackToggle } from "@/components/wizard/PilotModePolicyPackToggle";
import {
  setSessionCoveragePackOverrides,
  upsertCoveragePackOverride,
  validateCoveragePackOverrides,
  type CoveragePackOverride,
} from "@/lib/coverage-pack-overrides";
import { OPERATOR_LAYOUT } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

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
  const [packOverrides, setPackOverrides] = useState<CoveragePackOverride[]>([]);
  const overrideValidationMessage = validateCoveragePackOverrides(packOverrides);

  useEffect(() => {
    setSessionCoveragePackOverrides(packOverrides);
  }, [packOverrides]);

  const handlePackOverrideChange = useCallback((override: CoveragePackOverride) => {
    setPackOverrides((current) => upsertCoveragePackOverride(current, override));
  }, []);

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
          packOverrides={packOverrides}
          onPackOverrideChange={handlePackOverrideChange}
          overrideValidationMessage={overrideValidationMessage}
        />
      ) : null}
    </div>
  );
}
