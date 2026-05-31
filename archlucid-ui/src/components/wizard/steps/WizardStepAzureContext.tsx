"use client";

import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { AzureExtractorPackageZipField } from "@/components/wizard/steps/AzureExtractorPackageZipField";
import { buildGetArchLucidAzurePackageCommandLine } from "@/lib/get-archlucid-azure-package-command";
import { getEffectiveBrowserProxyScopeHeaders } from "@/lib/operator-scope-storage";
import { showError, showSuccess } from "@/lib/toast";

/** Optional Azure inventory packaging before advancing to advanced ingest fields (Improvement #17 UX). */
export function WizardStepAzureContext() {
  const [commandLine, setCommandLine] = useState("");

  useEffect(() => {
    const tenantId = getEffectiveBrowserProxyScopeHeaders()["x-tenant-id"]?.trim() ?? "";

    setCommandLine(buildGetArchLucidAzurePackageCommandLine({ subscriptionId: tenantId }));
  }, []);

  return (
    <section className="space-y-4" aria-labelledby="wizard-azure-ingest-heading">
      <div>
        <h2 id="wizard-azure-ingest-heading" className="m-0 text-sm font-semibold text-al-text-primary">
          Ingest Azure context
        </h2>
        <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
          Run read-only ARM inventory packaging from your ArchLucid checkout, then attach the ZIP when configuring
          ingestion or uploads for this tenant. You can also parse the packager ZIP locally to prefill the wizard (below).
          Narrow scope with{" "}
          <code className="rounded bg-neutral-100 px-1 py-0.5 text-xs dark:bg-neutral-800">-ResourceGroupScope</code> when
          you only need one resource group.
        </p>
      </div>

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
    </section>
  );
}
