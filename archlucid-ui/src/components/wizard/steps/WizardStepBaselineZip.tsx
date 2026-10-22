"use client";

import { WizardStepPanel } from "@/components/wizard/WizardStepPanel";
import { AzureExtractorPackageZipField } from "@/components/wizard/steps/AzureExtractorPackageZipField";

export type WizardStepBaselineZipProps = {
  onPendingZipFileChange?: (file: File | null) => void;
};

/** Baseline-first path (`?baseline=1`): ZIP upload before identity. */
export function WizardStepBaselineZip(props: WizardStepBaselineZipProps) {
  const { onPendingZipFileChange } = props;

  return (
    <WizardStepPanel
      title="Optional evidence"
      description="Attach cloud inventory or supporting files when you have them. You can start a review from your architecture brief alone."
    >
      <AzureExtractorPackageZipField variant="baseline" onPendingZipFileChange={onPendingZipFileChange} />
    </WizardStepPanel>
  );
}
