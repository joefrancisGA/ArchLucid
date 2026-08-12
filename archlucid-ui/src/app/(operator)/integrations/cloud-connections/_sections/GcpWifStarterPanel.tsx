"use client";

import { useCallback, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import {
  buildGcpWorkloadIdentityPoolProviderSetupScript,
  GCP_WIF_STARTER_FEDERATION_HEADING,
  GCP_WIF_STARTER_FEDERATION_IDENTIFIERS,
  GCP_WIF_STARTER_FEDERATION_INTRO,
  GCP_WIF_STARTER_SCRIPT_HEADING,
  GCP_WIF_STARTER_SCRIPT_INTRO,
  GCP_WIF_STARTER_SCRIPT_REPLACE_HINT,
} from "@/lib/gcp-cloud-connection-wif-starter";
import { HELP_PAGE_LAYOUT } from "@/lib/help/help-page-layout";
import { cn } from "@/lib/utils";

/** Federation identifiers and copyable gcloud starter for GCP identity setup (TB-1775). */
export function GcpWifStarterPanel(): React.ReactElement {
  const [copied, setCopied] = useState(false);
  const setupScript = useMemo(() => buildGcpWorkloadIdentityPoolProviderSetupScript(), []);

  const copySetupScript = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(setupScript);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }, [setupScript]);

  return (
    <div className="space-y-4" data-testid="gcp-wif-starter-panel">
      <div className="space-y-3">
        <h3 className={cn("m-0", OPERATOR_TYPOGRAPHY.cardTitle)}>{GCP_WIF_STARTER_FEDERATION_HEADING}</h3>
        <p className={cn("m-0 max-w-prose text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
          {GCP_WIF_STARTER_FEDERATION_INTRO}
        </p>
        <div className={HELP_PAGE_LAYOUT.tableWrap} data-testid="gcp-wif-starter-federation-identifiers">
          <table className={HELP_PAGE_LAYOUT.table}>
            <caption className="sr-only">OIDC federation identifiers for GCP Workload Identity Pool providers</caption>
            <thead>
              <tr>
                <th scope="col" className={HELP_PAGE_LAYOUT.tableHeadCell}>
                  Field
                </th>
                <th scope="col" className={HELP_PAGE_LAYOUT.tableHeadCell}>
                  Value
                </th>
              </tr>
            </thead>
            <tbody>
              {GCP_WIF_STARTER_FEDERATION_IDENTIFIERS.map((identifier, index) => (
                <tr
                  key={identifier.id}
                  className={index % 2 === 0 ? HELP_PAGE_LAYOUT.tableRowOdd : HELP_PAGE_LAYOUT.tableRowEven}
                >
                  <th scope="row" className={HELP_PAGE_LAYOUT.tableBodyCell}>
                    {identifier.label}
                  </th>
                  <td className={cn(HELP_PAGE_LAYOUT.tableBodyCell, "font-mono text-sm")}>
                    {identifier.value}
                    {identifier.isPlaceholder ? (
                      <span className="sr-only"> (placeholder — obtain live value from security review)</span>
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className={cn("m-0", OPERATOR_TYPOGRAPHY.cardTitle)}>{GCP_WIF_STARTER_SCRIPT_HEADING}</h3>
          <Button
            type="button"
            variant="outline"
            size="sm"
            data-testid="gcp-wif-starter-script-copy"
            aria-label="Copy gcloud pool-provider starter script"
            onClick={() => void copySetupScript()}
          >
            {copied ? "Copied" : "Copy starter script"}
          </Button>
        </div>
        <p className={cn("m-0 max-w-prose text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
          {GCP_WIF_STARTER_SCRIPT_INTRO}
        </p>
        <pre
          className={cn(
            "max-h-[min(40vh,360px)] overflow-auto rounded-md border border-neutral-200 bg-neutral-50 p-3 dark:border-neutral-800 dark:bg-neutral-950",
            OPERATOR_TYPOGRAPHY.micro,
            "leading-relaxed",
          )}
          data-testid="gcp-wif-starter-script-template"
        >
          <code>{setupScript}</code>
        </pre>
        <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
          {GCP_WIF_STARTER_SCRIPT_REPLACE_HINT}
        </p>
      </div>
    </div>
  );
}
