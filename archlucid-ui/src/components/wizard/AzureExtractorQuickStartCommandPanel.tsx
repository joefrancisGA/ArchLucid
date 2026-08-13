"use client";
import { cn } from "@/lib/utils";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

import { Button } from "@/components/ui/button";
import { buildGetArchLucidAzurePackageCommandLine } from "@/lib/get-archlucid-azure-package-command";
import { showError, showSuccess } from "@/lib/toast";

export type AzureExtractorQuickStartCommandPanelProps = {
  testIdPrefix?: string;
  title?: string;
  description?: string;
  className?: string;
};

/**
 * @deprecated Prefer {@link CloudInventoryExtractorCommandPanel} with `platform="azure"`. Retained for extract-upload settings until that route migrates.
 *
 * Copy-paste one-liner for Run-ArchLucidAzureExtractor.ps1 (Tier 1 quick start).
 */
export function AzureExtractorQuickStartCommandPanel(props: AzureExtractorQuickStartCommandPanelProps) {
  const {
    testIdPrefix = "azure-extractor-quick-start",
    title = "Quick start (recommended)",
    description = "From your ArchLucid checkout: sign in to Azure when prompted, then upload ./archlucid-azure-package.zip here.",
    className,
  } = props;
  const commandLine = buildGetArchLucidAzurePackageCommandLine();

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
          <p className={cn("m-0 font-medium text-neutral-800 dark:text-neutral-200", OPERATOR_TYPOGRAPHY.body)}>{title}</p>
          <p className={cn("mt-1 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>{description}</p>
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
        className={cn(
          "mt-3 max-h-[min(40vh,320px)] overflow-auto whitespace-pre-wrap break-words rounded-md border border-neutral-200 bg-white p-3 leading-relaxed dark:border-neutral-700 dark:bg-neutral-900",
          OPERATOR_TYPOGRAPHY.helper,
        )}
        data-testid={`${testIdPrefix}-command`}
      >
        <code className="whitespace-pre-wrap break-words">{commandLine}</code>
      </pre>
    </div>
  );
}
