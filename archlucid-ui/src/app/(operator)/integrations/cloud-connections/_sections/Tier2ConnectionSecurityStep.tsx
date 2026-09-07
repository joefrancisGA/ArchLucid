"use client";

import Link from "next/link";

import { useProductLine } from "@/components/product-line/ProductLineProvider";
import { Button } from "@/components/ui/button";
import { FieldHelpTooltip } from "@/components/FieldHelpTooltip";
import { OPERATOR_BODY_INLINE_LINK_CLASS, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import {
  azureFederationIdentifierSourcingLead,
  AZURE_FEDERATION_IDENTIFIER_SOURCING_MID,
  AZURE_FEDERATION_IDENTIFIER_SOURCING_TAIL,
  AZURE_FEDERATION_IDENTIFIER_UNPUBLISHED_VALUE,
  AZURE_FEDERATION_SETUP_SCRIPT_UNAVAILABLE_LEAD,
  AZURE_FEDERATION_SETUP_SCRIPT_UNAVAILABLE_MID,
  AZURE_FEDERATION_SETUP_SCRIPT_UNAVAILABLE_TAIL,
} from "@/lib/azure-cloud-connection-federation-identity-source";
import { CONNECTION_STATUS_CANONICAL_PATH } from "@/lib/connection-status-evidence-copy";
import { productLineFederationIdentifiersHeading } from "@/lib/product-line/product-line-display-name";
import { cn } from "@/lib/utils";

import {
  tier2AzureSetupScriptReplaceHint,
  TIER2_WIZARD_HELP_HREFS,
} from "./tier2-connection-wizard-content";
import type { Tier2ConnectionWizardViewModel } from "./use-tier2-connection-wizard";

type Tier2ConnectionSecurityStepProps = Pick<
  Tier2ConnectionWizardViewModel,
  | "federationIdentifiers"
  | "setupScript"
  | "handleCopyIdentifier"
  | "handleCopyScript"
>;

export function Tier2ConnectionSecurityStep({
  federationIdentifiers,
  setupScript,
  handleCopyIdentifier,
  handleCopyScript,
}: Tier2ConnectionSecurityStepProps): React.ReactElement {
  const { productLine } = useProductLine();
  const federationIdentifiersHeading = productLineFederationIdentifiersHeading(productLine);
  const setupScriptReplaceHint = tier2AzureSetupScriptReplaceHint(productLine);
  const federationSourcingLead = azureFederationIdentifierSourcingLead(productLine);

  return (
    <section className="space-y-4" aria-labelledby="tier2-wizard-script-heading">
      <div>
        <h3 id="tier2-wizard-script-heading" className={OPERATOR_TYPOGRAPHY.cardTitle}>
          Provision the service principal
        </h3>
        <p className={cn("mt-1", OPERATOR_TYPOGRAPHY.helper)}>
          Run this Azure CLI script or deploy{" "}
          <Link href={TIER2_WIZARD_HELP_HREFS.connectAzureSecurely} className={OPERATOR_BODY_INLINE_LINK_CLASS}>
            Terraform / Bicep onboarding templates
          </Link>{" "}
          in your tenant. {setupScriptReplaceHint} See the{" "}
          <Link href={TIER2_WIZARD_HELP_HREFS.azurePermissions} className={OPERATOR_BODY_INLINE_LINK_CLASS}>
            Azure permissions guide
          </Link>{" "}
          for required roles and scopes.
        </p>
      </div>

      <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-4 dark:border-neutral-700 dark:bg-neutral-950/80">
        <p className={cn("m-0", OPERATOR_TYPOGRAPHY.cardTitle)}>{federationIdentifiersHeading}</p>
        <p
          className={cn("mt-2 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}
          data-testid="tier2-federation-identifiers-sourcing"
        >
          {federationSourcingLead}{" "}
          <Link href="/assurance-status" className={OPERATOR_BODY_INLINE_LINK_CLASS}>
            Assurance status
          </Link>{" "}
          {AZURE_FEDERATION_IDENTIFIER_SOURCING_MID}{" "}
          <Link href={CONNECTION_STATUS_CANONICAL_PATH} className={OPERATOR_BODY_INLINE_LINK_CLASS}>
            Connection status
          </Link>{" "}
          {AZURE_FEDERATION_IDENTIFIER_SOURCING_TAIL}
        </p>

        <dl className={cn("mt-3 space-y-3", OPERATOR_TYPOGRAPHY.body)} data-testid="tier2-federation-identifiers">
          {federationIdentifiers.map((identifier) => (
            <div key={identifier.id} className="flex flex-wrap items-center justify-between gap-2">
              <div className="min-w-0">
                <dt className="inline-flex items-center gap-1 text-muted-foreground">
                  <span>{identifier.label}</span>
                  <FieldHelpTooltip label={identifier.label} hint={identifier.hint} />
                </dt>
                <dd className="break-all font-mono text-sm">
                  {identifier.value.length > 0 ? identifier.value : AZURE_FEDERATION_IDENTIFIER_UNPUBLISHED_VALUE}
                </dd>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                data-testid={`tier2-copy-${identifier.id}`}
                disabled={identifier.value.trim().length === 0}
                onClick={() => void handleCopyIdentifier(identifier.value, identifier.label)}
              >
                Copy
              </Button>
            </div>
          ))}
        </dl>
      </div>

      <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-4 dark:border-neutral-700 dark:bg-neutral-950/80">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className={cn("m-0", OPERATOR_TYPOGRAPHY.cardTitle)}>Azure CLI setup script</p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            data-testid="tier2-setup-script-copy"
            disabled={setupScript === null}
            onClick={() => void handleCopyScript()}
          >
            Copy to clipboard
          </Button>
        </div>

        {setupScript === null ? (
          <p
            className={cn("mt-3 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}
            data-testid="tier2-setup-script-unavailable"
          >
            {AZURE_FEDERATION_SETUP_SCRIPT_UNAVAILABLE_LEAD}{" "}
            <Link href="/assurance-status" className={OPERATOR_BODY_INLINE_LINK_CLASS}>
              Assurance status
            </Link>{" "}
            {AZURE_FEDERATION_SETUP_SCRIPT_UNAVAILABLE_MID}{" "}
            <Link href={CONNECTION_STATUS_CANONICAL_PATH} className={OPERATOR_BODY_INLINE_LINK_CLASS}>
              Connection status
            </Link>{" "}
            {AZURE_FEDERATION_SETUP_SCRIPT_UNAVAILABLE_TAIL}
          </p>
        ) : (
          <pre
            tabIndex={0}
            role="region"
            aria-label="Azure CLI setup script"
            className={cn(
              "mt-3 max-h-[min(40vh,320px)] overflow-auto rounded-md border border-neutral-200 bg-white p-3 dark:border-neutral-700 dark:bg-neutral-900",
              OPERATOR_TYPOGRAPHY.micro,
              "leading-relaxed",
            )}
          >
            <code>{setupScript}</code>
          </pre>
        )}
      </div>
    </section>
  );
}
