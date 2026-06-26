"use client";

import Link from "next/link";
import { useState } from "react";
import { useFormContext } from "react-hook-form";

import { AzureExtractorUploadFailureCallout } from "@/components/AzureExtractorUploadFailureCallout";
import { AzureExtractorZipDropZone } from "@/components/AzureExtractorZipDropZone";
import { InAppHelpLink } from "@/components/InAppHelpLink";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { AzureExtractorQuickStartCommandPanel } from "@/components/wizard/AzureExtractorQuickStartCommandPanel";
import { AzureExtractorDemoScenarioPicker } from "@/components/wizard/AzureExtractorDemoScenarioPicker";
import { buildWizardPrefillFromArchLucidAzureManifest } from "@/lib/apply-arch-lucid-azure-package-manifest-to-wizard";
import type { ArchLucidAzurePackageManifest } from "@/lib/arch-lucid-azure-package-manifest";
import {
  DEFAULT_AZURE_EXTRACTOR_DEMO_SCENARIO_ID,
  type AzureExtractorDemoScenarioId,
} from "@/lib/arch-lucid-azure-extractor-demo-scenarios";
import { ARCH_LUCID_AZURE_EXTRACTOR_MAX_ZIP_BYTES } from "@/lib/azure-extractor-upload-limits";
import { buildGetArchLucidAzurePackageCommandLine } from "@/lib/get-archlucid-azure-package-command";
import { recordPilotBaselineZipApplied } from "@/lib/pilot-baseline-zip-signal";
import { readArchLucidAzurePackageZipFromFile } from "@/lib/read-arch-lucid-azure-package-zip";
import { showError, showSuccess } from "@/lib/toast";
import {
  applyBundledDemoPackageToWizard,
  ZERO_CONFIG_DEMO_TRY_DEMO_LABEL,
} from "@/lib/zero-config-demo-mode";
import type { WizardFormValues } from "@/lib/wizard-schema";
import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

export type AzureExtractorPackageZipFieldProps = {
  variant: "baseline" | "ingest";
  /** Queues the validated ZIP for server upload after the review is created. */
  onPendingZipFileChange?: (file: File | null) => void;
};

