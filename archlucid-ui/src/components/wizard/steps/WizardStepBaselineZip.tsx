"use client";

import { WizardStepPanel } from "@/components/wizard/WizardStepPanel";
import { AzureExtractorPackageZipField } from "@/components/wizard/steps/AzureExtractorPackageZipField";

/** Baseline-first path (`?baseline=1`): ZIP upload before identity. */
export function WizardStepBaselineZip() {
  return (
    <WizardStepPanel
      title="Upload Azure extractor package"
      description="Provide the ZIP from your read-only inventory run so we can prefill the architecture brief."
    >
      <AzureExtractorPackageZipField variant="baseline" />
    </WizardStepPanel>
  );
}
