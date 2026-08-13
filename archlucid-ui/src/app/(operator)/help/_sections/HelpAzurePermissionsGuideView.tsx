import Link from "next/link";

import { Suspense } from "react";

import { AzureCloudConnectionRolesTable } from "@/components/help/AzureCloudConnectionRolesTable";
import { AzurePermissionsHelpEvidenceOrientationStrip } from "@/components/help/AzurePermissionsHelpEvidenceOrientationStrip";
import { HelpTopicTitleRow } from "@/components/help/HelpTopicPageHeader";
import { HelpTopicRegistryProvenanceLine } from "@/components/help/HelpTopicRegistryProvenanceLine";
import { HelpTopicHashScroll } from "@/app/(operator)/help/HelpTopicHashScroll";
import { HelpAzurePermissionsHeaderActions } from "@/app/(operator)/help/_sections/HelpAzurePermissionsHeaderActions";
import { HelpAzurePermissionsConnectionContext } from "@/app/(operator)/help/_sections/HelpAzurePermissionsConnectionContext";
import { HelpAzurePermissionsRequiredRolesSummary } from "@/app/(operator)/help/_sections/HelpAzurePermissionsRequiredRolesSummary";
import { HelpAzurePermissionsSetupSection } from "@/app/(operator)/help/_sections/HelpAzurePermissionsSetupSection";
import { HelpAzurePermissionsVerificationPanel } from "@/app/(operator)/help/_sections/HelpAzurePermissionsVerificationPanel";
import { HelpTopicTableOfContents } from "@/components/help/HelpTopicTableOfContents";
import { CollapsibleSection } from "@/components/CollapsibleSection";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AZURE_CLOUD_CONNECTION_CANNOT_DO,
  AZURE_CLOUD_CONNECTION_CUSTOM_ROLE_READ_ACTIONS,
  AZURE_CLOUD_CONNECTION_DATA_COLLECTED,
  AZURE_CLOUD_CONNECTION_DATA_NOT_COLLECTED,
  AZURE_CLOUD_CONNECTION_FORBIDDEN_ROLES,
  AZURE_CLOUD_CONNECTION_PERMISSIONS_CONTRACT_VERSION,
  AZURE_CLOUD_CONNECTION_RELATED_HELP,
  AZURE_CLOUD_CONNECTION_SCOPE_GUIDANCE,
  AZURE_CLOUD_CONNECTION_TROUBLESHOOTING_ITEMS,
  formatAzurePermissionRequirementLabel,
} from "@/lib/azure-cloud-connection-permissions-manifest";
import {
  AZURE_PERMISSIONS_BACK_TO_CONNECTIONS,
  AZURE_PERMISSIONS_CANNOT_DO_HEADING,
  AZURE_PERMISSIONS_CANNOT_DO_INTRO,
  AZURE_PERMISSIONS_COLLECTED_HEADING,
  AZURE_PERMISSIONS_CONNECTION_CONTEXT_HEADING,
  AZURE_PERMISSIONS_COST_OPTIONAL_NOTE,
  AZURE_PERMISSIONS_CUSTOM_ROLE_HEADING,
  AZURE_PERMISSIONS_CUSTOM_ROLE_INTRO,
  AZURE_PERMISSIONS_CUSTOM_ROLE_DISCLOSURE_SUMMARY,
  AZURE_PERMISSIONS_MATRIX_DISCLOSURE_SUMMARY,
  AZURE_PERMISSIONS_MATRIX_HEADING,
  AZURE_PERMISSIONS_OTHER_PROVIDERS_HEADING,
  AZURE_PERMISSIONS_PAGE_SUBTITLE,
  AZURE_PERMISSIONS_PAGE_TITLE,
  AZURE_PERMISSIONS_READ_ONLY_HEADING,
  AZURE_PERMISSIONS_READ_ONLY_INTRO,
  AZURE_PERMISSIONS_SCOPE_HEADING,
  AZURE_PERMISSIONS_TRUST_NO_DEPLOY,
  AZURE_PERMISSIONS_TRUST_NO_MODIFY,
  AZURE_PERMISSIONS_TRUST_NO_ROLE_ASSIGN,
  AZURE_PERMISSIONS_TROUBLESHOOT_HEADING,
} from "@/lib/azure-cloud-connection-permissions-copy";
import { OPERATOR_CARD, OPERATOR_LAYOUT, OPERATOR_SHELL_SCROLL_OFFSET_CLASS, OPERATOR_TYPOGRAPHY, DESIGN_TOKENS } from "@/lib/design-tokens";
import type { HelpMarkdownHeading } from "@/lib/help/help-markdown-headings";
import { HELP_PAGE_LAYOUT } from "@/lib/help/help-page-layout";
import {
  AZURE_PERMISSIONS_HELP_DEFERRED_CUSTOM_ROLE_DISCLOSURE_TEST_ID,
  AZURE_PERMISSIONS_HELP_DEFERRED_MATRIX_DISCLOSURE_TEST_ID,
  AZURE_PERMISSIONS_HELP_FIRST_VIEWPORT_TEST_ID,
  AZURE_PERMISSIONS_HELP_HEADER_TEST_ID,
  AZURE_PERMISSIONS_HELP_PRIMARY_SETUP_ACTION,
  AZURE_PERMISSIONS_HELP_REQUIREMENTS_REVIEWED_DISCLOSURE_SUMMARY,
  AZURE_PERMISSIONS_HELP_REQUIREMENTS_REVIEWED_DISCLOSURE_TEST_ID,
  AZURE_PERMISSIONS_HELP_REQUIREMENTS_REVIEWED_DISCLOSURE_TITLE,
  formatAzurePermissionsHelpRequirementsReviewedLine,
} from "@/lib/azure-permissions-help-evidence-copy";
import type { ProductDocumentationEntry } from "@/lib/product-documentation-registry";
import { cn } from "@/lib/utils";

