"use client";

import Link from "next/link";
import { useId, useState } from "react";
import { useFormContext } from "react-hook-form";

import { HelpLink } from "@/components/HelpLink";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { buildWizardPrefillFromArchLucidAzureManifest } from "@/lib/apply-arch-lucid-azure-package-manifest-to-wizard";
import type { ArchLucidAzurePackageManifest } from "@/lib/arch-lucid-azure-package-manifest";
import { getBundledArchLucidAzurePackageSampleZipBytes } from "@/lib/arch-lucid-azure-package-sample-zip";
import { ARCH_LUCID_AZURE_EXTRACTOR_MAX_ZIP_BYTES } from "@/lib/azure-extractor-upload-limits";
import { buildGetArchLucidAzurePackageCommandLine } from "@/lib/get-archlucid-azure-package-command";
import { recordPilotBaselineZipApplied } from "@/lib/pilot-baseline-zip-signal";
import {
  readArchLucidAzurePackageZipFromBytes,
  readArchLucidAzurePackageZipFromFile,
} from "@/lib/read-arch-lucid-azure-package-zip";
import { showError, showSuccess } from "@/lib/toast";
import type { WizardFormValues } from "@/lib/wizard-schema";

export type AzureExtractorPackageZipFieldProps = {
  variant: "baseline" | "ingest";
};

/**
 * Client-side unpack of the read-only Azure packager ZIP to read `manifest.json` and prefill wizard fields
 * that map to the architecture run create payload (description, optional system name, topology hints).
 */
export function AzureExtractorPackageZipField(props: AzureExtractorPackageZipFieldProps) {
  const { variant } = props;
  const { setValue } = useFormContext<WizardFormValues>();
  const inputId = useId();
  const [busy, setBusy] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const maxMb = Math.floor(ARCH_LUCID_AZURE_EXTRACTOR_MAX_ZIP_BYTES / (1024 * 1024));
  const successMessage =
    variant === "baseline"
      ? "Extractor manifest applied — confirm system identity on the next step."
      : "Extractor manifest applied — review identity and brief on earlier steps if needed.";

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

    recordPilotBaselineZipApplied();
    showSuccess(successMessage);
  }

  function loadSampleZip(): void {
    setLocalError(null);
    setBusy(true);

    try {
      const result = readArchLucidAzurePackageZipFromBytes(getBundledArchLucidAzurePackageSampleZipBytes());

      if (!result.ok) {
        setLocalError(result.message);
        showError("Extractor ZIP", result.message);

        return;
      }

      applyManifestToWizard(result.manifest);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      className="space-y-2"
      data-testid={variant === "baseline" ? "wizard-baseline-zip-field" : "wizard-azure-zip-field"}
    >
      <div className="flex flex-wrap items-center gap-2">
        <Label htmlFor={inputId} className="text-sm font-medium text-neutral-800 dark:text-neutral-200">
          Azure packager ZIP
        </Label>
        <HelpLink
          docPath="/docs/library/PILOT_GUIDE.md"
          label="Open pilot guide on GitHub (new tab)"
          className="h-5 w-5"
        />
      </div>
      <p className="m-0 text-xs text-neutral-600 dark:text-neutral-400">
        Same artifact as{" "}
        <code className="rounded bg-neutral-100 px-1 py-0.5 text-[11px] dark:bg-neutral-800">
          Get-ArchLucidAzurePackage.ps1
        </code>{" "}
        (read-only inventory). Maximum size {maxMb} MB (matches server upload limit). Only{" "}
        <code className="rounded bg-neutral-100 px-1 py-0.5 text-[11px] dark:bg-neutral-800">manifest.json</code>{" "}
        is parsed in the browser; upload the full ZIP to ingestion when your run is configured.
      </p>
      <input
        id={inputId}
        type="file"
        accept=".zip,application/zip"
        disabled={busy}
        aria-label="Azure packager ZIP file"
        className="block w-full max-w-md text-sm text-neutral-800 file:mr-3 file:rounded-md file:border file:border-neutral-300 file:bg-white file:px-3 file:py-1.5 file:text-sm file:font-medium dark:text-neutral-200 dark:file:border-neutral-600 dark:file:bg-neutral-900"
        onChange={(event) => {
          const input = event.currentTarget;
          const file = input.files?.[0] ?? null;

          if (file === null) {
            return;
          }

          setLocalError(null);
          setBusy(true);

          void (async () => {
            try {
              if (file.size > 50 * 1024 * 1024) {
                // Warning toast for files > 50MB
                showError("Large file detected", "Processing may take longer than usual.", { type: "warning" });
              }

              const result = await readArchLucidAzurePackageZipFromFile(file);

              if (!result.ok) {
                setLocalError(result.message);
                showError("Extractor ZIP", result.message);

                return;
              }

              applyManifestToWizard(result.manifest);
            } finally {
              setBusy(false);
              input.value = "";
            }
          })();
        }}
      />
      {variant === "baseline" ? (
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={busy}
          data-testid="wizard-azure-zip-try-sample"
          onClick={loadSampleZip}
        >
          Try with Sample Data
        </Button>
      ) : null}
      {busy ? (
        <p className="m-0 text-xs text-neutral-500 dark:text-neutral-400" data-testid="wizard-azure-zip-busy">
          Reading manifest…
        </p>
      ) : null}
      {localError !== null && localError.length > 0 ? (
        <p className="m-0 text-sm text-red-600 dark:text-red-400" role="alert" data-testid="wizard-azure-zip-error">
          {localError}
        </p>
      ) : null}
      {variant === "ingest" ? (
        <p className="m-0 text-xs text-neutral-600 dark:text-neutral-400">
          Need the command?{" "}
          <span className="font-mono text-[11px]">
            {buildGetArchLucidAzurePackageCommandLine().split(/\s+/).slice(0, 3).join(" ")}…
          </span>{" "}
          (full line copied from the block below). Or use the{" "}
          <Link className="font-medium text-teal-800 underline dark:text-teal-300" href="/reviews/new?baseline=1">
            baseline-first wizard
          </Link>{" "}
          to lead with ZIP upload.
        </p>
      ) : null}
    </div>
  );
}
