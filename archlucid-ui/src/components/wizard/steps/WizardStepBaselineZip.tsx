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
      title="Upload Azure extractor package"
      description="Run the read-only packager locally, drop the ZIP here, and we prefill your review brief before you name the system."
    >
      <AzureExtractorPackageZipField variant="baseline" onPendingZipFileChange={onPendingZipFileChange} />
    </WizardStepPanel>
  );
}
