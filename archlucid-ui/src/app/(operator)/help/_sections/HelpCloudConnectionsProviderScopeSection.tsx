import Link from "next/link";

import { HelpCloudConnectionsPackagingScriptsDisclosure } from "@/app/(operator)/help/_sections/HelpCloudConnectionsPackagingScriptsDisclosure";
import { Button } from "@/components/ui/button";
import {
  CLOUD_CONNECTIONS_HELP_CHOOSE_PLATFORM_TITLE,
  CLOUD_CONNECTIONS_HELP_PRIMARY_ACTIONS,
  CLOUD_CONNECTIONS_HELP_PROVIDER_SCOPE_ROWS,
  CLOUD_CONNECTIONS_HELP_TIER_1,
  CLOUD_CONNECTIONS_HELP_TIER_2,
} from "@/lib/cloud-connections-help-guide-content";
import {
  DESIGN_TOKENS,
  OPERATOR_LINK,
  OPERATOR_SHELL_SCROLL_OFFSET_CLASS,
  OPERATOR_TYPOGRAPHY,
} from "@/lib/design-tokens";
import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";
import { HELP_PAGE_LAYOUT } from "@/lib/help/help-page-layout";
import { cn } from "@/lib/utils";

function helpScrollableTableRegionLabel(sectionTitle: string, tableOrdinal: number): string {
  const base = sectionTitle.length > 0 ? sectionTitle : "Reference";

  return `Scrollable ${base} table ${tableOrdinal}`;
}

function TierCardEyebrow(props: { readonly children: string }): React.ReactElement {
  return (
    <p className={cn("m-0 uppercase tracking-wide text-al-text-secondary", OPERATOR_TYPOGRAPHY.label)}>
      {props.children}
    </p>
  );
}

/** Evidence tiers and provider permission scope for `/help/cloud-connections` (HCE). */
export function HelpCloudConnectionsProviderScopeSection(): React.ReactElement {
  const buyerPolishedShell = isBuyerPolishedOperatorShellEnv();

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

      <div className="mt-4 grid gap-4 sm:grid-cols-2" data-testid="help-cloud-connections-tier-decision">
        <div
          className={cn(DESIGN_TOKENS.surface.card, HELP_PAGE_LAYOUT.tierEmphasisPanel, "space-y-3 p-4")}
          data-testid="help-cloud-connections-tier-1-card"
        >
          <TierCardEyebrow>{CLOUD_CONNECTIONS_HELP_TIER_1.eyebrow}</TierCardEyebrow>
          <h3 className={cn("m-0", OPERATOR_TYPOGRAPHY.cardTitle)}>{CLOUD_CONNECTIONS_HELP_TIER_1.title}</h3>
          <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
            {CLOUD_CONNECTIONS_HELP_TIER_1.useWhen}
          </p>
          <HelpCloudConnectionsPackagingScriptsDisclosure />
          {buyerPolishedShell ? null : (
            <div className="flex flex-wrap items-center gap-2">
              <Button asChild size="sm" variant="primary" data-testid="help-cloud-connections-primary-cta">
                <Link href={CLOUD_CONNECTIONS_HELP_PRIMARY_ACTIONS.startEvidenceOnlyReview.href}>
                  {CLOUD_CONNECTIONS_HELP_PRIMARY_ACTIONS.startEvidenceOnlyReview.label}
                </Link>
              </Button>
            </div>
          )}
        </div>

        <div className={cn(DESIGN_TOKENS.surface.card, "space-y-3 p-4")} data-testid="help-cloud-connections-tier-2-card">
          <TierCardEyebrow>{CLOUD_CONNECTIONS_HELP_TIER_2.eyebrow}</TierCardEyebrow>
          <h3 className={cn("m-0", OPERATOR_TYPOGRAPHY.cardTitle)}>{CLOUD_CONNECTIONS_HELP_TIER_2.title}</h3>
          <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
            {CLOUD_CONNECTIONS_HELP_TIER_2.useWhen}
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <Button asChild size="sm" variant="outline">
              <Link href={CLOUD_CONNECTIONS_HELP_PRIMARY_ACTIONS.openHub.href}>
                {CLOUD_CONNECTIONS_HELP_PRIMARY_ACTIONS.openHub.label}
              </Link>
            </Button>
          </div>
        </div>
      </div>

      <div
        className={HELP_PAGE_LAYOUT.tableWrap}
        tabIndex={0}
        role="region"
        aria-label={helpScrollableTableRegionLabel(CLOUD_CONNECTIONS_HELP_CHOOSE_PLATFORM_TITLE, 1)}
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
                <th scope="row" className={HELP_PAGE_LAYOUT.tableBodyCell}>
                  {row.platform}
                </th>
                <td className={HELP_PAGE_LAYOUT.tableBodyCell}>{row.identityModel}</td>
                <td className={HELP_PAGE_LAYOUT.tableBodyCell}>{row.roleOrScope}</td>
                <td className={HELP_PAGE_LAYOUT.tableBodyCell}>{row.scopeUnit}</td>
                <td className={HELP_PAGE_LAYOUT.tableBodyCell}>
                  <Link
                    href={row.guideHref}
                    className={cn(OPERATOR_LINK.stepPill, "no-underline")}
                  >
                    {row.guideLabel}
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
