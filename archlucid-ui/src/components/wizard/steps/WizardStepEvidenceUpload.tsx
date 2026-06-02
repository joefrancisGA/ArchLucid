"use client";

import Link from "next/link";

import { AzureExtractorZipDropZone } from "@/components/AzureExtractorZipDropZone";
import { Button } from "@/components/ui/button";
import { WizardStepPanel } from "@/components/wizard/WizardStepPanel";
import { ARCH_LUCID_AZURE_EXTRACTOR_MAX_ZIP_BYTES } from "@/lib/azure-extractor-upload-limits";

export type WizardStepEvidenceUploadProps = {
  pendingFile: File | null;
  onPendingFileChange: (file: File | null) => void;
  onSkipDemoData: () => void;
};

/** Optional evidence step between preset and identity in the full wizard (TB-215). */
export function WizardStepEvidenceUpload(props: WizardStepEvidenceUploadProps) {
  const { pendingFile, onPendingFileChange, onSkipDemoData } = props;
  const maxMb = Math.floor(ARCH_LUCID_AZURE_EXTRACTOR_MAX_ZIP_BYTES / (1024 * 1024));

  return (
    <WizardStepPanel
      title="Upload Azure evidence (optional)"
      description="Attach your read-only Azure extractor ZIP now so the review starts with real subscription inventory."
    >
      <div className="space-y-4" data-testid="wizard-evidence-upload-step">
        <AzureExtractorZipDropZone
          ariaLabel="Azure extractor evidence ZIP"
          testId="wizard-evidence-upload-dropzone"
          hint={
            <p className="m-0 text-xs text-neutral-600 dark:text-neutral-400">
              Run the Azure extractor in your subscription to generate this file. See{" "}
              <Link className="font-medium text-teal-800 underline dark:text-teal-300" href="/settings/extract-upload">
                Extract &amp; upload settings
              </Link>{" "}
              for the PowerShell command. Maximum size {maxMb} MB.
            </p>
          }
          onZipSelected={(file) => {
            if (!file.name.toLowerCase().endsWith(".zip")) {
              return;
            }

            onPendingFileChange(file);
          }}
        />

        {pendingFile !== null ? (
          <p className="m-0 text-sm text-neutral-700 dark:text-neutral-300" data-testid="wizard-evidence-upload-selected">
            Selected: <span className="font-medium">{pendingFile.name}</span> — uploads automatically after the review is
            created.
          </p>
        ) : null}

        <p className="m-0 text-xs text-neutral-600 dark:text-neutral-400">
          No evidence file? Use demo data instead — outputs will be labeled Simulator.
        </p>

        <Button
          type="button"
          variant="outline"
          data-testid="wizard-evidence-upload-skip-demo"
          onClick={onSkipDemoData}
        >
          Skip and use demo data
        </Button>
      </div>
    </WizardStepPanel>
  );
}
