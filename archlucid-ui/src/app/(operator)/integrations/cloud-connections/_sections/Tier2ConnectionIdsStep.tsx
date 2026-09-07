"use client";

import { FormFieldLabelWithHelp } from "@/components/FormFieldLabelWithHelp";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useLocalizedProductCopy } from "@/hooks/use-localized-product-copy";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import {
  AZURE_CONNECTION_CLIENT_APP_ID_HINT,
  AZURE_CONNECTION_CLIENT_APP_ID_LABEL,
  azureConnectionIdsStepLead,
  azureConnectionTenantIdHint,
  AZURE_CONNECTION_SUBSCRIPTION_IDS_HINT,
  AZURE_CONNECTION_SUBSCRIPTION_IDS_LABEL,
  AZURE_CONNECTION_TENANT_ID_LABEL,
} from "@/lib/azure-cloud-connection-copy";
import { cn } from "@/lib/utils";

import type { Tier2ConnectionWizardViewModel } from "./use-tier2-connection-wizard";

type Tier2ConnectionIdsStepProps = Pick<
  Tier2ConnectionWizardViewModel,
  | "tenantId"
  | "setTenantId"
  | "clientId"
  | "setClientId"
  | "subscriptionIds"
  | "setSubscriptionIds"
  | "displayFieldErrors"
  | "clearFieldError"
>;

export function Tier2ConnectionIdsStep({
  tenantId,
  setTenantId,
  clientId,
  setClientId,
  subscriptionIds,
  setSubscriptionIds,
  displayFieldErrors,
  clearFieldError,
}: Tier2ConnectionIdsStepProps): React.ReactElement {
  const { productLine } = useLocalizedProductCopy();
  const idsStepLead = azureConnectionIdsStepLead(productLine);
  const tenantIdHint = azureConnectionTenantIdHint(productLine);

  return (
    <section className="space-y-4" aria-labelledby="tier2-wizard-ids-heading">
      <div>
        <h3 id="tier2-wizard-ids-heading" className={OPERATOR_TYPOGRAPHY.cardTitle}>
          Enter connection identifiers
        </h3>
        <p className={cn("mt-1", OPERATOR_TYPOGRAPHY.helper)}>{idsStepLead}</p>
      </div>

      <div className="space-y-4 max-w-xl">
        <div className="space-y-2">
          <FormFieldLabelWithHelp
            htmlFor="tier2TenantId"
            label={AZURE_CONNECTION_TENANT_ID_LABEL}
            hint={tenantIdHint}
          />
          <Input
            id="tier2TenantId"
            data-testid="tier2-tenant-id"
            value={tenantId}
            onChange={(event) => {
              setTenantId(event.target.value);
              clearFieldError("tenantId");
            }}
            placeholder="e.g. 00000000-0000-0000-0000-000000000000"
            aria-invalid={displayFieldErrors.tenantId ? true : undefined}
          />

          {displayFieldErrors.tenantId ? (
            <p className={cn(OPERATOR_TYPOGRAPHY.body, "text-red-600 dark:text-red-400")} role="alert">
              {displayFieldErrors.tenantId}
            </p>
          ) : null}
        </div>

        <div className="space-y-2">
          <FormFieldLabelWithHelp
            htmlFor="tier2ClientId"
            label={AZURE_CONNECTION_CLIENT_APP_ID_LABEL}
            hint={AZURE_CONNECTION_CLIENT_APP_ID_HINT}
          />
          <Input
            id="tier2ClientId"
            data-testid="tier2-client-id"
            value={clientId}
            onChange={(event) => {
              setClientId(event.target.value);
              clearFieldError("clientId");
            }}
            placeholder="e.g. 00000000-0000-0000-0000-000000000000"
            aria-invalid={displayFieldErrors.clientId ? true : undefined}
          />

          {displayFieldErrors.clientId ? (
            <p className={cn(OPERATOR_TYPOGRAPHY.body, "text-red-600 dark:text-red-400")} role="alert">
              {displayFieldErrors.clientId}
            </p>
          ) : null}
        </div>

        <div className="space-y-2">
          <FormFieldLabelWithHelp
            htmlFor="tier2SubscriptionIds"
            label={AZURE_CONNECTION_SUBSCRIPTION_IDS_LABEL}
            hint={AZURE_CONNECTION_SUBSCRIPTION_IDS_HINT}
          />
          <Textarea
            id="tier2SubscriptionIds"
            data-testid="tier2-subscription-ids"
            value={subscriptionIds}
            onChange={(event) => {
              setSubscriptionIds(event.target.value);
              clearFieldError("subscriptionIds");
            }}
            placeholder="Comma-separated subscription GUIDs"
            aria-invalid={displayFieldErrors.subscriptionIds ? true : undefined}
          />

          {displayFieldErrors.subscriptionIds ? (
            <p className={cn(OPERATOR_TYPOGRAPHY.body, "text-red-600 dark:text-red-400")} role="alert">
              {displayFieldErrors.subscriptionIds}
            </p>
          ) : null}
        </div>
      </div>
    </section>
  );
}
