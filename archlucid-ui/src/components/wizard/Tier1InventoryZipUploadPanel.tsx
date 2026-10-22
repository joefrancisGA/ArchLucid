"use client";
import { cn } from "@/lib/utils";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

import { Sparkles } from "lucide-react";
import { useState } from "react";

import { InventoryZipDropZone } from "@/components/InventoryZipDropZone";
import { Button } from "@/components/ui/button";
import { CloudInventoryExtractorCommandPanel } from "@/components/wizard/CloudInventoryExtractorCommandPanel";
import { InventoryDemoScenarioPicker } from "@/components/wizard/InventoryDemoScenarioPicker";
import { Tier1InventoryZipValidationCallout } from "@/components/wizard/Tier1InventoryZipValidationCallout";
import { AzureExtractorUploadProgressBar } from "@/components/AzureExtractorUploadProgressBar";
import {
  createInventoryDemoZipFile,
  defaultInventoryDemoScenarioId,
  type InventoryDemoScenarioId,
} from "@/lib/arch-lucid-inventory-demo-scenarios";
import type { CloudInventoryPlatform } from "@/lib/cloud-inventory-platform";
import { cloudInventoryPlatformLabel } from "@/lib/cloud-inventory-platform";
import { ARCH_LUCID_AZURE_EXTRACTOR_MAX_ZIP_BYTES } from "@/lib/azure-extractor-upload-limits";
import { AZURE_EXTRACTOR_ZIP_ONLY_MESSAGE } from "@/lib/is-azure-extractor-zip-file";
import { readTier1InventoryPackageZipFromFile } from "@/lib/read-tier1-inventory-package-zip";
import { ZERO_CONFIG_DEMO_TRY_DEMO_LABEL } from "@/lib/zero-config-demo-mode";

export type Tier1InventoryZipUploadPanelProps = {
  platform: CloudInventoryPlatform;
  pendingFile: File | null;
  onPendingFileChange: (file: File | null) => void;
  dropzoneTestId?: string;
  commandTestIdPrefix?: string;
  showDemoScenarios?: boolean;
};

/** Tier-1 cloud inventory ZIP: platform script, drop zone, and client-side manifest/resources validation. */
export function Tier1InventoryZipUploadPanel(props: Tier1InventoryZipUploadPanelProps) {
  const {
    platform,
    pendingFile,
    onPendingFileChange,
    dropzoneTestId = "wizard-evidence-upload-dropzone",
    commandTestIdPrefix = "wizard-evidence-inventory",
    showDemoScenarios = false,
  } = props;
  const [busy, setBusy] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [selectedDemoScenarioId, setSelectedDemoScenarioId] = useState<InventoryDemoScenarioId>(() =>
    defaultInventoryDemoScenarioId(platform),
  );
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

  function loadDemoZip(): void {
    setValidationError(null);
    setBusy(true);

    try {
      const demoFile = createInventoryDemoZipFile(platform, selectedDemoScenarioId);
      onPendingFileChange(demoFile);
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

      {showDemoScenarios ? (
        <div className="space-y-3" data-testid={`${commandTestIdPrefix}-demo-scenarios`}>
          <p className={cn("m-0 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
            Or choose a bundled synthetic {platformLabel} inventory scenario — no local collector run required.
          </p>
          <InventoryDemoScenarioPicker
            platform={platform}
            selectedScenarioId={selectedDemoScenarioId}
            onSelectScenario={setSelectedDemoScenarioId}
            testIdPrefix={`${commandTestIdPrefix}-demo`}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={busy}
            data-testid={`${commandTestIdPrefix}-try-demo`}
            onClick={loadDemoZip}
          >
            <Sparkles className="mr-1.5 h-3.5 w-3.5" aria-hidden />
            {ZERO_CONFIG_DEMO_TRY_DEMO_LABEL}
          </Button>
        </div>
      ) : null}

      <InventoryZipDropZone
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
            Drop the inventory ZIP output from the extractor script. Maximum size {maxMb} MB. The file is validated locally
            before upload.
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
