"use client";

import Link from "next/link";

import {
  EnterpriseTable,
  EnterpriseTableBody,
  EnterpriseTableCell,
  EnterpriseTableHead,
  EnterpriseTableHeaderCell,
  EnterpriseTableRow,
} from "@/components/ui/enterprise-table";
import { OperatorPageContainer } from "@/components/operator/OperatorPageContainer";
import { OperatorPageHeader } from "@/components/operator/OperatorPageHeader";
import { Button } from "@/components/ui/button";
import { StatusTag } from "@/components/ui/status-tag";
import { PageContextualHelpButton } from "@/components/usability/PageContextualHelpButton";
import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";
import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import {
  GOVERNANCE_INFRASTRUCTURE_OVERVIEW_PAGE_LEAD,
  GOVERNANCE_INFRASTRUCTURE_OVERVIEW_PAGE_TITLE,
  GOVERNANCE_INFRASTRUCTURE_OVERVIEW_PRIMARY_CONTENT_ID,
  GOVERNANCE_INFRASTRUCTURE_OVERVIEW_SKIP_LINK_LABEL,
  GOVERNANCE_INFRASTRUCTURE_OVERVIEW_START_HERE_ACTION,
  GOVERNANCE_INFRASTRUCTURE_OVERVIEW_START_HERE_BADGE,
  GOVERNANCE_INFRASTRUCTURE_OVERVIEW_START_HERE_BODY,
  GOVERNANCE_INFRASTRUCTURE_OVERVIEW_START_HERE_TITLE,
  GOVERNANCE_INFRASTRUCTURE_OVERVIEW_WORKBENCHES_HEADING,
  INFRASTRUCTURE_WORKBENCH_ROWS,
} from "@/lib/governance/governance-infrastructure-copy";
import { GOVERNANCE_INFRASTRUCTURE_OVERVIEW_CLAIM_DISCIPLINE } from "@/lib/governance/governance-infrastructure-evidence-copy";
import { GOVERNANCE_INFRASTRUCTURE_PATH, GOVERNANCE_INFRASTRUCTURE_RESOURCES_PATH } from "@/lib/governance/governance-infrastructure-route-paths";
import { HELP_PAGE_LAYOUT } from "@/lib/help/help-page-layout";
import { cn } from "@/lib/utils";

import { SecureNowComplianceHomeSection } from "@/components/product-line/SecureNowComplianceHomeSection";
import { SecureNowInfrastructureHomeSection } from "@/components/product-line/SecureNowInfrastructureHomeSection";
import { SecureNowSecurityHomeSection } from "@/components/product-line/SecureNowSecurityHomeSection";
import { useProductLine } from "@/components/product-line/ProductLineProvider";

import { InfrastructureOverviewBreadcrumb } from "./InfrastructureOverviewBreadcrumb";
import { InfrastructureOverviewClaimOrientationStrip } from "./InfrastructureOverviewClaimOrientationStrip";

