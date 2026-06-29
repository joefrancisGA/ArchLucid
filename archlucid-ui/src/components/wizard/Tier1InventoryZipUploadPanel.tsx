"use client";
import { cn } from "@/lib/utils";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

import { useState } from "react";

import { AzureExtractorZipDropZone } from "@/components/AzureExtractorZipDropZone";
import { CloudInventoryExtractorCommandPanel } from "@/components/wizard/CloudInventoryExtractorCommandPanel";
import { Tier1InventoryZipValidationCallout } from "@/components/wizard/Tier1InventoryZipValidationCallout";
import { AzureExtractorUploadProgressBar } from "@/components/AzureExtractorUploadProgressBar";
import type { CloudInventoryPlatform } from "@/lib/cloud-inventory-platform";
import { cloudInventoryPlatformLabel } from "@/lib/cloud-inventory-platform";
import { ARCH_LUCID_AZURE_EXTRACTOR_MAX_ZIP_BYTES } from "@/lib/azure-extractor-upload-limits";
import { AZURE_EXTRACTOR_ZIP_ONLY_MESSAGE } from "@/lib/is-azure-extractor-zip-file";
import { readTier1InventoryPackageZipFromFile } from "@/lib/read-tier1-inventory-package-zip";

export type Tier1InventoryZipUploadPanelProps = {
  platform: CloudInventoryPlatform;
  pendingFile: File | null;
  onPendingFileChange: (file: File | null) => void;
  dropzoneTestId?: string;
  commandTestIdPrefix?: string;
};

/** Tier-1 cloud inventory ZIP: platform script, drop zone, and client-side manifest/resources validation. */
export function Tier1InventoryZipUploadPanel(props: Tier1InventoryZipUploadPanelProps) {
  const {
    platform,
    pendingFile,
    onPendingFileChange,
    dropzoneTestId = "wizard-evidence-upload-dropzone",
    commandTestIdPrefix = "wizard-evidence-inventory",
  } = props;
  const [busy, setBusy] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const maxMb = Math.floor(ARCH_LUCID_AZURE_EXTRACTOR_MAX_ZIP_BYTES / (1024 * 1024));
  const platformLabel = cloudInventoryPlatformLabel(platform);

  async function validateAndAccept(file: File): Promise<void> {
    setValidationError(null);
    setBusy(true);

    try {
      const result = await readTier1InventoryPackageZipFromFile(file, platform);

      if (!result.ok) {
        setValidationError(result.message);
        onPendingFileChange(null);

        return;
      }

      onPendingFileChange(file);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4" data-testid={`tier1-inventory-upload-panel-${platform}`}>
      <CloudInventoryExtractorCommandPanel
        platform={platform}
        testIdPrefix={commandTestIdPrefix}
      />

      <AzureExtractorZipDropZone
        ariaLabel={`${platformLabel} inventory evidence ZIP`}
        testId={dropzoneTestId}
        busy={busy}
        busyLabel="Validating inventory ZIP…"
        onInvalidFile={(message) => {
          setValidationError(message);
          onPendingFileChange(null);
        }}
        hint={
          <p className={cn("m-0 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
            Client-side checks require <code className={OPERATOR_TYPOGRAPHY.helper}>manifest.json</code> (schemaVersion 1) and{" "}
            <code className={OPERATOR_TYPOGRAPHY.helper}>resources.json</code> at the archive root. Maximum size {maxMb} MB.
          </p>
        }
        onZipSelected={(file) => {
          void validateAndAccept(file);
        }}
      />

      {busy ? (
        <AzureExtractorUploadProgressBar
          label="Validating manifest.json and resources.json…"
          testId={`${dropzoneTestId}-validation-progress`}
        />
      ) : null}

      {validationError !== null ? (
        <Tier1InventoryZipValidationCallout
          message={validationError}
          testId="wizard-evidence-inventory-zip-error"
        />
      ) : null}

      {pendingFile !== null && validationError === null ? (
        <p
          className={cn("m-0 text-neutral-700 dark:text-neutral-300", OPERATOR_TYPOGRAPHY.body)}
          data-testid="wizard-evidence-upload-selected"
        >
          Selected: <span className="font-medium">{pendingFile.name}</span> — validated locally; uploads automatically
          after the review is created.
        </p>
      ) : null}

      {!pendingFile && validationError === null ? (
        <p className="sr-only" data-testid="wizard-evidence-inventory-zip-hint">
          {AZURE_EXTRACTOR_ZIP_ONLY_MESSAGE}
        </p>
      ) : null}
    </div>
  );
}
