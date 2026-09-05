"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";
import { ChevronDown } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { useFormContext } from "react-hook-form";

import { AzureExtractorUploadFailureCallout } from "@/components/AzureExtractorUploadFailureCallout";
import { AzureExtractorZipDropZone } from "@/components/AzureExtractorZipDropZone";
import { InAppHelpLink } from "@/components/InAppHelpLink";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Label } from "@/components/ui/label";
import { CloudInventoryExtractorCommandPanel } from "@/components/wizard/CloudInventoryExtractorCommandPanel";
import { AzureExtractorDemoScenarioPicker } from "@/components/wizard/AzureExtractorDemoScenarioPicker";
import { buildWizardPrefillFromArchLucidAzureManifest } from "@/lib/apply-arch-lucid-azure-package-manifest-to-wizard";
import type { ArchLucidAzurePackageManifest } from "@/lib/arch-lucid-azure-package-manifest";
import {
  DEFAULT_DEMO_REVIEW_SCENARIO_ID,
  type DemoReviewScenarioId,
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
import {
  parseWizardAzureAdvancedOpenFromSearch,
  wizardAzureAdvancedHrefFromSearch,
} from "@/lib/wizard/wizard-azure-advanced-url";

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
 * that map to the architecture review create payload (description, optional system name, architecture hints).
 *
 * Azure-only: applying a ZIP through this field sets `cloudProvider` to `"Azure"`. Do not embed this component
 * on AWS/GCP evidence paths — use `Tier1InventoryZipUploadPanel` or a future multi-cloud variant instead.
 */
export function AzureExtractorPackageZipField(props: AzureExtractorPackageZipFieldProps) {
  const { variant, onPendingZipFileChange } = props;
  const router = useRouter();
  const pathname = usePathname() ?? "/";
  const searchParams = useSearchParams();
  const wizardAzureAdvancedOpenParam = searchParams.get("wizardAzureAdvancedOpen");
  const { setValue } = useFormContext<WizardFormValues>();
  const [busy, setBusy] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [acceptedFileLabel, setAcceptedFileLabel] = useState<string | null>(null);
  const [selectedDemoScenarioId, setSelectedDemoScenarioId] = useState<DemoReviewScenarioId>(
    DEFAULT_DEMO_REVIEW_SCENARIO_ID,
  );
  const [azureAdvancedOpen, setAzureAdvancedOpenState] = useState(() =>
    parseWizardAzureAdvancedOpenFromSearch(wizardAzureAdvancedOpenParam),
  );

  const syncAzureAdvancedOpenToUrl = useCallback(
    (open: boolean) => {
      router.replace(wizardAzureAdvancedHrefFromSearch(searchParams.toString(), open, pathname), {
        scroll: false,
      });
    },
    [pathname, router, searchParams],
  );

  const setAzureAdvancedOpen = useCallback(
    (open: boolean) => {
      setAzureAdvancedOpenState(open);
      syncAzureAdvancedOpenToUrl(open);
    },
    [syncAzureAdvancedOpenToUrl],
  );

  useEffect(() => {
    setAzureAdvancedOpenState(parseWizardAzureAdvancedOpenFromSearch(wizardAzureAdvancedOpenParam));
  }, [wizardAzureAdvancedOpenParam]);
  const maxMb = Math.floor(ARCH_LUCID_AZURE_EXTRACTOR_MAX_ZIP_BYTES / (1024 * 1024));
  const successMessage =
    variant === "baseline"
      ? "Extractor package applied — confirm the prefilled brief on the review step."
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
        { platform: "azure", scenarioId: selectedDemoScenarioId },
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

        return;
      }

      const scenarioLabel = selectedDemoScenarioId.replace(/-/g, " ");
      setAcceptedFileLabel(`Bundled demo (${scenarioLabel})`);
      showSuccess(successMessage);
    } finally {
      setBusy(false);
    }
  }

  const baselineAzureContent = (
    <>
      {variant === "baseline" ? (
        <div className="space-y-4">
          <BaselineStepHeading
            step={1}
            title="Collect inventory locally"
            description="Run the read-only extractor in your Azure tenant — ArchLucid never needs cloud credentials for this step."
          />
          <CloudInventoryExtractorCommandPanel
            platform="azure"
            testIdPrefix="wizard-baseline-extractor"
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
        ariaLabel="Cloud inventory ZIP file"
        busy={busy}
        busyLabel="Reading extractor package…"
        testId={variant === "baseline" ? "wizard-baseline-zip-field" : "wizard-azure-zip-field"}
        onInvalidFile={(message) => {
          setLocalError(message);
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

              return;
            }

            applyManifestToWizard(result.manifest);
            markZipReady(file);
          } finally {
            setBusy(false);
          }
        }}
      />

      {variant === "baseline" && acceptedFileLabel !== null ? (
        <BaselineStepHeading
          step={3}
          title="Continue to review confirmation"
          description="Confirm the prefilled brief on the review step, then submit to link this package to your review."
        />
      ) : null}

      {variant === "ingest" ? (
        <CloudInventoryExtractorCommandPanel platform="azure" testIdPrefix="wizard-ingest-extractor" />
      ) : null}
    </>
  );

  return (
    <div className="space-y-4">
      {variant === "baseline" ? (
        <p className={cn("m-0 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.body)}>
          Azure inventory ZIP is optional enrichment — expand below only when you have packager output to attach.
        </p>
      ) : (
        <div className="flex flex-wrap items-center gap-2">
          <Label className={cn("font-medium text-neutral-800 dark:text-neutral-200", OPERATOR_TYPOGRAPHY.body)}>
            Cloud inventory ZIP
          </Label>
          <InAppHelpLink helpSlug="pilot-guide" label="Open pilot guide" className="h-5 w-5" />
        </div>
      )}

      {variant === "baseline" ? (
        <Collapsible
          open={azureAdvancedOpen}
          onOpenChange={setAzureAdvancedOpen}
          data-testid="wizard-azure-advanced-evidence"
        >
          <CollapsibleTrigger
            type="button"
            className={cn(
              "flex w-full items-center justify-between gap-2 rounded-md border border-neutral-200 bg-al-surface-raised px-3 py-2 text-left hover:bg-al-layer-hover dark:border-neutral-700",
              OPERATOR_TYPOGRAPHY.body,
            )}
            aria-expanded={azureAdvancedOpen}
            data-testid="wizard-azure-advanced-toggle"
          >
            <span className="font-medium text-al-text-primary">Advanced evidence (Azure)</span>
            <span className={cn("mr-auto ml-2 font-normal text-neutral-500 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
              optional
            </span>
            <ChevronDown
              className={cn("h-4 w-4 shrink-0 transition-transform", azureAdvancedOpen ? "rotate-180" : "rotate-0")}
              aria-hidden
            />
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-2 space-y-4 rounded-md border border-neutral-200 p-4 dark:border-neutral-700">
            {baselineAzureContent}
          </CollapsibleContent>
        </Collapsible>
      ) : (
        baselineAzureContent
      )}

      {variant === "ingest" ? (
        <p className={cn("m-0 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
          Or use the{" "}
          <Link className={OPERATOR_LINK.nav} href="/architecture/reviews/new?baseline=1">
            baseline-first wizard
          </Link>{" "}
          to attach optional evidence after your review brief.
        </p>
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
            "rounded-md border border-neutral-200 bg-neutral-50 px-3 py-2 text-neutral-800 dark:border-neutral-700 dark:bg-neutral-900/60 dark:text-neutral-100",
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