const AZURE_PERMISSIONS_TOC_HEADINGS: readonly HelpMarkdownHeading[] = [
  { id: "required-roles-summary", title: "Roles to assign first", level: 2 },
  { id: "read-only-summary", title: "Read-only by design", level: 2 },
  { id: "setup", title: "Assign the Azure roles", level: 2 },
  { id: "azure-permissions-verify-heading", title: "Verify the connection", level: 2 },
  { id: "connection-context-heading", title: "Connection values", level: 2 },
  { id: "permissions-matrix", title: "Required and optional permissions", level: 2 },
  { id: "recommended-scope", title: "Choose the narrowest practical scope", level: 2 },
  { id: "collected-data", title: "Information ArchLucid collects", level: 2 },
  { id: "cannot-do", title: "Actions these permissions do not allow", level: 2 },
  { id: "custom-role", title: "Using a custom Azure role", level: 2 },
  { id: "troubleshoot", title: "Troubleshoot permission checks", level: 2 },
  { id: "other-providers", title: "Other cloud providers", level: 2 },
];

const CLOUD_CONNECTIONS_HUB_HREF = "/integrations/cloud-connections";
const AZURE_CONNECTION_SETUP_HREF = "/integrations/cloud-connections/azure";

type HelpAzurePermissionsGuideViewProps = {
  readonly entry: ProductDocumentationEntry;
  readonly subscriptionId?: string;
  readonly returnHref?: string;
};

function HelpSectionHeading(props: { readonly id: string; readonly children: string }): React.ReactElement {
  return (
    <h2
      id={props.id}
      className={cn(OPERATOR_SHELL_SCROLL_OFFSET_CLASS, OPERATOR_TYPOGRAPHY.sectionTitle, "m-0 scroll-mt-24")}
    >
      {props.children}
    </h2>
  );
}