function BaselineStepHeading(props: { step: number; title: string; description: string }) {
  return (
    <div className="space-y-1" data-testid={`wizard-baseline-step-${props.step}-heading`}>
      <p className={cn("m-0 font-medium text-neutral-900 dark:text-neutral-100", OPERATOR_TYPOGRAPHY.body)}>
        Step {props.step} — {props.title}
      </p>
      <p className={cn("m-0 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>{props.description}</p>
    </div>
  );
}

/**
 * Client-side unpack of the read-only Azure packager ZIP to read `manifest.json` and prefill wizard fields
 * that map to the architecture review create payload (description, optional system name, topology hints).
 */
export function AzureExtractorPackageZipField(props: AzureExtractorPackageZipFieldProps) {
  const { variant, onPendingZipFileChange } = props;
  const { setValue } = useFormContext<WizardFormValues>();
  const [busy, setBusy] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [acceptedFileLabel, setAcceptedFileLabel] = useState<string | null>(null);
  const [selectedDemoScenarioId, setSelectedDemoScenarioId] = useState<AzureExtractorDemoScenarioId>(
    DEFAULT_AZURE_EXTRACTOR_DEMO_SCENARIO_ID,
  );
  const maxMb = Math.floor(ARCH_LUCID_AZURE_EXTRACTOR_MAX_ZIP_BYTES / (1024 * 1024));
  const successMessage =
    variant === "baseline"
      ? "Extractor package applied — confirm system identity on the next step."
      : "Extractor package applied — review identity and brief on earlier steps if needed.";

  function applyManifestToWizard(manifest: ArchLucidAzurePackageManifest): void {
    const prefill = buildWizardPrefillFromArchLucidAzureManifest(manifest);

    if (prefill.description !== undefined) {
      setValue("description", prefill.description, { shouldValidate: true, shouldDirty: true });
    }

    if (prefill.systemName !== undefined) {
      setValue("systemName", prefill.systemName, { shouldValidate: true, shouldDirty: true });
    }

    if (prefill.topologyHints !== undefined) {
      setValue("topologyHints", prefill.topologyHints, { shouldValidate: true, shouldDirty: true });
    }

    setValue("cloudProvider", "Azure", { shouldValidate: true, shouldDirty: true });
    recordPilotBaselineZipApplied();
    showSuccess(successMessage);
  }

  function markZipReady(file: File): void {
    const sizeKb = Math.max(1, Math.round(file.size / 1024));
    setAcceptedFileLabel(`${file.name} (${sizeKb} KB)`);
    onPendingZipFileChange?.(file);
  }

  function loadDemoZip(): void {
    setLocalError(null);
    setBusy(true);

    try {
      const applied = applyBundledDemoPackageToWizard(
        selectedDemoScenarioId,
        setValue,
        (file) => {
          if (file !== null) {
            markZipReady(file);
            recordPilotBaselineZipApplied();
          } else {
            onPendingZipFileChange?.(null);
            setAcceptedFileLabel(null);
          }
        },
      );

      if (!applied.ok) {
        setLocalError(applied.message);
        showError("Extractor ZIP", applied.message);

        return;
      }

      const scenarioLabel = selectedDemoScenarioId.replace(/-/g, " ");
      setAcceptedFileLabel(`Bundled demo (${scenarioLabel})`);
      showSuccess(successMessage);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <Label className={cn("font-medium text-neutral-800 dark:text-neutral-200", OPERATOR_TYPOGRAPHY.body)}>
          Azure packager ZIP
        </Label>
        <InAppHelpLink helpSlug="pilot-guide" label="Open pilot guide" className="h-5 w-5" />
      </div>

      {variant === "baseline" ? (
        <div className="space-y-4">
          <BaselineStepHeading
            step={1}
            title="Collect inventory locally"
            description="Run the read-only extractor in your Azure tenant — ArchLucid never needs cloud credentials for this step."
          />
          <AzureExtractorQuickStartCommandPanel
            testIdPrefix="wizard-baseline-extractor"
            description="From your ArchLucid checkout: sign in to Azure when prompted, then upload ./archlucid-azure-package.zip in step 2."
          />
          <AzureExtractorDemoScenarioPicker
            selectedScenarioId={selectedDemoScenarioId}
            onSelectScenario={setSelectedDemoScenarioId}
            testIdPrefix="wizard-baseline-demo"
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={busy}
            data-testid="wizard-azure-zip-try-demo"
            onClick={loadDemoZip}
          >
            {ZERO_CONFIG_DEMO_TRY_DEMO_LABEL}
          </Button>
        </div>
      ) : null}

      {variant === "baseline" ? (
        <BaselineStepHeading
          step={2}
          title="Upload the ZIP here"
          description={`Drop the packager output (max ${maxMb} MB). We validate manifest.json locally, then upload it to your review after you submit.`}
        />
      ) : null}

      <AzureExtractorZipDropZone
        ariaLabel="Azure packager ZIP file"
        busy={busy}
        busyLabel="Reading extractor package…"
        testId={variant === "baseline" ? "wizard-baseline-zip-field" : "wizard-azure-zip-field"}
        onInvalidFile={(message) => {
          setLocalError(message);
          showError("Extractor ZIP", message);
        }}
        hint={
          variant === "ingest" ? (
            <p className={cn("m-0 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
              Same artifact as{" "}
              <code className={cn("rounded bg-neutral-100 px-1 py-0.5 dark:bg-neutral-800", OPERATOR_TYPOGRAPHY.micro)}>
                Get-ArchLucidAzurePackage.ps1
              </code>{" "}
              (read-only inventory). Maximum size {maxMb} MB (matches server upload limit). Only{" "}
              <code className={cn("rounded bg-neutral-100 px-1 py-0.5 dark:bg-neutral-800", OPERATOR_TYPOGRAPHY.micro)}>
                manifest.json
              </code>{" "}
              is parsed in the browser; upload the full ZIP to ingestion when your review is configured.
            </p>
          ) : null
        }
        onZipSelected={async (file) => {
          setLocalError(null);
          setBusy(true);
          onPendingZipFileChange?.(null);
          setAcceptedFileLabel(null);

          try {
            if (file.size > 50 * 1024 * 1024) {
              showError("Large file detected", "Processing may take longer than usual.", { type: "warning" });
            }

            const result = await readArchLucidAzurePackageZipFromFile(file);

            if (!result.ok) {
              setLocalError(result.message);
              showError("Extractor ZIP", result.message);

              return;
            }

            applyManifestToWizard(result.manifest);
            markZipReady(file);
          } finally {
            setBusy(false);
          }
        }}
      />

      {variant === "ingest" ? (
        <>
          <AzureExtractorQuickStartCommandPanel testIdPrefix="wizard-ingest-extractor" />
          <p className={cn("m-0 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
            Or use the{" "}
            <Link className={OPERATOR_LINK.nav} href="/reviews/new?baseline=1">
              baseline-first wizard
            </Link>{" "}
            to lead with ZIP upload.
          </p>
        </>
      ) : null}

      {localError !== null && localError.length > 0 ? (
        <AzureExtractorUploadFailureCallout
          fallbackMessage={localError}
          problem={null}
          correlationId={null}
          rootTestId="wizard-azure-zip-error"
        />
      ) : null}

      {acceptedFileLabel !== null ? (
        <div
          className={cn(
            "rounded-md border border-teal-700/30 bg-neutral-50 px-3 py-2 text-neutral-800 dark:border-teal-800/40 dark:bg-neutral-900/60 dark:text-neutral-100",
            OPERATOR_TYPOGRAPHY.body,
          )}
          data-testid="wizard-azure-zip-ready"
        >
          <p className="m-0 font-medium">Package ready</p>
          <p className={cn("m-0 mt-1 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
            {acceptedFileLabel} — uploads automatically when you start the architecture review.
          </p>
        </div>
      ) : null}

      {variant === "baseline" && acceptedFileLabel !== null ? (
        <BaselineStepHeading
          step={3}
          title="Continue to system identity"
          description="Confirm the prefilled system name and brief on the next step, then submit to link this package to your review."
        />
      ) : null}

      {variant === "ingest" ? (
        <p className={cn("m-0 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
          Need the command?{" "}
          <span className={cn("font-mono", OPERATOR_TYPOGRAPHY.navHelper)}>
            {buildGetArchLucidAzurePackageCommandLine().split(/\s+/).slice(0, 3).join(" ")}…
          </span>{" "}
          (full line copied from the block above).
        </p>
      ) : null}
    </div>
  );
}
