import {
  AZURE_CLOUD_CONNECTION_ROLE_ROWS,
  formatAzurePermissionRequirementLabel,
} from "@/lib/azure-cloud-connection-permissions-manifest";
import {
  AZURE_PERMISSIONS_REQUIRED_ROLES_SUMMARY_HEADING,
  AZURE_PERMISSIONS_REQUIRED_ROLES_SUMMARY_INTRO,
} from "@/lib/azure-cloud-connection-permissions-copy";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { HELP_PAGE_LAYOUT } from "@/lib/help/help-page-layout";
import { cn } from "@/lib/utils";

/** Compact required-role list for `/help/azure-permissions` first viewport (TB-1627). */
export function HelpAzurePermissionsRequiredRolesSummary(): React.ReactElement {
  return (
    <section
      aria-labelledby="required-roles-summary"
      className="space-y-3"
      data-testid="azure-permissions-required-roles-summary"
    >
      <h2
        id="required-roles-summary"
        className={cn(OPERATOR_TYPOGRAPHY.sectionTitle, "m-0 scroll-mt-24")}
      >
        {AZURE_PERMISSIONS_REQUIRED_ROLES_SUMMARY_HEADING}
      </h2>
      <p className={cn("m-0 max-w-3xl text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
        {AZURE_PERMISSIONS_REQUIRED_ROLES_SUMMARY_INTRO}
      </p>
      <ul className={HELP_PAGE_LAYOUT.bulletList} data-testid="azure-permissions-required-roles-list">
        {AZURE_CLOUD_CONNECTION_ROLE_ROWS.map((row) => (
          <li key={row.azureRole}>
            <span className="font-medium text-al-text-primary">{row.azureRole}</span>
            <span className="text-al-text-secondary">
              {" "}
              — {formatAzurePermissionRequirementLabel(row.requirement)}: {row.purpose}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
