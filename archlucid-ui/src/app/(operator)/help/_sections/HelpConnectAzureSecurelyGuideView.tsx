import Link from "next/link";

import { HelpTopicHashScroll } from "@/app/(operator)/help/HelpTopicHashScroll";
import { HelpTopicTableOfContents } from "@/components/help/HelpTopicTableOfContents";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  AZURE_CLOUD_CONNECTION_ROLE_ROWS,
  formatAzurePermissionRequirementLabel,
} from "@/lib/azure-cloud-connection-permissions-manifest";
import {
  CONNECT_AZURE_SECURELY_BACK_TO_CONNECTIONS,
  CONNECT_AZURE_SECURELY_CONFIGURE_ACTION,
  CONNECT_AZURE_SECURELY_CONFIGURE_HREF,
  CONNECT_AZURE_SECURELY_CONNECTION_VALUE,
  CONNECT_AZURE_SECURELY_COST_OPTIONAL_NOTE,
  CONNECT_AZURE_SECURELY_CREDENTIALS_ITEMS,
  CONNECT_AZURE_SECURELY_DETAILED_SETUP_LINK,
  CONNECT_AZURE_SECURELY_FORBIDDEN_ROLES_BODY,
  CONNECT_AZURE_SECURELY_FORBIDDEN_ROLES_HEADING,
  CONNECT_AZURE_SECURELY_PAGE_INTRO,
  CONNECT_AZURE_SECURELY_PAGE_TITLE,
  CONNECT_AZURE_SECURELY_PERMISSIONS_GUIDE_HREF,
  CONNECT_AZURE_SECURELY_PERMISSIONS_ITEMS,
  CONNECT_AZURE_SECURELY_RETAINED_ITEMS,
  CONNECT_AZURE_SECURELY_ROLES_HEADING,
  CONNECT_AZURE_SECURELY_SECURITY_HEADING,
  CONNECT_AZURE_SECURELY_SECURITY_ITEMS,
  CONNECT_AZURE_SECURELY_SETUP_HEADING,
  CONNECT_AZURE_SECURELY_SETUP_STEPS,
} from "@/lib/connect-azure-securely-help-content";
import { OPERATOR_LAYOUT, OPERATOR_SHELL_SCROLL_OFFSET_CLASS, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import type { HelpMarkdownHeading } from "@/lib/help-markdown-headings";
import { HELP_PAGE_LAYOUT } from "@/lib/help-page-layout";
import type { ProductDocumentationEntry } from "@/lib/product-documentation-registry";
import { cn } from "@/lib/utils";

const CONNECT_AZURE_SECURELY_TOC_HEADINGS: readonly HelpMarkdownHeading[] = [
  { id: "security-model", title: CONNECT_AZURE_SECURELY_SECURITY_HEADING, level: 2 },
  { id: "setup-azure-connection", title: CONNECT_AZURE_SECURELY_SETUP_HEADING, level: 2 },
  { id: "azure-roles", title: CONNECT_AZURE_SECURELY_ROLES_HEADING, level: 2 },
  { id: "information-retained", title: "Information retained", level: 2 },
  { id: "credentials-not-retained", title: "Credentials not retained", level: 2 },
  { id: "permissions-not-required", title: "Permissions not required", level: 2 },
];

type HelpConnectAzureSecurelyGuideViewProps = {
  readonly entry: ProductDocumentationEntry;
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

function AzureRolesTable(): React.ReactElement {
  return (
    <div className={HELP_PAGE_LAYOUT.tableWrap} data-testid="connect-azure-securely-roles-table">
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
    </div>
  );
}

function ClassificationList(props: { readonly items: readonly string[] }): React.ReactElement {
  return (
    <ul className={cn("m-0 list-disc space-y-1.5 pl-5", OPERATOR_TYPOGRAPHY.body)}>
      {props.items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  );
}

/** Concise enterprise setup guide for `/help/cloud-connections/azure`. */
export function HelpConnectAzureSecurelyGuideView(props: HelpConnectAzureSecurelyGuideViewProps): React.ReactElement {
  void props.entry;
  const returnHref = props.returnHref ?? "/integrations/cloud-connections";

  return (
    <article
      className={cn(OPERATOR_LAYOUT.majorSectionGap, "mx-auto w-full max-w-[68rem]")}
      data-testid="help-connect-azure-securely-guide"
    >
      <HelpTopicHashScroll />
      <header className={cn(HELP_PAGE_LAYOUT.articleHeader, "space-y-3 pb-4")}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 space-y-3">
            <p className={cn("m-0", OPERATOR_TYPOGRAPHY.helper)}>
              <Link href={returnHref} className="text-teal-700 underline dark:text-teal-400">
                ← {CONNECT_AZURE_SECURELY_BACK_TO_CONNECTIONS}
              </Link>
            </p>
            <h1 className={cn("m-0", OPERATOR_TYPOGRAPHY.pageTitle)}>{CONNECT_AZURE_SECURELY_PAGE_TITLE}</h1>
            <p className={cn("m-0 max-w-prose text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
              {CONNECT_AZURE_SECURELY_PAGE_INTRO}
            </p>
            <p className={cn("m-0 max-w-prose text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
              {CONNECT_AZURE_SECURELY_CONNECTION_VALUE}
            </p>
          </div>
          <Button asChild size="sm" variant="primary" data-testid="connect-azure-configure-action">
            <Link href={CONNECT_AZURE_SECURELY_CONFIGURE_HREF}>{CONNECT_AZURE_SECURELY_CONFIGURE_ACTION}</Link>
          </Button>
        </div>
      </header>

      <div className={HELP_PAGE_LAYOUT.contentGrid}>
        <div className="min-w-0 space-y-8" data-testid="help-connect-azure-securely-primary">
          <section aria-labelledby="security-model" className="space-y-3">
            <HelpSectionHeading id="security-model">{CONNECT_AZURE_SECURELY_SECURITY_HEADING}</HelpSectionHeading>
            <Card
              className="border-teal-200/80 bg-teal-50/40 dark:border-teal-900/50 dark:bg-teal-950/20"
              data-testid="connect-azure-securely-security-panel"
            >
              <CardContent className="space-y-3 pt-6">
                <ul className="m-0 list-none space-y-3 p-0">
                  {CONNECT_AZURE_SECURELY_SECURITY_ITEMS.map((item) => (
                    <li key={item.id}>
                      <p className={cn("m-0 font-medium text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}>
                        {item.title}
                      </p>
                      <p className={cn("m-0 mt-1 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>{item.detail}</p>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </section>

          <section
            aria-labelledby="setup-azure-connection"
            className="space-y-3 border-t border-neutral-200 pt-6 dark:border-neutral-800"
            data-testid="connect-azure-securely-setup-section"
          >
            <HelpSectionHeading id="setup-azure-connection">{CONNECT_AZURE_SECURELY_SETUP_HEADING}</HelpSectionHeading>
            <ol className={cn("m-0 list-decimal space-y-2 pl-5 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
              {CONNECT_AZURE_SECURELY_SETUP_STEPS.map((step) => (
                <li key={step.id}>
                  {step.id === "open-cloud-connections" ? (
                    <>
                      Open{" "}
                      <Link href={CONNECT_AZURE_SECURELY_CONFIGURE_HREF} className="text-teal-700 underline dark:text-teal-400">
                        Cloud connections
                      </Link>{" "}
                      and begin an Azure connection.
                    </>
                  ) : (
                    step.text
                  )}
                </li>
              ))}
            </ol>
            <p className={cn("m-0", OPERATOR_TYPOGRAPHY.helper)}>
              <Link
                href={CONNECT_AZURE_SECURELY_PERMISSIONS_GUIDE_HREF}
                className="text-teal-700 underline dark:text-teal-400"
              >
                {CONNECT_AZURE_SECURELY_DETAILED_SETUP_LINK}
              </Link>
            </p>
          </section>

          <section
            aria-labelledby="azure-roles"
            className="space-y-3 border-t border-neutral-200 pt-6 dark:border-neutral-800"
          >
            <HelpSectionHeading id="azure-roles">{CONNECT_AZURE_SECURELY_ROLES_HEADING}</HelpSectionHeading>
            <AzureRolesTable />
            <p className={cn("m-0 max-w-prose text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
              {CONNECT_AZURE_SECURELY_COST_OPTIONAL_NOTE}
            </p>
            <div
              className="rounded-md border border-amber-300/80 bg-amber-50/70 px-4 py-3 dark:border-amber-900/60 dark:bg-amber-950/30"
              data-testid="connect-azure-securely-forbidden-roles-callout"
              role="note"
            >
              <p className={cn("m-0 font-medium text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}>
                {CONNECT_AZURE_SECURELY_FORBIDDEN_ROLES_HEADING}
              </p>
              <p className={cn("m-0 mt-1 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
                {CONNECT_AZURE_SECURELY_FORBIDDEN_ROLES_BODY}
              </p>
            </div>
          </section>

          <section
            aria-labelledby="information-retained"
            className="border-t border-neutral-200 pt-6 dark:border-neutral-800"
            data-testid="connect-azure-securely-classification-section"
          >
            <div className="grid gap-6 lg:grid-cols-2">
              <div className="space-y-3">
                <HelpSectionHeading id="information-retained">Information retained</HelpSectionHeading>
                <ClassificationList items={CONNECT_AZURE_SECURELY_RETAINED_ITEMS} />
              </div>
              <div className="space-y-3">
                <HelpSectionHeading id="credentials-not-retained">Credentials not retained</HelpSectionHeading>
                <ClassificationList items={CONNECT_AZURE_SECURELY_CREDENTIALS_ITEMS} />
              </div>
            </div>
            <div className="mt-6 space-y-3">
              <HelpSectionHeading id="permissions-not-required">Permissions not required</HelpSectionHeading>
              <ClassificationList items={CONNECT_AZURE_SECURELY_PERMISSIONS_ITEMS} />
            </div>
          </section>

          <div className="border-t border-neutral-200 pt-6 dark:border-neutral-800">
            <Button asChild variant="outline" size="sm">
              <Link href={CONNECT_AZURE_SECURELY_CONFIGURE_HREF}>{CONNECT_AZURE_SECURELY_CONFIGURE_ACTION}</Link>
            </Button>
          </div>
        </div>
        <HelpTopicTableOfContents headings={CONNECT_AZURE_SECURELY_TOC_HEADINGS} enableScrollSpy />
      </div>
    </article>
  );
}
