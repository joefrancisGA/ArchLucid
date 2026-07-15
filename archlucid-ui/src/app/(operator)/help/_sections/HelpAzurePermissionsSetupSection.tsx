"use client";

import { useCallback, useMemo, useState } from "react";

import { buildTier2AzureSetupScript } from "@/app/(operator)/integrations/cloud-connections/_sections/tier2-connection-wizard-content";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AZURE_CLOUD_CONNECTION_IDENTITY_MODEL,
  AZURE_CLOUD_CONNECTION_ROLE_ROWS,
} from "@/lib/azure-cloud-connection-permissions-manifest";
import {
  AZURE_PERMISSIONS_CLI_TAB,
  AZURE_PERMISSIONS_PORTAL_TAB,
  AZURE_PERMISSIONS_SETUP_HEADING,
} from "@/lib/azure-cloud-connection-permissions-copy";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

const AZURE_PERMISSIONS_PORTAL_STEPS: readonly string[] = [
  "Open the subscription or supported resource scope in the Azure portal.",
  "Open Access control (IAM).",
  "Select Add role assignment.",
  "Choose the verified built-in role.",
  `Assign it to the ${AZURE_CLOUD_CONNECTION_IDENTITY_MODEL.customerPrincipalLabel.toLowerCase()} for your ArchLucid read-only application.`,
  "Repeat for any conditional role (for example, Cost Management Reader when cost analysis is enabled).",
  "Return to ArchLucid and verify the connection.",
];

type HelpAzurePermissionsSetupSectionProps = {
  readonly subscriptionId?: string;
};

export function HelpAzurePermissionsSetupSection(props: HelpAzurePermissionsSetupSectionProps): React.ReactElement {
  const [copied, setCopied] = useState(false);
  const subscriptionPlaceholder =
    props.subscriptionId !== undefined && props.subscriptionId.trim().length > 0
      ? props.subscriptionId.trim()
      : "YOUR_SUBSCRIPTION_ID";
  const setupScript = useMemo(() => buildTier2AzureSetupScript(subscriptionPlaceholder), [subscriptionPlaceholder]);
  const roleNames = AZURE_CLOUD_CONNECTION_ROLE_ROWS.map((row) => row.azureRole).join(" and ");

  const copyScript = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(setupScript);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }, [setupScript]);

  return (
    <section className="space-y-3" aria-labelledby="azure-permissions-setup-heading" data-testid="azure-permissions-setup-section">
      <h2 id="azure-permissions-setup-heading" className={cn("m-0", OPERATOR_TYPOGRAPHY.sectionTitle)}>
        {AZURE_PERMISSIONS_SETUP_HEADING}
      </h2>
      <p className={cn("m-0 max-w-prose text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
        Assign {roleNames} using the Azure portal or Azure CLI. {AZURE_CLOUD_CONNECTION_IDENTITY_MODEL.federation}
      </p>
      <Tabs defaultValue="portal" data-testid="azure-permissions-setup-tabs">
        <TabsList aria-label="Azure permissions setup methods">
          <TabsTrigger value="portal">{AZURE_PERMISSIONS_PORTAL_TAB}</TabsTrigger>
          <TabsTrigger value="cli">{AZURE_PERMISSIONS_CLI_TAB}</TabsTrigger>
        </TabsList>
        <TabsContent value="portal" className="space-y-3">
          <ol className={cn("m-0 list-decimal space-y-2 pl-5 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
            {AZURE_PERMISSIONS_PORTAL_STEPS.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
        </TabsContent>
        <TabsContent value="cli" className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className={cn("m-0", OPERATOR_TYPOGRAPHY.cardTitle)}>Azure CLI template</p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              data-testid="azure-permissions-cli-copy"
              aria-label="Copy Azure CLI setup script"
              onClick={() => void copyScript()}
            >
              {copied ? "Copied" : "Copy command"}
            </Button>
          </div>
          <pre
            className={cn(
              "max-h-[min(40vh,360px)] overflow-auto rounded-md border border-neutral-200 bg-neutral-50 p-3 dark:border-neutral-800 dark:bg-neutral-950",
              OPERATOR_TYPOGRAPHY.micro,
              "leading-relaxed",
            )}
          >
            <code>{setupScript}</code>
          </pre>
          <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
            Replace YOUR_SUBSCRIPTION_ID, ARCHLUCID_TENANT_ID, and ARCHLUCID_MANAGED_IDENTITY_OBJECT_ID before running.
            ArchLucid publishes tenant and managed-identity identifiers during onboarding.
          </p>
        </TabsContent>
      </Tabs>
    </section>
  );
}