function CustomRoleActionsTable(): React.ReactElement {
  return (
    <div className={HELP_PAGE_LAYOUT.tableWrap} data-testid="azure-permissions-custom-role-table">
      <table className={HELP_PAGE_LAYOUT.table}>
        <caption className="sr-only">Custom role read actions</caption>
        <thead>
          <tr>
            <th scope="col" className={HELP_PAGE_LAYOUT.tableHeadCell}>
              Action
            </th>
            <th scope="col" className={HELP_PAGE_LAYOUT.tableHeadCell}>
              Requirement
            </th>
            <th scope="col" className={HELP_PAGE_LAYOUT.tableHeadCell}>
              Used for
            </th>
          </tr>
        </thead>
        <tbody>
          {AZURE_CLOUD_CONNECTION_CUSTOM_ROLE_READ_ACTIONS.map((row, index) => (
            <tr
              key={row.action}
              className={index % 2 === 0 ? HELP_PAGE_LAYOUT.tableRowOdd : HELP_PAGE_LAYOUT.tableRowEven}
            >
              <th scope="row" className={HELP_PAGE_LAYOUT.tableBodyCell}>
                <code className="break-all">{row.action}</code>
              </th>
              <td className={HELP_PAGE_LAYOUT.tableBodyCell}>
                {formatAzurePermissionRequirementLabel(row.requirement)}
              </td>
              <td className={HELP_PAGE_LAYOUT.tableBodyCell}>{row.usedBy}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** Manifest-driven Azure permissions guide for `/help/azure-permissions`. */
export function HelpAzurePermissionsGuideView(props: HelpAzurePermissionsGuideViewProps): React.ReactElement {
  const { entry } = props;
  const returnHref = props.returnHref ?? CLOUD_CONNECTIONS_HUB_HREF;
  const otherProviders = AZURE_CLOUD_CONNECTION_RELATED_HELP.filter((link) => link.provider !== "azure");
  // A bare hub href carries no per-connection context, so the verify CTA targets the Azure setup page it names.
  const verifySetupHref = returnHref === CLOUD_CONNECTIONS_HUB_HREF ? AZURE_CONNECTION_SETUP_HREF : returnHref;

  return (
    <article
      className={cn(OPERATOR_LAYOUT.majorSectionGap, "w-full max-w-[68rem]")}
      data-testid="help-azure-permissions-guide"
    >
      <HelpTopicHashScroll />
      <header className={HELP_PAGE_LAYOUT.articleHeader} data-testid={AZURE_PERMISSIONS_HELP_HEADER_TEST_ID}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 space-y-2">
            <p className={cn("m-0", OPERATOR_TYPOGRAPHY.helper)}>
              <Link href={returnHref} className="text-teal-700 underline dark:text-teal-400">
                ← {AZURE_PERMISSIONS_BACK_TO_CONNECTIONS}
              </Link>
              <span aria-hidden="true"> · </span>
              <a href="#troubleshoot" className="text-teal-700 underline dark:text-teal-400">
                Fix a failed permission check
              </a>
            </p>
            <HelpTopicTitleRow title={AZURE_PERMISSIONS_PAGE_TITLE} />
            <p className={cn("m-0 max-w-3xl", OPERATOR_TYPOGRAPHY.helper)}>{AZURE_PERMISSIONS_PAGE_SUBTITLE}</p>
            <HelpTopicRegistryProvenanceLine entry={entry} />
          </div>
          <div className="flex min-w-0 flex-col items-start gap-2">
            <Button asChild size="sm" variant="primary" data-testid={AZURE_PERMISSIONS_HELP_PRIMARY_SETUP_ACTION.testId}>
              <Link href={verifySetupHref}>{AZURE_PERMISSIONS_HELP_PRIMARY_SETUP_ACTION.label}</Link>
            </Button>
            <HelpAzurePermissionsHeaderActions entry={entry} />
          </div>
        </div>
      </header>

      <AzurePermissionsHelpEvidenceOrientationStrip />
      <div className={HELP_PAGE_LAYOUT.contentGrid}>
        <div className="min-w-0 space-y-8" data-testid="help-azure-permissions-primary">
          <div className="space-y-6" data-testid={AZURE_PERMISSIONS_HELP_FIRST_VIEWPORT_TEST_ID}>
            <HelpAzurePermissionsRequiredRolesSummary />

            <section aria-labelledby="read-only-summary" className="space-y-3">
              <HelpSectionHeading id="read-only-summary">{AZURE_PERMISSIONS_READ_ONLY_HEADING}</HelpSectionHeading>
              <div className={cn(DESIGN_TOKENS.callout.neutral, "space-y-3")} data-testid="azure-permissions-trust-panel">
                <p className={cn("m-0", OPERATOR_TYPOGRAPHY.body)}>{AZURE_PERMISSIONS_READ_ONLY_INTRO}</p>
                <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
                  {AZURE_PERMISSIONS_COST_OPTIONAL_NOTE}
                </p>
                <ul className={cn("m-0 list-disc space-y-1 pl-5", OPERATOR_TYPOGRAPHY.body)}>
                  <li>{AZURE_PERMISSIONS_TRUST_NO_MODIFY}</li>
                  <li>{AZURE_PERMISSIONS_TRUST_NO_ROLE_ASSIGN}</li>
                  <li>{AZURE_PERMISSIONS_TRUST_NO_DEPLOY}</li>
                </ul>
                <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
                  Do not assign: {AZURE_CLOUD_CONNECTION_FORBIDDEN_ROLES.join(", ")}.
                </p>
              </div>
            </section>
          </div>

          <section id="setup" className="scroll-mt-24 border-t border-neutral-200 pt-6 dark:border-neutral-800">
            <HelpAzurePermissionsSetupSection subscriptionId={props.subscriptionId} />
          </section>

          <section id="verify" className="scroll-mt-24 border-t border-neutral-200 pt-6 dark:border-neutral-800">
            <HelpAzurePermissionsVerificationPanel subscriptionId={props.subscriptionId} returnHref={verifySetupHref} />
          </section>

          <section
            id="connection-context"
            className="scroll-mt-24 space-y-3 border-t border-neutral-200 pt-6 dark:border-neutral-800"
          >
            <HelpSectionHeading id="connection-context-heading">{AZURE_PERMISSIONS_CONNECTION_CONTEXT_HEADING}</HelpSectionHeading>
            <Suspense fallback={<p className={cn("m-0", OPERATOR_TYPOGRAPHY.helper)}>Loading connection context…</p>}>
              <HelpAzurePermissionsConnectionContext />
            </Suspense>
          </section>

          <section aria-labelledby="permissions-matrix" className="border-t border-neutral-200 pt-6 dark:border-neutral-800">
            <CollapsibleSection
              title={AZURE_PERMISSIONS_MATRIX_HEADING}
              headingLevel={2}
              summaryLine={AZURE_PERMISSIONS_MATRIX_DISCLOSURE_SUMMARY}
              summaryId="permissions-matrix"
              sectionTestId={AZURE_PERMISSIONS_HELP_DEFERRED_MATRIX_DISCLOSURE_TEST_ID}
            >
              <div className="space-y-3">
                <AzureCloudConnectionRolesTable expandedDetails={false} testId="azure-permissions-matrix-table" />
              </div>
            </CollapsibleSection>
          </section>

          <section
            aria-labelledby="recommended-scope"
            className="space-y-3 border-t border-neutral-200 pt-6 dark:border-neutral-800"
            data-testid="azure-permissions-scope-section"
          >
            <HelpSectionHeading id="recommended-scope">{AZURE_PERMISSIONS_SCOPE_HEADING}</HelpSectionHeading>
            <p className={cn("m-0 max-w-3xl text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
              {AZURE_CLOUD_CONNECTION_SCOPE_GUIDANCE.recommendedTier2}
            </p>
            <ul className={HELP_PAGE_LAYOUT.bulletList}>
              <li>{AZURE_CLOUD_CONNECTION_SCOPE_GUIDANCE.multipleSubscriptions}</li>
              <li>{AZURE_CLOUD_CONNECTION_SCOPE_GUIDANCE.resourceGroupLimitation}</li>
              <li>{AZURE_CLOUD_CONNECTION_SCOPE_GUIDANCE.managementGroupLimitation}</li>
              <li>{AZURE_CLOUD_CONNECTION_SCOPE_GUIDANCE.billingScope}</li>
            </ul>
          </section>

          <section
            aria-labelledby="collected-data"
            className="space-y-3 border-t border-neutral-200 pt-6 dark:border-neutral-800"
            data-testid="azure-permissions-collected-section"
          >
            <HelpSectionHeading id="collected-data">{AZURE_PERMISSIONS_COLLECTED_HEADING}</HelpSectionHeading>
            <ul className={HELP_PAGE_LAYOUT.bulletList}>
              {AZURE_CLOUD_CONNECTION_DATA_COLLECTED.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
            <Card>
              <CardHeader className={OPERATOR_CARD.header}>
                <CardTitle className={cn("text-base", OPERATOR_TYPOGRAPHY.cardTitle)}>Not collected</CardTitle>
              </CardHeader>
              <CardContent className={OPERATOR_CARD.content}>
                <ul className={HELP_PAGE_LAYOUT.bulletList}>
                  {AZURE_CLOUD_CONNECTION_DATA_NOT_COLLECTED.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </section>

          <section
            aria-labelledby="cannot-do"
            className="space-y-3 border-t border-neutral-200 pt-6 dark:border-neutral-800"
            data-testid="azure-permissions-cannot-do-section"
          >
            <HelpSectionHeading id="cannot-do">{AZURE_PERMISSIONS_CANNOT_DO_HEADING}</HelpSectionHeading>
            <p className={cn("m-0 max-w-3xl text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
              {AZURE_PERMISSIONS_CANNOT_DO_INTRO}
            </p>
            <ul className={HELP_PAGE_LAYOUT.bulletList}>
              {AZURE_CLOUD_CONNECTION_CANNOT_DO.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </section>

          <section
            aria-labelledby="custom-role"
            className="border-t border-neutral-200 pt-6 dark:border-neutral-800"
            data-testid="azure-permissions-custom-role-section"
          >
            <CollapsibleSection
              title={AZURE_PERMISSIONS_CUSTOM_ROLE_HEADING}
              headingLevel={2}
              summaryLine={AZURE_PERMISSIONS_CUSTOM_ROLE_DISCLOSURE_SUMMARY}
              summaryId="custom-role"
              sectionTestId={AZURE_PERMISSIONS_HELP_DEFERRED_CUSTOM_ROLE_DISCLOSURE_TEST_ID}
            >
              <div className="space-y-3">
                <p className={cn("m-0 max-w-3xl text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
                  {AZURE_PERMISSIONS_CUSTOM_ROLE_INTRO}
                </p>
                <CustomRoleActionsTable />
              </div>
            </CollapsibleSection>
          </section>

          <section
            aria-labelledby="troubleshoot"
            className="space-y-3 border-t border-neutral-200 pt-6 dark:border-neutral-800"
            data-testid="azure-permissions-troubleshoot-section"
          >
            <HelpSectionHeading id="troubleshoot">{AZURE_PERMISSIONS_TROUBLESHOOT_HEADING}</HelpSectionHeading>
            <ul className={HELP_PAGE_LAYOUT.bulletList} data-testid="azure-permissions-troubleshoot-list">
              {AZURE_CLOUD_CONNECTION_TROUBLESHOOTING_ITEMS.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </section>

          <section
            aria-labelledby="other-providers"
            className="space-y-3 border-t border-neutral-200 pt-6 dark:border-neutral-800"
            data-testid="azure-permissions-other-providers"
          >
            <HelpSectionHeading id="other-providers">{AZURE_PERMISSIONS_OTHER_PROVIDERS_HEADING}</HelpSectionHeading>
            <ul className={HELP_PAGE_LAYOUT.bulletList}>
              {otherProviders.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-teal-700 underline dark:text-teal-400">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </section>

          <section className="border-t border-neutral-200 pt-6 dark:border-neutral-800">
            <CollapsibleSection
              title={AZURE_PERMISSIONS_HELP_REQUIREMENTS_REVIEWED_DISCLOSURE_TITLE}
              headingLevel={2}
              summaryLine={AZURE_PERMISSIONS_HELP_REQUIREMENTS_REVIEWED_DISCLOSURE_SUMMARY}
              sectionTestId={AZURE_PERMISSIONS_HELP_REQUIREMENTS_REVIEWED_DISCLOSURE_TEST_ID}
            >
              <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
                {formatAzurePermissionsHelpRequirementsReviewedLine(AZURE_CLOUD_CONNECTION_PERMISSIONS_CONTRACT_VERSION)}
              </p>
            </CollapsibleSection>
          </section>
        </div>
        <HelpTopicTableOfContents headings={AZURE_PERMISSIONS_TOC_HEADINGS} />
      </div>
    </article>
  );
}
