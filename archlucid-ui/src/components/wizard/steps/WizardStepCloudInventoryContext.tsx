"use client";

import { cn } from "@/lib/utils";
import { ChevronDown } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { Controller, useFormContext } from "react-hook-form";

import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tier1InventoryZipUploadPanel } from "@/components/wizard/Tier1InventoryZipUploadPanel";
import { AzureExtractorPackageZipField } from "@/components/wizard/steps/AzureExtractorPackageZipField";
import type { CloudInventoryPlatform } from "@/lib/cloud-inventory-platform";
import {
  WIZARD_CLOUD_PROVIDER_OPTIONS,
  WIZARD_INVENTORY_REQUIRES_CLOUD_TARGET,
} from "@/lib/cloud-neutral-primary-copy";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import type { WizardFormValues } from "@/lib/wizard-schema";
import {
  parseWizardInventoryOpenFromSearch,
  wizardStepCloudInventoryHrefFromSearch,
} from "@/lib/wizard/wizard-step-cloud-inventory-url";

const WIZARD_INVENTORY_CLOUD_TARGETS = [
  { value: "Azure", label: WIZARD_CLOUD_PROVIDER_OPTIONS.azure },
  { value: "Aws", label: WIZARD_CLOUD_PROVIDER_OPTIONS.aws },
  { value: "Gcp", label: WIZARD_CLOUD_PROVIDER_OPTIONS.gcp },
] as const;

function resolveInventoryPlatform(
  cloudProvider: WizardFormValues["cloudProvider"],
): CloudInventoryPlatform | null {
  if (cloudProvider === "Aws") {
    return "aws";
  }

  if (cloudProvider === "Gcp") {
    return "gcp";
  }

  if (cloudProvider === "Azure") {
    return "azure";
  }

  return null;
}

export type WizardStepCloudInventoryContextProps = {
  pendingFile: File | null;
  onPendingFileChange: (file: File | null) => void;
};

/**
 * Optional cloud inventory packaging step.
 *
 * A pasted architecture brief is a first-class input — inventory ZIP output is optional
 * enrichment. The ZIP upload and packager command are collapsed by default so users with a
 * pasted brief can proceed without being prompted to upload anything.
 */
export function WizardStepCloudInventoryContext({
  pendingFile,
  onPendingFileChange,
}: WizardStepCloudInventoryContextProps) {
  const router = useRouter();
  const pathname = usePathname() ?? "/";
  const searchParams = useSearchParams();
  const wizardInventoryOpenParam = searchParams.get("wizardInventoryOpen");
  const { watch, control, clearErrors } = useFormContext<WizardFormValues>();
  const cloudProvider = watch("cloudProvider");
  const inventoryPlatform = resolveInventoryPlatform(cloudProvider);
  const [inventoryOpen, setInventoryOpenState] = useState(() =>
    parseWizardInventoryOpenFromSearch(wizardInventoryOpenParam),
  );

  const syncInventoryOpenToUrl = useCallback(
    (open: boolean) => {
      router.replace(wizardStepCloudInventoryHrefFromSearch(searchParams.toString(), open, pathname), {
        scroll: false,
      });
    },
    [pathname, router, searchParams],
  );

  const setInventoryOpen = useCallback(
    (open: boolean) => {
      setInventoryOpenState(open);
      syncInventoryOpenToUrl(open);
    },
    [syncInventoryOpenToUrl],
  );

  useEffect(() => {
    setInventoryOpenState(parseWizardInventoryOpenFromSearch(wizardInventoryOpenParam));
  }, [wizardInventoryOpenParam]);

  return (
    <section className="space-y-4" aria-labelledby="wizard-cloud-inventory-ingest-heading">
      <div>
        <h2
          id="wizard-cloud-inventory-ingest-heading"
          className={cn("m-0 font-semibold text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}
        >
          Optional evidence enrichment
        </h2>
        <p className={cn("mt-1 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.body)}>
          Add cloud inventory or supporting files if available. You can continue with the pasted architecture brief
          without uploading anything.
        </p>
      </div>

      <Collapsible open={inventoryOpen} onOpenChange={setInventoryOpen} data-testid="wizard-azure-optional-enrichment">
        <CollapsibleTrigger
          type="button"
          className={cn(
            "flex w-full items-center justify-between gap-2 rounded-md border border-neutral-200 bg-al-surface-raised px-3 py-2 text-left hover:bg-al-layer-hover dark:border-neutral-700",
            OPERATOR_TYPOGRAPHY.body,
          )}
          aria-expanded={inventoryOpen}
          data-testid="wizard-azure-optional-toggle"
        >
          <span className="font-medium text-al-text-primary">Add cloud inventory ZIP</span>
          <span className={cn("mr-auto ml-2 font-normal text-neutral-500 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>optional</span>
          <ChevronDown
            className={cn("h-4 w-4 shrink-0 transition-transform", inventoryOpen ? "rotate-180" : "rotate-0")}
            aria-hidden
          />
        </CollapsibleTrigger>

        <CollapsibleContent className="mt-2 space-y-4 rounded-md border border-neutral-200 p-4 dark:border-neutral-700">
          {inventoryPlatform === null ? (
            <>
              <p
                className={cn("m-0 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.body)}
                data-testid="wizard-inventory-select-cloud-hint"
              >
                {WIZARD_INVENTORY_REQUIRES_CLOUD_TARGET}
              </p>
              <div>
                <p className={cn("m-0 font-medium text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}>Cloud target</p>
                <Controller
                  name="cloudProvider"
                  control={control}
                  render={({ field }) => (
                    <Select
                      value={field.value === "None" ? undefined : field.value}
                      onValueChange={(value) => {
                        clearErrors("cloudProvider");
                        field.onChange(value);
                      }}
                    >
                      <SelectTrigger
                        id="wizard-inventory-cloud-target"
                        className="mt-2 w-full max-w-md border-neutral-200/90 bg-white text-left shadow-sm transition-colors hover:border-neutral-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--al-accent-border-focus)] dark:border-neutral-600 dark:bg-neutral-950/40 dark:hover:border-neutral-500"
                        data-testid="wizard-inventory-cloud-target-select"
                      >
                        <SelectValue placeholder="Select cloud target" />
                      </SelectTrigger>
                      <SelectContent className="border-neutral-200/90 dark:border-neutral-600">
                        {WIZARD_INVENTORY_CLOUD_TARGETS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
            </>
          ) : (
            <>
              <p className={cn("m-0 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.body)}>
                Run the read-only inventory script for your cloud provider locally, then attach the ZIP to prefill wizard
                fields.
              </p>

              {cloudProvider === "Azure" ? (
                <AzureExtractorPackageZipField
                  variant="ingest"
                  onPendingZipFileChange={onPendingFileChange}
                />
              ) : (
                <Tier1InventoryZipUploadPanel
                  platform={inventoryPlatform}
                  pendingFile={pendingFile}
                  onPendingFileChange={onPendingFileChange}
                  dropzoneTestId="wizard-enrichment-upload-dropzone"
                  commandTestIdPrefix="wizard-cloud-inventory-ingest"
                  showDemoScenarios
                />
              )}
            </>
          )}
        </CollapsibleContent>
      </Collapsible>
    </section>
  );
}
