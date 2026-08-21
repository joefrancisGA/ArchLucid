"use client";

import { useCallback, useMemo, useState } from "react";

import { CopyIdButton } from "@/components/CopyIdButton";
import { FieldHelpTooltip } from "@/components/FieldHelpTooltip";
import { Button } from "@/components/ui/button";
import { StatusTag } from "@/components/ui/status-tag";
import {
  EnterpriseTable,
  EnterpriseTableBody,
  EnterpriseTableCell,
  EnterpriseTableHead,
  EnterpriseTableHeaderCell,
  EnterpriseTableRow,
} from "@/components/ui/enterprise-table";
import { readAzureHostedFederationConfig } from "@/lib/azure-cloud-connection-federation-config";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import {
  buildGcpWifStarterFederationIdentifiers,
  buildGcpWorkloadIdentityPoolProviderSetupScript,
  GCP_WIF_STARTER_FEDERATION_HEADING,
  GCP_WIF_STARTER_FEDERATION_INTRO,
  GCP_WIF_STARTER_SCRIPT_HEADING,
  GCP_WIF_STARTER_SCRIPT_INTRO,
  GCP_WIF_STARTER_SCRIPT_REPLACE_HINT,
} from "@/lib/gcp-cloud-connection-wif-starter";
import { cn } from "@/lib/utils";

/** Federation identifiers and copyable gcloud starter for GCP identity setup (TB-1775). */
export function GcpWifStarterPanel(): React.ReactElement {
  const [copied, setCopied] = useState(false);
  const federationConfig = useMemo(() => readAzureHostedFederationConfig(), []);
  const federationIdentifiers = useMemo(
    () => buildGcpWifStarterFederationIdentifiers(federationConfig),
    [federationConfig],
  );
  const setupScript = useMemo(
    () => buildGcpWorkloadIdentityPoolProviderSetupScript(undefined, federationConfig),
    [federationConfig],
  );

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
        <EnterpriseTable
          ariaLabel="OIDC federation identifiers for GCP Workload Identity Pool providers"
          data-testid="gcp-wif-starter-federation-identifiers"
        >
          <EnterpriseTableHead>
            <EnterpriseTableRow>
              <EnterpriseTableHeaderCell>Field</EnterpriseTableHeaderCell>
              <EnterpriseTableHeaderCell>Value</EnterpriseTableHeaderCell>
            </EnterpriseTableRow>
          </EnterpriseTableHead>
          <EnterpriseTableBody>
            {federationIdentifiers.map((identifier) => (
              <EnterpriseTableRow key={identifier.id} data-testid={`gcp-wif-starter-identifier-${identifier.id}`}>
                <EnterpriseTableCell>
                  <span className="inline-flex items-center gap-1">
                    <span>{identifier.label}</span>
                    <FieldHelpTooltip label={identifier.label} hint={identifier.hint} />
                  </span>
                </EnterpriseTableCell>
                <EnterpriseTableCell>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={cn("font-mono text-sm", identifier.isPlaceholder ? "text-al-text-secondary" : undefined)}>
                      {identifier.value}
                    </span>
                    {identifier.isPlaceholder ? (
                      <StatusTag
                        kind="needs-attention"
                        label="Not published"
                        data-testid={`gcp-wif-starter-unresolved-${identifier.id}`}
                      />
                    ) : (
                      <CopyIdButton
                        value={identifier.value}
                        aria-label={`Copy ${identifier.label}`}
                      />
                    )}
                  </div>
                </EnterpriseTableCell>
              </EnterpriseTableRow>
            ))}
          </EnterpriseTableBody>
        </EnterpriseTable>
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
