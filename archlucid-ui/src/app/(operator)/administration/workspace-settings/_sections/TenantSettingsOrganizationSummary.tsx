"use client";

import { cn } from "@/lib/utils";

import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { resolveTenantOrganizationDisplayName } from "@/lib/active-tenant-context-display";
import { TENANT_SETTINGS_ORGANIZATION_IDP_NOTE } from "@/lib/tenant-settings-page-copy";

type TenantSettingsOrganizationSummaryProps = {
  readonly tenantDisplayName: string;
  readonly tenantId?: string;
};

export function TenantSettingsOrganizationSummary(
  props: TenantSettingsOrganizationSummaryProps,
): React.JSX.Element {
  const organizationName = resolveTenantOrganizationDisplayName(
    props.tenantId ?? "",
    props.tenantDisplayName,
  );

  return (
    <dl className="m-0 grid gap-2" data-testid="tenant-settings-organization-summary">
      <div>
        <dt className={cn("font-medium text-al-text-primary", OPERATOR_TYPOGRAPHY.label)}>Organization</dt>
        <dd
          className={cn("m-0 mt-0.5 font-medium text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}
          data-testid="tenant-settings-tenant-display-name"
        >
          {organizationName}
        </dd>
      </div>
      <div>
        <dt className="sr-only">Identity provider note</dt>
        <dd className="m-0">{TENANT_SETTINGS_ORGANIZATION_IDP_NOTE}</dd>
      </div>
    </dl>
  );
}
