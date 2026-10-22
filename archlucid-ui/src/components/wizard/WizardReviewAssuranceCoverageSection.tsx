"use client";

import { useWatch } from "react-hook-form";

import type { WizardFormValues } from "@/lib/wizard-schema";

import { ReviewAssuranceCoverageSection } from "@/components/wizard/ReviewAssuranceCoverageSection";

export type WizardReviewAssuranceCoverageSectionProps = {
  readonly focusedPilotModeEnabled: boolean;
  readonly onFocusedPilotModeEnabledChange: (enabled: boolean) => void;
  readonly togglePresentation?: "checkbox" | "scope-card" | "choice";
  readonly className?: string;
};

/** Review assurance section with coverage preview bound to the new-run wizard form. */
export function WizardReviewAssuranceCoverageSection(
  props: WizardReviewAssuranceCoverageSectionProps,
): React.JSX.Element {
  const cloudProvider = useWatch<WizardFormValues, "cloudProvider">({ name: "cloudProvider" });
  const descriptionText = useWatch<WizardFormValues, "description">({ name: "description" });
  const securityHints = useWatch<WizardFormValues, "securityBaselineHints">({ name: "securityBaselineHints" });

  const securityIntakeAnswer = securityHints?.find((hint) => hint.trim().length > 0);

  return (
    <ReviewAssuranceCoverageSection
      focusedPilotModeEnabled={props.focusedPilotModeEnabled}
      onFocusedPilotModeEnabledChange={props.onFocusedPilotModeEnabledChange}
      togglePresentation={props.togglePresentation}
      className={props.className}
      cloudProvider={cloudProvider}
      descriptionText={descriptionText}
      securityIntakeAnswer={securityIntakeAnswer}
    />
  );
}
