import Link from "next/link";

import { HelpCenterDocumentationBadge } from "@/components/help/HelpCenterDocumentationBadge";
import {
  CLOUD_CONNECTIONS_HELP_CHOOSE_PLATFORM_TITLE,
  CLOUD_CONNECTIONS_HELP_PROVIDER_SCOPE_ROWS,
  CLOUD_CONNECTIONS_HELP_TIER_1_DEFINITION,
  CLOUD_CONNECTIONS_HELP_TIER_2_DEFINITION,
} from "@/lib/cloud-connections-help-guide-content";
import { OPERATOR_LINK, OPERATOR_SHELL_SCROLL_OFFSET_CLASS, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { HELP_PAGE_LAYOUT } from "@/lib/help-page-layout";
import { cn } from "@/lib/utils";

/** Evidence tiers and provider permission scope for `/help/cloud-connections` (HCE). */
export function HelpCloudConnectionsProviderScopeSection(): React.ReactElement {
  return (
    <section
      id="choose-your-cloud-platform"
      aria-labelledby="help-cloud-connections-choose-platform-heading"
      data-testid="help-cloud-connections-provider-scope"
    >
      <h2
        id="help-cloud-connections-choose-platform-heading"
        className={cn(
          OPERATOR_SHELL_SCROLL_OFFSET_CLASS,
          "m-0 scroll-mt-24",
          OPERATOR_TYPOGRAPHY.sectionTitle,
        )}
      >
        {CLOUD_CONNECTIONS_HELP_CHOOSE_PLATFORM_TITLE}
      </h2>
      <div className="mt-3 space-y-3">
        <p className={cn("m-0 max-w-3xl text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
          {CLOUD_CONNECTIONS_HELP_TIER_1_DEFINITION}
        </p>
        <p className={cn("m-0 max-w-3xl text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
          {CLOUD_CONNECTIONS_HELP_TIER_2_DEFINITION}
        </p>
      </div>
      <div
        className={HELP_PAGE_LAYOUT.tableWrap}
        data-testid="help-cloud-connections-provider-scope-table"
      >
        <table className={HELP_PAGE_LAYOUT.table}>
          <caption className="sr-only">Cloud platform connection scope comparison</caption>
          <thead>
            <tr>
              <th scope="col" className={HELP_PAGE_LAYOUT.tableHeadCell}>Platform</th>
              <th scope="col" className={HELP_PAGE_LAYOUT.tableHeadCell}>Identity model</th>
              <th scope="col" className={HELP_PAGE_LAYOUT.tableHeadCell}>Read-only role / scope</th>
              <th scope="col" className={HELP_PAGE_LAYOUT.tableHeadCell}>Scope unit</th>
              <th scope="col" className={HELP_PAGE_LAYOUT.tableHeadCell}>Setup guide</th>
            </tr>
          </thead>
          <tbody>
            {CLOUD_CONNECTIONS_HELP_PROVIDER_SCOPE_ROWS.map((row, index) => (
              <tr
                key={row.platform}
                className={index % 2 === 0 ? HELP_PAGE_LAYOUT.tableRowOdd : HELP_PAGE_LAYOUT.tableRowEven}
              >
                <td className={HELP_PAGE_LAYOUT.tableBodyCell}>{row.platform}</td>
                <td className={HELP_PAGE_LAYOUT.tableBodyCell}>{row.identityModel}</td>
                <td className={HELP_PAGE_LAYOUT.tableBodyCell}>{row.roleOrScope}</td>
                <td className={HELP_PAGE_LAYOUT.tableBodyCell}>{row.scopeUnit}</td>
                <td className={HELP_PAGE_LAYOUT.tableBodyCell}>
                  <span className="inline-flex flex-wrap items-center gap-2">
                    <HelpCenterDocumentationBadge />
                    <Link href={row.guideHref} className={cn(OPERATOR_LINK.inline, "font-medium")}>
                      {row.guideLabel}
                    </Link>
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
