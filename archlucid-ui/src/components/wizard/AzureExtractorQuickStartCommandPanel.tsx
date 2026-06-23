"use client";

import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { buildGetArchLucidAzurePackageCommandLine } from "@/lib/get-archlucid-azure-package-command";
import { getEffectiveBrowserProxyScopeHeaders } from "@/lib/operator-scope-storage";
import { showError, showSuccess } from "@/lib/toast";
import { cn } from "@/lib/utils";

export type AzureExtractorQuickStartCommandPanelProps = {
  testIdPrefix?: string;
  title?: string;
  description?: string;
  className?: string;
};

/**
 * Copy-paste one-liner for Run-ArchLucidAzureExtractor.ps1 (Tier 1 quick start).
 */
export function AzureExtractorQuickStartCommandPanel(props: AzureExtractorQuickStartCommandPanelProps) {
  const {
    testIdPrefix = "azure-extractor-quick-start",
    title = "Quick start (recommended)",
    description = "From your ArchLucid checkout: sign in to Azure when prompted, then upload ./archlucid-azure-package.zip here.",
    className,
  } = props;
  const [commandLine, setCommandLine] = useState("");

  useEffect(() => {
    const tenantId = getEffectiveBrowserProxyScopeHeaders()["x-tenant-id"]?.trim() ?? "";

    setCommandLine(buildGetArchLucidAzurePackageCommandLine({ subscriptionId: tenantId }));
  }, []);

  return (
    <div
      className={cn(
        "rounded-lg border border-neutral-200 bg-neutral-50 p-4 dark:border-neutral-700 dark:bg-neutral-950/80",
        className,
      )}
      data-testid={`${testIdPrefix}-panel`}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="m-0 text-sm font-medium text-neutral-800 dark:text-neutral-200">{title}</p>
          <p className="mt-1 text-xs text-neutral-600 dark:text-neutral-400">{description}</p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          data-testid={`${testIdPrefix}-copy`}
          disabled={commandLine.trim().length === 0}
          onClick={() => {
            void (async () => {
              try {
                await navigator.clipboard.writeText(commandLine);
                showSuccess("Command copied.");
              } catch {
                showError("Azure extractor", "Could not write to clipboard — copy manually.");
              }
            })();
          }}
        >
          Copy command
        </Button>
      </div>
      <pre
        className="mt-3 max-h-[min(40vh,320px)] overflow-auto rounded-md border border-neutral-200 bg-white p-3 text-[11px] leading-relaxed dark:border-neutral-700 dark:bg-neutral-900"
        data-testid={`${testIdPrefix}-command`}
      >
        <code>{commandLine}</code>
      </pre>
    </div>
  );
}