/** Infrastructure overview hub — lists all infrastructure evidence workbench destinations. */
export function InfrastructureOverviewClient() {
  const buyerPolishedShell = isBuyerPolishedOperatorShellEnv();
  const { productLine } = useProductLine();
  const showSecureNowGroupedHomeSections = productLine === "security";

  return (
    <OperatorPageContainer
      variant="full"
      className="py-4"
      data-testid="governance-infrastructure-overview-page"
    >
      {buyerPolishedShell ? (
        <a
          href={`#${GOVERNANCE_INFRASTRUCTURE_OVERVIEW_PRIMARY_CONTENT_ID}`}
          className={HELP_PAGE_LAYOUT.technicalReferenceSkipLink}
        >
          {GOVERNANCE_INFRASTRUCTURE_OVERVIEW_SKIP_LINK_LABEL}
        </a>
      ) : null}

      <OperatorPageHeader
        navHref={GOVERNANCE_INFRASTRUCTURE_PATH}
        title={GOVERNANCE_INFRASTRUCTURE_OVERVIEW_PAGE_TITLE}
        subtitle={GOVERNANCE_INFRASTRUCTURE_OVERVIEW_PAGE_LEAD}
        claimDiscipline={buyerPolishedShell ? GOVERNANCE_INFRASTRUCTURE_OVERVIEW_CLAIM_DISCIPLINE : undefined}
        claimDisciplineTestId="governance-infrastructure-overview-claim-discipline"
        titleTestId="governance-infrastructure-overview-page-title"
        breadcrumb={buyerPolishedShell ? <InfrastructureOverviewBreadcrumb /> : undefined}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <PageContextualHelpButton />
          </div>
        }
      />

      <main
        id={buyerPolishedShell ? GOVERNANCE_INFRASTRUCTURE_OVERVIEW_PRIMARY_CONTENT_ID : undefined}
        className={cn("min-w-0 space-y-4", buyerPolishedShell ? "scroll-mt-24" : undefined)}
        data-testid="governance-infrastructure-overview-primary-content"
      >
        {buyerPolishedShell ? (
          <section
            aria-labelledby="governance-infrastructure-start-here-heading"
            className="max-w-2xl rounded-md border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-950"
            data-testid="governance-infrastructure-start-here-panel"
          >
            <div className="flex flex-wrap items-center gap-2">
              <h2
                id="governance-infrastructure-start-here-heading"
                className={cn("m-0", OPERATOR_TYPOGRAPHY.cardTitle)}
              >
                {GOVERNANCE_INFRASTRUCTURE_OVERVIEW_START_HERE_TITLE}
              </h2>
              <StatusTag kind="ready" label={GOVERNANCE_INFRASTRUCTURE_OVERVIEW_START_HERE_BADGE} />
            </div>
            <p className={cn("m-0 mt-2 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
              {GOVERNANCE_INFRASTRUCTURE_OVERVIEW_START_HERE_BODY}
            </p>
            <div className="mt-3">
              <Button variant="primary" size="sm" asChild>
                <Link
                  href={GOVERNANCE_INFRASTRUCTURE_RESOURCES_PATH}
                  data-testid="governance-infrastructure-start-here-link"
                >
                  {GOVERNANCE_INFRASTRUCTURE_OVERVIEW_START_HERE_ACTION}
                </Link>
              </Button>
            </div>
          </section>
        ) : (
          <p className={cn("m-0 text-neutral-700 dark:text-neutral-300", OPERATOR_TYPOGRAPHY.body)}>
            Azure inventory evidence workbenches for snapshots, diagrams, resource hubs, grounded Ask, and remediation
            instances. All six destinations are available from this hub.
            {showSecureNowGroupedHomeSections
              ? " Security, compliance, and infrastructure destinations are grouped below."
              : null}
          </p>
        )}

        {showSecureNowGroupedHomeSections ? (
          <div className="mt-6 space-y-4" data-testid="securenow-grouped-home-sections">
            <SecureNowSecurityHomeSection />
            <SecureNowComplianceHomeSection />
            <SecureNowInfrastructureHomeSection />
          </div>
        ) : (
          <section aria-labelledby="governance-infrastructure-workbenches-heading">
            <h2
              id="governance-infrastructure-workbenches-heading"
              className={cn("m-0", buyerPolishedShell ? OPERATOR_TYPOGRAPHY.cardTitle : "sr-only")}
            >
              {GOVERNANCE_INFRASTRUCTURE_OVERVIEW_WORKBENCHES_HEADING}
            </h2>
            <EnterpriseTable
              ariaLabel="Infrastructure evidence workbenches"
              className={buyerPolishedShell ? "mt-3" : undefined}
            >
              <EnterpriseTableHead>
                <EnterpriseTableRow>
                  <EnterpriseTableHeaderCell>Workbench</EnterpriseTableHeaderCell>
                  <EnterpriseTableHeaderCell>Summary</EnterpriseTableHeaderCell>
                  {buyerPolishedShell ? <EnterpriseTableHeaderCell>Open</EnterpriseTableHeaderCell> : null}
                </EnterpriseTableRow>
              </EnterpriseTableHead>
              <EnterpriseTableBody>
                {INFRASTRUCTURE_WORKBENCH_ROWS.map((row) => (
                  <EnterpriseTableRow key={row.href}>
                    <EnterpriseTableCell>
                      <div className="flex flex-wrap items-center gap-2">
                        <Link
                          className={cn("font-medium", OPERATOR_LINK.inline)}
                          href={row.href}
                          data-testid={`governance-infrastructure-workbench-link-${row.href}`}
                        >
                          {row.label}
                        </Link>
                        {buyerPolishedShell && row.recommendedFirst === true ? (
                          <StatusTag kind="neutral" label={GOVERNANCE_INFRASTRUCTURE_OVERVIEW_START_HERE_BADGE} />
                        ) : null}
                      </div>
                    </EnterpriseTableCell>
                    <EnterpriseTableCell>{row.summary}</EnterpriseTableCell>
                    {buyerPolishedShell ? (
                      <EnterpriseTableCell>
                        <Link className={OPERATOR_LINK.inline} href={row.href}>
                          Open
                        </Link>
                      </EnterpriseTableCell>
                    ) : null}
                  </EnterpriseTableRow>
                ))}
              </EnterpriseTableBody>
            </EnterpriseTable>
          </section>
        )}

        {buyerPolishedShell ? <InfrastructureOverviewClaimOrientationStrip /> : null}
      </main>
    </OperatorPageContainer>
  );
}

export { GOVERNANCE_INFRASTRUCTURE_OVERVIEW_PAGE_TITLE };
