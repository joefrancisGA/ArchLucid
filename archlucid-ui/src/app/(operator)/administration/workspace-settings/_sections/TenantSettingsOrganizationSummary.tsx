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
          <span className={cn("mt-1 block font-normal text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
            {TENANT_SETTINGS_ORGANIZATION_IDP_NOTE}
          </span>
        </dd>
      </div>
    </dl>
  );
}
