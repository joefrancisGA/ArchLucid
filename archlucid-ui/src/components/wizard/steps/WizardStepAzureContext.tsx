"use client";

import { useEffect, useState } from "react";

import { ChevronDown } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { AzureExtractorPackageZipField } from "@/components/wizard/steps/AzureExtractorPackageZipField";
import { buildGetArchLucidAzurePackageCommandLine } from "@/lib/get-archlucid-azure-package-command";
import { getEffectiveBrowserProxyScopeHeaders } from "@/lib/operator-scope-storage";
import { showError, showSuccess } from "@/lib/toast";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

/**
 * Optional Azure inventory packaging step.
 *
 * A pasted architecture brief is a first-class input — Azure extractor output is optional
 * enrichment. The ZIP upload and packager command are collapsed by default so users with a
 * pasted brief can proceed without being prompted to upload anything.
 */
export function WizardStepAzureContext() {
  const [commandLine, setCommandLine] = useState("");
  const [azureOpen, setAzureOpen] = useState(false);

  useEffect(() => {
    const tenantId = getEffectiveBrowserProxyScopeHeaders()["x-tenant-id"]?.trim() ?? "";

    setCommandLine(buildGetArchLucidAzurePackageCommandLine({ subscriptionId: tenantId }));
  }, []);

  return (
    <section className="space-y-4" aria-labelledby="wizard-azure-ingest-heading">
      <div>
        <h2 id="wizard-azure-ingest-heading" className="m-0 text-sm font-semibold text-al-text-primary">
          Optional evidence enrichment
        </h2>
        <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
          Add cloud inventory or supporting files if available. You can continue with the pasted architecture brief
          without uploading anything.
        </p>
      </div>

      <Collapsible open={azureOpen} onOpenChange={setAzureOpen} data-testid="wizard-azure-optional-enrichment">
        <CollapsibleTrigger
          type="button"
          className={cn(
            "flex w-full items-center justify-between gap-2 rounded-md border border-neutral-200 bg-al-surface-raised px-3 py-2 text-left hover:bg-al-layer-hover dark:border-neutral-700",
            OPERATOR_TYPOGRAPHY.body,
          )}
          aria-expanded={azureOpen}
          data-testid="wizard-azure-optional-toggle"
        >
          <span className="font-medium text-al-text-primary">Add Azure inventory ZIP</span>
          <span className="mr-auto ml-2 text-xs font-normal text-neutral-500 dark:text-neutral-400">optional</span>
          <ChevronDown
            className={cn("h-4 w-4 shrink-0 transition-transform", azureOpen ? "rotate-180" : "rotate-0")}
            aria-hidden
          />
        </CollapsibleTrigger>

        <CollapsibleContent className="mt-2 space-y-4 rounded-md border border-neutral-200 p-4 dark:border-neutral-700">
          <p className="m-0 text-sm text-neutral-600 dark:text-neutral-400">
            Run read-only ARM inventory packaging from your ArchLucid checkout, then attach the ZIP to prefill
            wizard fields. Narrow scope with{" "}
            <code className="rounded bg-neutral-100 px-1 py-0.5 text-xs dark:bg-neutral-800">
              -ResourceGroupScope
            </code>{" "}
            when you only need one resource group.
          </p>

          <AzureExtractorPackageZipField variant="ingest" />

          <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-4 dark:border-neutral-700 dark:bg-neutral-950/80">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="m-0 text-sm font-medium text-neutral-800 dark:text-neutral-200">
                Recommended command (repository root)
              </p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                data-testid="wizard-azure-ingest-copy"
                disabled={commandLine.trim().length === 0}
                onClick={() => {
                  void (async () => {
                    try {
                      await navigator.clipboard.writeText(commandLine);
                      showSuccess("Command copied.");
                    } catch {
                      showError("Azure ingest", "Could not write to clipboard — copy manually.");
                    }
                  })();
                }}
              >
                Copy to clipboard
              </Button>
            </div>
            <pre className="mt-3 max-h-[min(40vh,320px)] overflow-auto rounded-md border border-neutral-200 bg-white p-3 text-[11px] leading-relaxed dark:border-neutral-700 dark:bg-neutral-900">
              <code>{commandLine}</code>
            </pre>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </section>
  );
}
