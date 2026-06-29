"use client";

import { ChevronDown } from "lucide-react";
import { useState } from "react";
import { useFormContext } from "react-hook-form";

import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { CloudInventoryExtractorCommandPanel } from "@/components/wizard/CloudInventoryExtractorCommandPanel";
import { AzureExtractorPackageZipField } from "@/components/wizard/steps/AzureExtractorPackageZipField";
import type { CloudInventoryPlatform } from "@/lib/cloud-inventory-platform";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";
import type { WizardFormValues } from "@/lib/wizard-schema";

function resolveInventoryPlatform(cloudProvider: WizardFormValues["cloudProvider"]): CloudInventoryPlatform {
  if (cloudProvider === "Aws") {
    return "aws";
  }

  if (cloudProvider === "Gcp") {
    return "gcp";
  }

  return "azure";
}

/**
 * Optional cloud inventory packaging step.
 *
 * A pasted architecture brief is a first-class input — inventory ZIP output is optional
 * enrichment. The ZIP upload and packager command are collapsed by default so users with a
 * pasted brief can proceed without being prompted to upload anything.
 */
export function WizardStepAzureContext() {
  const { watch } = useFormContext<WizardFormValues>();
  const cloudProvider = watch("cloudProvider");
  const inventoryPlatform = resolveInventoryPlatform(cloudProvider);
  const [inventoryOpen, setInventoryOpen] = useState(false);

  return (
    <section className="space-y-4" aria-labelledby="wizard-azure-ingest-heading">
      <div>
        <h2 id="wizard-azure-ingest-heading" className={cn("m-0 font-semibold text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}>
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
          <p className={cn("m-0 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.body)}>
            Run the read-only inventory script for your cloud provider locally, then attach the ZIP to prefill wizard
            fields.
          </p>

          <AzureExtractorPackageZipField variant="ingest" />

          <CloudInventoryExtractorCommandPanel
            platform={inventoryPlatform}
            testIdPrefix="wizard-cloud-inventory-ingest"
          />
        </CollapsibleContent>
      </Collapsible>
    </section>
  );
}
