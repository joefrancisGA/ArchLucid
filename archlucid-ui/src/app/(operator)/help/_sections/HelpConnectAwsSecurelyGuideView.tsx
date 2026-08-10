import Link from "next/link";

import { HelpTopicTitleRow } from "@/components/help/HelpTopicPageHeader";
import { HelpTopicHashScroll } from "@/app/(operator)/help/HelpTopicHashScroll";
import { HelpConnectAwsSecurelyTrustPolicyPanel } from "@/app/(operator)/help/_sections/HelpConnectAwsSecurelyTrustPolicyPanel";
import { ConnectAwsSecurelyHelpEvidenceOrientationStrip } from "@/components/help/ConnectAwsSecurelyHelpEvidenceOrientationStrip";
import { HelpTopicTableOfContents } from "@/components/help/HelpTopicTableOfContents";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PageContextualHelpButton } from "@/components/usability/PageContextualHelpButton";
import {
  AWS_CLOUD_CONNECTION_PERMISSION_ROWS,
  formatAwsPermissionRequirementLabel,
} from "@/lib/aws-cloud-connection-permissions-manifest";
import {
  CONNECT_AWS_SECURELY_BACK_TO_CONNECTIONS,
  CONNECT_AWS_SECURELY_CONFIGURE_ACTION,
  CONNECT_AWS_SECURELY_CONFIGURE_HREF,
  CONNECT_AWS_SECURELY_CONNECTION_VALUE,
  CONNECT_AWS_SECURELY_CREDENTIALS_ITEMS,
  CONNECT_AWS_SECURELY_FORBIDDEN_POLICIES_BODY,
  CONNECT_AWS_SECURELY_FORBIDDEN_POLICIES_HEADING,
  CONNECT_AWS_SECURELY_OPTIONAL_ZIP_NOTE,
  CONNECT_AWS_SECURELY_PAGE_INTRO,
  CONNECT_AWS_SECURELY_PAGE_TITLE,
  CONNECT_AWS_SECURELY_PERMISSIONS_HEADING,
  CONNECT_AWS_SECURELY_PERMISSIONS_ITEMS,
  CONNECT_AWS_SECURELY_RESOURCE_EXPLORER_NOTE,
  CONNECT_AWS_SECURELY_RETAINED_ITEMS,
  CONNECT_AWS_SECURELY_SECURITY_HEADING,
  CONNECT_AWS_SECURELY_SECURITY_ITEMS,
  CONNECT_AWS_SECURELY_SETUP_HEADING,
  CONNECT_AWS_SECURELY_SETUP_STEPS,
} from "@/lib/connect-aws-securely-help-content";
import { OPERATOR_LAYOUT, OPERATOR_SHELL_SCROLL_OFFSET_CLASS, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import type { HelpMarkdownHeading } from "@/lib/help-markdown-headings";
import { HELP_PAGE_LAYOUT } from "@/lib/help-page-layout";
import type { ProductDocumentationEntry } from "@/lib/product-documentation-registry";
import { cn } from "@/lib/utils";

const CONNECT_AWS_SECURELY_TOC_HEADINGS: readonly HelpMarkdownHeading[] = [
  { id: "security-model", title: CONNECT_AWS_SECURELY_SECURITY_HEADING, level: 2 },
  { id: "setup-aws-connection", title: CONNECT_AWS_SECURELY_SETUP_HEADING, level: 2 },
  { id: "aws-permissions", title: CONNECT_AWS_SECURELY_PERMISSIONS_HEADING, level: 2 },
  { id: "information-retained", title: "Information retained", level: 2 },
  { id: "credentials-not-retained", title: "Credentials not retained", level: 2 },
  { id: "permissions-not-required", title: "Permissions not required", level: 2 },
];

type HelpConnectAwsSecurelyGuideViewProps = {
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

function AwsPermissionsTable(): React.ReactElement {
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
            <th scope="col" className={HELP_PAGE_LAYOUT.tableHeadCell}>
              Write access
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
                {row.iamIdentifier}
              </th>
              <td className={HELP_PAGE_LAYOUT.tableBodyCell}>
                <span className="font-semibold">{formatAwsPermissionRequirementLabel(row.requirement)}</span>
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

/** Concise enterprise setup guide for `/help/cloud-connections/aws`. */
export function HelpConnectAwsSecurelyGuideView(props: HelpConnectAwsSecurelyGuideViewProps): React.ReactElement {
  void props.entry;
  const returnHref = props.returnHref ?? "/integrations/cloud-connections";

  return (
    <article
      className={cn(OPERATOR_LAYOUT.majorSectionGap, "mx-auto w-full max-w-[68rem]")}
      data-testid="help-connect-aws-securely-guide"
    >
      <HelpTopicHashScroll />
      <header className={cn(HELP_PAGE_LAYOUT.articleHeader, "space-y-3 pb-4")}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 space-y-3">
            <p className={cn("m-0", OPERATOR_TYPOGRAPHY.helper)}>
              <Link href={returnHref} className="text-teal-700 underline dark:text-teal-400">
                ← {CONNECT_AWS_SECURELY_BACK_TO_CONNECTIONS}
              </Link>
            </p>
            <HelpTopicTitleRow title={CONNECT_AWS_SECURELY_PAGE_TITLE} />
            <p className={cn("m-0 max-w-prose text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
              {CONNECT_AWS_SECURELY_PAGE_INTRO}
            </p>
            <p className={cn("m-0 max-w-prose text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
              {CONNECT_AWS_SECURELY_CONNECTION_VALUE}
            </p>
            <p className={cn("m-0 max-w-prose text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
              {CONNECT_AWS_SECURELY_OPTIONAL_ZIP_NOTE}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <PageContextualHelpButton />
            <Button asChild size="sm" variant="primary" data-testid="connect-aws-configure-action">
              <Link href={CONNECT_AWS_SECURELY_CONFIGURE_HREF}>{CONNECT_AWS_SECURELY_CONFIGURE_ACTION}</Link>
            </Button>
          </div>
        </div>
      </header>

      <ConnectAwsSecurelyHelpEvidenceOrientationStrip />

      <div className={HELP_PAGE_LAYOUT.contentGrid}>
        <div className="min-w-0 space-y-8" data-testid="help-connect-aws-securely-primary">
          <section aria-labelledby="security-model" className="space-y-3">
            <HelpSectionHeading id="security-model">{CONNECT_AWS_SECURELY_SECURITY_HEADING}</HelpSectionHeading>
            <Card
              className="border-teal-200/80 bg-teal-50/40 dark:border-teal-900/50 dark:bg-teal-950/20"
              data-testid="connect-aws-securely-security-panel"
            >
              <CardContent className="space-y-3 pt-6">
                <ul className="m-0 list-none space-y-3 p-0">
                  {CONNECT_AWS_SECURELY_SECURITY_ITEMS.map((item) => (
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
            aria-labelledby="setup-aws-connection"
            className="space-y-3 border-t border-neutral-200 pt-6 dark:border-neutral-800"
            data-testid="connect-aws-securely-setup-section"
          >
            <HelpSectionHeading id="setup-aws-connection">{CONNECT_AWS_SECURELY_SETUP_HEADING}</HelpSectionHeading>
            <ol className={cn("m-0 list-decimal space-y-2 pl-5 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
              {CONNECT_AWS_SECURELY_SETUP_STEPS.map((step) => (
                <li key={step.id}>
                  {step.id === "open-cloud-connections" ? (
                    <>
                      Open{" "}
                      <Link href={CONNECT_AWS_SECURELY_CONFIGURE_HREF} className="text-teal-700 underline dark:text-teal-400">
                        Cloud connections
                      </Link>{" "}
                      and begin an AWS connection.
                    </>
                  ) : (
                    step.text
                  )}
                </li>
              ))}
            </ol>
            <HelpConnectAwsSecurelyTrustPolicyPanel />
          </section>

          <section
            aria-labelledby="aws-permissions"
            className="space-y-3 border-t border-neutral-200 pt-6 dark:border-neutral-800"
          >
            <HelpSectionHeading id="aws-permissions">{CONNECT_AWS_SECURELY_PERMISSIONS_HEADING}</HelpSectionHeading>
            <AwsPermissionsTable />
            <p className={cn("m-0 max-w-prose text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
              {CONNECT_AWS_SECURELY_RESOURCE_EXPLORER_NOTE}
            </p>
            <div
              className="rounded-md border border-amber-300/80 bg-amber-50/70 px-4 py-3 dark:border-amber-900/60 dark:bg-amber-950/30"
              data-testid="connect-aws-securely-forbidden-policies-callout"
              role="note"
            >
              <p className={cn("m-0 font-medium text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}>
                {CONNECT_AWS_SECURELY_FORBIDDEN_POLICIES_HEADING}
              </p>
              <p className={cn("m-0 mt-1 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
                {CONNECT_AWS_SECURELY_FORBIDDEN_POLICIES_BODY}
              </p>
            </div>
          </section>

          <section
            aria-labelledby="information-retained"
            className="border-t border-neutral-200 pt-6 dark:border-neutral-800"
            data-testid="connect-aws-securely-classification-section"
          >
            <div className="grid gap-6 lg:grid-cols-2">
              <div className="space-y-3">
                <HelpSectionHeading id="information-retained">Information retained</HelpSectionHeading>
                <ClassificationList items={CONNECT_AWS_SECURELY_RETAINED_ITEMS} />
              </div>
              <div className="space-y-3">
                <HelpSectionHeading id="credentials-not-retained">Credentials not retained</HelpSectionHeading>
                <ClassificationList items={CONNECT_AWS_SECURELY_CREDENTIALS_ITEMS} />
              </div>
            </div>
            <div className="mt-6 space-y-3">
              <HelpSectionHeading id="permissions-not-required">Permissions not required</HelpSectionHeading>
              <ClassificationList items={CONNECT_AWS_SECURELY_PERMISSIONS_ITEMS} />
            </div>
          </section>

          <div className="border-t border-neutral-200 pt-6 dark:border-neutral-800">
            <Button asChild variant="outline" size="sm">
              <Link href={CONNECT_AWS_SECURELY_CONFIGURE_HREF}>{CONNECT_AWS_SECURELY_CONFIGURE_ACTION}</Link>
            </Button>
          </div>
        </div>
        <HelpTopicTableOfContents headings={CONNECT_AWS_SECURELY_TOC_HEADINGS} enableScrollSpy />
      </div>
    </article>
  );
}
