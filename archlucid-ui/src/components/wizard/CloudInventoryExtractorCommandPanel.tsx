"use client";
import { cn } from "@/lib/utils";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import type { CloudInventoryPlatform } from "@/lib/cloud-inventory-platform";
import { cloudInventoryPlatformLabel } from "@/lib/cloud-inventory-platform";
import { buildGetArchLucidCloudPackageCommandLine } from "@/lib/get-archlucid-cloud-package-command";
import { getEffectiveBrowserProxyScopeHeaders } from "@/lib/operator/operator-scope-storage";
import { showError, showSuccess } from "@/lib/toast";

export type CloudInventoryExtractorCommandPanelProps = {
  platform: CloudInventoryPlatform;
  testIdPrefix?: string;
  className?: string;
};

/**
 * Copy-paste Tier-1 inventory script for Azure, AWS, or GCP (customer-controlled ZIP).
 */
export function CloudInventoryExtractorCommandPanel(props: CloudInventoryExtractorCommandPanelProps) {
  const { platform, testIdPrefix = "cloud-inventory-extractor", className } = props;
  const [commandLine, setCommandLine] = useState("");

  useEffect(() => {
    const scopeId = getEffectiveBrowserProxyScopeHeaders()["x-tenant-id"]?.trim() ?? "";

    setCommandLine(
      buildGetArchLucidCloudPackageCommandLine({
        platform,
        scopeId,
        subscriptionId: scopeId,
      }),
    );
  }, [platform]);

  const platformLabel = cloudInventoryPlatformLabel(platform);

  return (
    <div
      className={cn(
        "rounded-lg border border-neutral-200 bg-neutral-50 p-4 dark:border-neutral-700 dark:bg-neutral-950/80",
        className,
      )}
      data-testid={`${testIdPrefix}-panel`}
      data-platform={platform}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className={cn("m-0 font-medium text-neutral-800 dark:text-neutral-200", OPERATOR_TYPOGRAPHY.body)}>
            {platformLabel} inventory script
          </p>
          <p className={cn("mt-1 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
            Run from your ArchLucid checkout — no vendor credentials in your cloud account. Upload the resulting ZIP
            below.
          </p>
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
                showError(`${platformLabel} inventory`, "Could not write to clipboard — copy manually.");
              }
            })();
          }}
        >
          Copy command
        </Button>
      </div>
      <pre
        className={cn("mt-3 max-h-[min(40vh,320px)] overflow-auto rounded-md border border-neutral-200 bg-white p-3 leading-relaxed dark:border-neutral-700 dark:bg-neutral-900", OPERATOR_TYPOGRAPHY.helper)}
        data-testid={`${testIdPrefix}-command`}
      >
        <code>{commandLine}</code>
      </pre>
    </div>
  );
}
