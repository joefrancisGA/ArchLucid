import {
  AZURE_CLOUD_CONNECTION_ROLE_ROWS,
  formatAzurePermissionRequirementLabel,
} from "@/lib/azure-cloud-connection-permissions-manifest";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { HELP_PAGE_LAYOUT } from "@/lib/help/help-page-layout";
import { cn } from "@/lib/utils";

type AzureCloudConnectionRolesTableProps = {
  readonly expandedDetails: boolean;
  readonly testId: string;
};

/** Shared Azure role matrix for cloud-connection help topics. */
export function AzureCloudConnectionRolesTable(props: AzureCloudConnectionRolesTableProps): React.ReactElement {
  return (
    <div className={HELP_PAGE_LAYOUT.tableWrap} data-testid={props.testId}>
      <table className={HELP_PAGE_LAYOUT.table}>
        <caption className="sr-only">Azure roles for cloud connections</caption>
        <thead>
          <tr>
            <th scope="col" className={HELP_PAGE_LAYOUT.tableHeadCell}>
              Azure role
            </th>
            <th scope="col" className={HELP_PAGE_LAYOUT.tableHeadCell}>
              Requirement
            </th>
            <th scope="col" className={HELP_PAGE_LAYOUT.tableHeadCell}>
              Purpose
            </th>
            <th scope="col" className={HELP_PAGE_LAYOUT.tableHeadCell}>
              Recommended scope
            </th>
            <th scope="col" className={HELP_PAGE_LAYOUT.tableHeadCell}>
              Write access
            </th>
          </tr>
        </thead>
        <tbody>
          {AZURE_CLOUD_CONNECTION_ROLE_ROWS.map((row, index) => (
            <tr
              key={row.azureRole}
              className={index % 2 === 0 ? HELP_PAGE_LAYOUT.tableRowOdd : HELP_PAGE_LAYOUT.tableRowEven}
            >
              <th scope="row" className={HELP_PAGE_LAYOUT.tableBodyCell}>
                {row.azureRole}
              </th>
              <td className={HELP_PAGE_LAYOUT.tableBodyCell}>
                <span className="font-semibold">{formatAzurePermissionRequirementLabel(row.requirement)}</span>
              </td>
              <td className={HELP_PAGE_LAYOUT.tableBodyCell}>{row.purpose}</td>
              <td className={HELP_PAGE_LAYOUT.tableBodyCell}>{row.recommendedScope}</td>
              <td className={HELP_PAGE_LAYOUT.tableBodyCell}>No</td>
            </tr>
          ))}
        </tbody>
      </table>
      {props.expandedDetails ? (
        <div className="space-y-3 border-t border-neutral-200 p-4 dark:border-neutral-800">
          {AZURE_CLOUD_CONNECTION_ROLE_ROWS.map((row) => (
            <details key={`${row.azureRole}-details`} className={HELP_PAGE_LAYOUT.details}>
              <summary className="cursor-pointer font-medium">
                {row.azureRole} — {formatAzurePermissionRequirementLabel(row.requirement)}
              </summary>
              <div className={HELP_PAGE_LAYOUT.detailsBody}>
                <p className={cn("m-0", OPERATOR_TYPOGRAPHY.body)}>{row.expandedDetails}</p>
                <p className={cn("m-0 mt-2 font-medium", OPERATOR_TYPOGRAPHY.label)}>Capabilities enabled</p>
                <ul className={HELP_PAGE_LAYOUT.bulletList}>
                  {row.enabledCapabilities.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
                <p className={cn("m-0 font-medium", OPERATOR_TYPOGRAPHY.label)}>Data categories</p>
                <ul className={HELP_PAGE_LAYOUT.bulletList}>
                  {row.dataCategories.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
                <p className={cn("m-0 font-medium", OPERATOR_TYPOGRAPHY.label)}>Supported assignment scopes</p>
                <ul className={HELP_PAGE_LAYOUT.bulletList}>
                  {row.supportedScopes.map((item) => (
                    <li key={item}>
                      <code className="break-all">{item}</code>
                    </li>
                  ))}
                </ul>
                {row.omittedImpact !== null ? (
                  <p className={cn("m-0 mt-2 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>{row.omittedImpact}</p>
                ) : null}
              </div>
            </details>
          ))}
        </div>
      ) : null}
    </div>
  );
}
