"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";

import { OPERATOR_BODY_INLINE_LINK_CLASS } from "@/lib/design-tokens";

import { HelpCopyableValue } from "@/components/help/HelpCopyableValue";
import { Card, CardContent } from "@/components/ui/card";
import {
  AZURE_CLOUD_CONNECTION_IDENTITY_MODEL,
  AZURE_CLOUD_CONNECTION_ROLE_ROWS,
} from "@/lib/azure-cloud-connection-permissions-manifest";
import { isAzureGuid } from "@/lib/azure-identifier-validation";
import { AZURE_PERMISSIONS_CONTEXT_MISSING } from "@/lib/azure-cloud-connection-permissions-copy";
import { OPERATOR_CARD, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

const SUGGESTED_PRINCIPAL_NAME = "archlucid-readonly-extractor";

function resolveReturnHref(returnTo: string | null): string {
  const trimmed = returnTo?.trim() ?? "";

  if (trimmed.startsWith("/integrations/cloud-connections")) {
    return trimmed;
  }

  return "/integrations/cloud-connections/azure";
}

export function HelpAzurePermissionsConnectionContext(): React.ReactElement {
  const searchParams = useSearchParams();
  const rawTenantId = searchParams.get("tenantId")?.trim() ?? "";
  const rawClientId = searchParams.get("clientId")?.trim() ?? "";
  const rawSubscriptionId = searchParams.get("subscriptionId")?.trim() ?? "";
  const tenantId = isAzureGuid(rawTenantId) ? rawTenantId : "";
  const clientId = isAzureGuid(rawClientId) ? rawClientId : "";
  const subscriptionId = isAzureGuid(rawSubscriptionId) ? rawSubscriptionId : "";
  const returnHref = resolveReturnHref(searchParams.get("returnTo"));
  const hasContext = tenantId.length > 0 || clientId.length > 0 || subscriptionId.length > 0;

  const requiredRoles = AZURE_CLOUD_CONNECTION_ROLE_ROWS.filter((row) => row.requirement === "required")
    .map((row) => row.azureRole)
    .join(", ");
  const optionalRoles = AZURE_CLOUD_CONNECTION_ROLE_ROWS.filter((row) => row.requirement !== "required")
    .map((row) => row.azureRole)
    .join(", ");

  return (
    <Card data-testid="azure-permissions-connection-context">
      <CardContent className={cn(OPERATOR_CARD.content, "space-y-4 pt-6")}>
        {!hasContext ? (
          <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
            {AZURE_PERMISSIONS_CONTEXT_MISSING}{" "}
            <Link href={returnHref} className={OPERATOR_BODY_INLINE_LINK_CLASS}>
              Open Azure connection setup
            </Link>
            .
          </p>
        ) : null}
        <HelpCopyableValue
          label="Enterprise application name (suggested)"
          value={SUGGESTED_PRINCIPAL_NAME}
          testId="azure-permissions-copy-principal-name"
        />
        {hasContext ? (
          <>
            <HelpCopyableValue label="Tenant ID" value={tenantId} testId="azure-permissions-copy-tenant-id" />
            <HelpCopyableValue
              label="Application (client) ID"
              value={clientId}
              testId="azure-permissions-copy-client-id"
            />
            <HelpCopyableValue
              label="Subscription ID"
              value={subscriptionId}
              testId="azure-permissions-copy-subscription-id"
            />
          </>
        ) : null}
        <HelpCopyableValue label="Required roles" value={requiredRoles} testId="azure-permissions-copy-required-roles" />
        <HelpCopyableValue
          label="Optional or conditional roles"
          value={optionalRoles}
          testId="azure-permissions-copy-optional-roles"
        />
        <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
          {AZURE_CLOUD_CONNECTION_IDENTITY_MODEL.assignmentTarget}
        </p>
      </CardContent>
    </Card>
  );
}
