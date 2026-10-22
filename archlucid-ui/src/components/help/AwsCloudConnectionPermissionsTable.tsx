import { CloudConnectionPermissionRequirementStatusCell } from "@/components/help/CloudConnectionPermissionRequirementStatusCell";
import {
  AWS_CLOUD_CONNECTION_PERMISSION_ROWS,
} from "@/lib/aws-cloud-connection-permissions-manifest";
import { HELP_PAGE_LAYOUT } from "@/lib/help/help-page-layout";

/** IAM permission matrix for AWS cloud-connection help topics. */
export function AwsCloudConnectionPermissionsTable(): React.ReactElement {
  return (
    <div className={HELP_PAGE_LAYOUT.tableWrap} data-testid="connect-aws-securely-permissions-table">
      <table className={HELP_PAGE_LAYOUT.table}>
        <caption className="sr-only">IAM permissions for AWS cloud connections</caption>
        <thead>
          <tr>
            <th scope="col" className={HELP_PAGE_LAYOUT.tableHeadCell}>
              IAM identifier
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
          </tr>
        </thead>
        <tbody>
          {AWS_CLOUD_CONNECTION_PERMISSION_ROWS.map((row, index) => (
            <tr
              key={row.iamIdentifier}
              className={index % 2 === 0 ? HELP_PAGE_LAYOUT.tableRowOdd : HELP_PAGE_LAYOUT.tableRowEven}
            >
              <th scope="row" className={HELP_PAGE_LAYOUT.tableBodyCell}>
                {row.displayName !== undefined ? (
                  <>
                    {row.displayName}{" "}
                    <code className="font-mono text-sm">{row.iamIdentifier}</code>
                  </>
                ) : (
                  <code className="font-mono text-sm">{row.iamIdentifier}</code>
                )}
              </th>
              <td className={HELP_PAGE_LAYOUT.tableBodyCell}>
                <CloudConnectionPermissionRequirementStatusCell requirement={row.requirement} />
              </td>
              <td className={HELP_PAGE_LAYOUT.tableBodyCell}>{row.purpose}</td>
              <td className={HELP_PAGE_LAYOUT.tableBodyCell}>{row.recommendedScope}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
