import Link from "next/link";

import { Suspense } from "react";

import { HelpTopicHashScroll } from "@/app/(operator)/help/HelpTopicHashScroll";
import { HelpAzurePermissionsConnectionContext } from "@/app/(operator)/help/_sections/HelpAzurePermissionsConnectionContext";
import { HelpAzurePermissionsSetupSection } from "@/app/(operator)/help/_sections/HelpAzurePermissionsSetupSection";
import { HelpAzurePermissionsVerificationPanel } from "@/app/(operator)/help/_sections/HelpAzurePermissionsVerificationPanel";
import { HelpTopicTableOfContents } from "@/components/help/HelpTopicTableOfContents";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AZURE_CLOUD_CONNECTION_CANNOT_DO,
  AZURE_CLOUD_CONNECTION_CUSTOM_ROLE_READ_ACTIONS,
  AZURE_CLOUD_CONNECTION_DATA_COLLECTED,
  AZURE_CLOUD_CONNECTION_DATA_NOT_COLLECTED,
  AZURE_CLOUD_CONNECTION_FORBIDDEN_ROLES,
  AZURE_CLOUD_CONNECTION_PERMISSIONS_CONTRACT_VERSION,
  AZURE_CLOUD_CONNECTION_RELATED_HELP,
  AZURE_CLOUD_CONNECTION_ROLE_ROWS,
  AZURE_CLOUD_CONNECTION_SCOPE_GUIDANCE,
  AZURE_CLOUD_CONNECTION_TROUBLESHOOTING_ITEMS,
  formatAzurePermissionRequirementLabel,
} from "@/lib/azure-cloud-connection-permissions-manifest";
import {
  AZURE_PERMISSIONS_BACK_TO_CONNECTIONS,
  AZURE_PERMISSIONS_CANNOT_DO_HEADING,
  AZURE_PERMISSIONS_CANNOT_DO_INTRO,
  AZURE_PERMISSIONS_COLLECTED_HEADING,
  AZURE_PERMISSIONS_COST_OPTIONAL_NOTE,
  AZURE_PERMISSIONS_CUSTOM_ROLE_HEADING,
  AZURE_PERMISSIONS_CUSTOM_ROLE_INTRO,
  AZURE_PERMISSIONS_MATRIX_HEADING,
  AZURE_PERMISSIONS_OTHER_PROVIDERS_HEADING,
  AZURE_PERMISSIONS_PAGE_SUBTITLE,
  AZURE_PERMISSIONS_PAGE_TITLE,
  AZURE_PERMISSIONS_READ_ONLY_HEADING,
  AZURE_PERMISSIONS_READ_ONLY_INTRO,
  AZURE_PERMISSIONS_REVISION_NOTE,
  AZURE_PERMISSIONS_SCOPE_HEADING,
  AZURE_PERMISSIONS_TRUST_NO_DEPLOY,
  AZURE_PERMISSIONS_TRUST_NO_MODIFY,
  AZURE_PERMISSIONS_TRUST_NO_ROLE_ASSIGN,
  AZURE_PERMISSIONS_TROUBLESHOOT_HEADING,
} from "@/lib/azure-cloud-connection-permissions-copy";
import { OPERATOR_CARD, OPERATOR_LAYOUT, OPERATOR_SHELL_SCROLL_OFFSET_CLASS, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import type { HelpMarkdownHeading } from "@/lib/help-markdown-headings";
import { HELP_PAGE_LAYOUT } from "@/lib/help-page-layout";
import type { ProductDocumentationEntry } from "@/lib/product-documentation-registry";
import { cn } from "@/lib/utils";

const AZURE_PERMISSIONS_TOC_HEADINGS: readonly HelpMarkdownHeading[] = [
  { id: "read-only-summary", title: "Read-only by design", level: 2 },
  { id: "permissions-matrix", title: "Required and optional permissions", level: 2 },
  { id: "recommended-scope", title: "Choose the narrowest practical scope", level: 2 },
  { id: "connection-context-heading", title: "Connection values", level: 2 },
  { id: "setup", title: "Assign the Azure roles", level: 2 },
  { id: "collected-data", title: "Information ArchLucid collects", level: 2 },
  { id: "cannot-do", title: "Actions these permissions do not allow", level: 2 },
  { id: "custom-role", title: "Using a custom Azure role", level: 2 },
  { id: "azure-permissions-verify-heading", title: "Verify the connection", level: 2 },
  { id: "troubleshoot", title: "Troubleshoot permission checks", level: 2 },
  { id: "other-providers", title: "Other cloud providers", level: 2 },
];

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

function PermissionsMatrixTable(): React.ReactElement {
  return (
    <div className={HELP_PAGE_LAYOUT.tableWrap} data-testid="azure-permissions-matrix-table">
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
    </div>
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
  void props.entry;
  const returnHref = props.returnHref ?? "/integrations/cloud-connections";
  const otherProviders = AZURE_CLOUD_CONNECTION_RELATED_HELP.filter((link) => link.provider !== "azure");

  return (
    <article
      className={cn(OPERATOR_LAYOUT.majorSectionGap, "mx-auto w-full max-w-[68rem]")}
      data-testid="help-azure-permissions-guide"
    >
      <HelpTopicHashScroll />
      <header className={HELP_PAGE_LAYOUT.articleHeader}>
        <p className={cn("m-0", OPERATOR_TYPOGRAPHY.helper)}>
          <Link href={returnHref} className="text-teal-700 underline dark:text-teal-400">
            ← {AZURE_PERMISSIONS_BACK_TO_CONNECTIONS}
          </Link>
        </p>
        <h1 className={cn("m-0", OPERATOR_TYPOGRAPHY.pageTitle)}>{AZURE_PERMISSIONS_PAGE_TITLE}</h1>
        <p className={cn("m-0 max-w-prose", OPERATOR_TYPOGRAPHY.helper)}>{AZURE_PERMISSIONS_PAGE_SUBTITLE}</p>
        <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.micro)}>
          {AZURE_PERMISSIONS_REVISION_NOTE(AZURE_CLOUD_CONNECTION_PERMISSIONS_CONTRACT_VERSION)}
        </p>
      </header>

      <div className={HELP_PAGE_LAYOUT.contentGrid}>
        <div className="min-w-0 space-y-8" data-testid="help-azure-permissions-primary">
          <section aria-labelledby="read-only-summary" className="space-y-3">
            <HelpSectionHeading id="read-only-summary">{AZURE_PERMISSIONS_READ_ONLY_HEADING}</HelpSectionHeading>
            <Card
              className="border-teal-200/80 bg-teal-50/40 dark:border-teal-900/50 dark:bg-teal-950/20"
              data-testid="azure-permissions-trust-panel"
            >
              <CardContent className={cn(OPERATOR_CARD.content, "space-y-3 pt-6")}>
                <p className={cn("m-0", OPERATOR_TYPOGRAPHY.body)}>{AZURE_PERMISSIONS_READ_ONLY_INTRO}</p>
                <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
                  {AZURE_PERMISSIONS_COST_OPTIONAL_NOTE}
                </p>
                <ul className={cn("m-0 grid gap-2 sm:grid-cols-3", OPERATOR_TYPOGRAPHY.body)}>
                  <li className="rounded-md border border-neutral-200 bg-white px-3 py-2 dark:border-neutral-800 dark:bg-neutral-950">
                    {AZURE_PERMISSIONS_TRUST_NO_MODIFY}
                  </li>
                  <li className="rounded-md border border-neutral-200 bg-white px-3 py-2 dark:border-neutral-800 dark:bg-neutral-950">
                    {AZURE_PERMISSIONS_TRUST_NO_ROLE_ASSIGN}
                  </li>
                  <li className="rounded-md border border-neutral-200 bg-white px-3 py-2 dark:border-neutral-800 dark:bg-neutral-950">
                    {AZURE_PERMISSIONS_TRUST_NO_DEPLOY}
                  </li>
                </ul>
                <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
                  Do not assign: {AZURE_CLOUD_CONNECTION_FORBIDDEN_ROLES.join(", ")}.
                </p>
              </CardContent>
            </Card>
          </section>

          <section aria-labelledby="permissions-matrix" className="space-y-3 border-t border-neutral-200 pt-6 dark:border-neutral-800">
            <HelpSectionHeading id="permissions-matrix">{AZURE_PERMISSIONS_MATRIX_HEADING}</HelpSectionHeading>
            <PermissionsMatrixTable />
          </section>

          <section
            aria-labelledby="recommended-scope"
            className="space-y-3 border-t border-neutral-200 pt-6 dark:border-neutral-800"
            data-testid="azure-permissions-scope-section"
          >
            <HelpSectionHeading id="recommended-scope">{AZURE_PERMISSIONS_SCOPE_HEADING}</HelpSectionHeading>
            <p className={cn("m-0 max-w-prose text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
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
            id="connection-context"
            className="scroll-mt-24 space-y-3 border-t border-neutral-200 pt-6 dark:border-neutral-800"
          >
            <HelpSectionHeading id="connection-context-heading">Connection values</HelpSectionHeading>
            <Suspense fallback={<p className={cn("m-0", OPERATOR_TYPOGRAPHY.helper)}>Loading connection context…</p>}>
              <HelpAzurePermissionsConnectionContext />
            </Suspense>
          </section>

          <section id="setup" className="scroll-mt-24 border-t border-neutral-200 pt-6 dark:border-neutral-800">
            <HelpAzurePermissionsSetupSection subscriptionId={props.subscriptionId} />
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
            <p className={cn("m-0 max-w-prose text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
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
            className="space-y-3 border-t border-neutral-200 pt-6 dark:border-neutral-800"
            data-testid="azure-permissions-custom-role-section"
          >
            <HelpSectionHeading id="custom-role">{AZURE_PERMISSIONS_CUSTOM_ROLE_HEADING}</HelpSectionHeading>
            <p className={cn("m-0 max-w-prose text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
              {AZURE_PERMISSIONS_CUSTOM_ROLE_INTRO}
            </p>
            <CustomRoleActionsTable />
          </section>

          <section id="verify" className="scroll-mt-24 border-t border-neutral-200 pt-6 dark:border-neutral-800">
            <HelpAzurePermissionsVerificationPanel subscriptionId={props.subscriptionId} />
          </section>

          <section
            aria-labelledby="troubleshoot"
            className="space-y-3 border-t border-neutral-200 pt-6 dark:border-neutral-800"
            data-testid="azure-permissions-troubleshoot-section"
          >
            <HelpSectionHeading id="troubleshoot">{AZURE_PERMISSIONS_TROUBLESHOOT_HEADING}</HelpSectionHeading>
            <details className={HELP_PAGE_LAYOUT.details}>
              <summary className="cursor-pointer font-medium">Common permission check issues</summary>
              <ul className={cn(HELP_PAGE_LAYOUT.bulletList, HELP_PAGE_LAYOUT.detailsBody)}>
                {AZURE_CLOUD_CONNECTION_TROUBLESHOOTING_ITEMS.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </details>
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
        </div>
        <HelpTopicTableOfContents headings={AZURE_PERMISSIONS_TOC_HEADINGS} />
      </div>
    </article>
  );
}
