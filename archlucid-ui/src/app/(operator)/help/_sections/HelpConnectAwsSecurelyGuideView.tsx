import Link from "next/link";

import { AlertTriangle } from "lucide-react";

import { HelpTopicTitleRow } from "@/components/help/HelpTopicPageHeader";
import { HelpTopicHashScroll } from "@/app/(operator)/help/HelpTopicHashScroll";
import { HelpConnectAwsSecurelyTrustPolicyPanel } from "@/app/(operator)/help/_sections/HelpConnectAwsSecurelyTrustPolicyPanel";
import { ConnectAwsSecurelyHelpEvidenceOrientationStrip } from "@/components/help/ConnectAwsSecurelyHelpEvidenceOrientationStrip";
import { HelpTopicRegistryProvenanceLine } from "@/components/help/HelpTopicRegistryProvenanceLine";
import { HelpTopicTableOfContents } from "@/components/help/HelpTopicTableOfContents";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { StatusTag } from "@/components/ui/status-tag";
import { PageContextualHelpButton } from "@/components/usability/PageContextualHelpButton";
import {
  AWS_CLOUD_CONNECTION_PERMISSION_ROWS,
  AWS_CLOUD_CONNECTION_TROUBLESHOOTING_ITEMS,
  formatAwsPermissionRequirementLabel,
} from "@/lib/aws-cloud-connection-permissions-manifest";
import { AWS_PERMISSIONS_TROUBLESHOOT_HEADING } from "@/lib/aws-cloud-connection-permissions-copy";
import {
  CONNECT_AWS_SECURELY_BACK_TO_CONNECTIONS,
  CONNECT_AWS_SECURELY_CONFIGURE_ACTION,
  CONNECT_AWS_SECURELY_CONFIGURE_HREF,
  CONNECT_AWS_SECURELY_CONNECTION_STATUS_HREF,
  CONNECT_AWS_SECURELY_CONNECTION_STATUS_LINK_LABEL,
  CONNECT_AWS_SECURELY_CREDENTIALS_ITEMS,
  CONNECT_AWS_SECURELY_DETAILED_SETUP_LINK,
  CONNECT_AWS_SECURELY_FORBIDDEN_POLICIES_BODY,
  CONNECT_AWS_SECURELY_FORBIDDEN_POLICIES_HEADING,
  CONNECT_AWS_SECURELY_FORBIDDEN_POLICIES_STATUS_LABEL,
  CONNECT_AWS_SECURELY_OPTIONAL_ZIP_NOTE,
  CONNECT_AWS_SECURELY_PAGE_LEAD,
  CONNECT_AWS_SECURELY_PAGE_TITLE,
  CONNECT_AWS_SECURELY_PERMISSIONS_AUTHORITY_NOTE,
  CONNECT_AWS_SECURELY_PERMISSIONS_HEADING,
  CONNECT_AWS_SECURELY_PERMISSIONS_ITEMS,
  CONNECT_AWS_SECURELY_RESOURCE_EXPLORER_NOTE,
  CONNECT_AWS_SECURELY_RETAINED_ITEMS,
  CONNECT_AWS_SECURELY_SECURITY_HEADING,
  CONNECT_AWS_SECURELY_SECURITY_ITEMS,
  CONNECT_AWS_SECURELY_SETUP_HEADING,
  CONNECT_AWS_SECURELY_SETUP_STEPS,
  CONNECT_AWS_SECURELY_STEP_AWS_CONNECTION_SETTINGS_LINK,
  CONNECT_AWS_SECURELY_VERIFICATION_CHECKS,
  CONNECT_AWS_SECURELY_VERIFICATION_CHECKS_LABEL,
  CONNECT_AWS_SECURELY_VERIFICATION_DOES_NOT_VERIFY,
  CONNECT_AWS_SECURELY_VERIFICATION_DOES_NOT_VERIFY_LABEL,
  CONNECT_AWS_SECURELY_VERIFICATION_HEADING,
  CONNECT_AWS_SECURELY_WITHOUT_CONNECTION_NOTE,
  buildConnectAwsSecurelyVerifyHref,
} from "@/lib/connect-aws-securely-help-content";
import {
  DESIGN_TOKENS,
  OPERATOR_LAYOUT,
  OPERATOR_LINK,
  OPERATOR_SHELL_SCROLL_OFFSET_CLASS,
  OPERATOR_TYPOGRAPHY,
} from "@/lib/design-tokens";
import type { HelpMarkdownHeading } from "@/lib/help/help-markdown-headings";
import { HELP_PAGE_LAYOUT } from "@/lib/help/help-page-layout";
import type { ProductDocumentationEntry } from "@/lib/product-documentation-registry";
import { cn } from "@/lib/utils";

const CONNECT_AWS_SECURELY_TOC_HEADINGS: readonly HelpMarkdownHeading[] = [
  { id: "security-model", title: CONNECT_AWS_SECURELY_SECURITY_HEADING, level: 2 },
  { id: "setup-aws-connection", title: CONNECT_AWS_SECURELY_SETUP_HEADING, level: 2 },
  { id: "aws-permissions", title: CONNECT_AWS_SECURELY_PERMISSIONS_HEADING, level: 2 },
  { id: "information-retained", title: "Information retained", level: 2 },
  { id: "credentials-not-retained", title: "Credentials not retained", level: 2 },
  { id: "permissions-not-required", title: "Permissions not required", level: 2 },
  { id: "troubleshoot", title: AWS_PERMISSIONS_TROUBLESHOOT_HEADING, level: 2 },
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
  const { entry } = props;
  const returnHref = props.returnHref ?? "/integrations/cloud-connections";
  const verifyHref = buildConnectAwsSecurelyVerifyHref(returnHref);

  return (
    <article
      className={cn(OPERATOR_LAYOUT.majorSectionGap, "w-full max-w-[68rem]")}
      data-testid="help-connect-aws-securely-guide"
    >
      <HelpTopicHashScroll />
      <header className={cn(HELP_PAGE_LAYOUT.articleHeader, "space-y-3 pb-4")}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 space-y-3">
            <p className={cn("m-0", OPERATOR_TYPOGRAPHY.helper)}>
              <Link href={returnHref} className={OPERATOR_LINK.nav}>
                ← {CONNECT_AWS_SECURELY_BACK_TO_CONNECTIONS}
              </Link>
              <span aria-hidden="true"> · </span>
              <a href="#troubleshoot" className={OPERATOR_LINK.nav}>
                Fix a failed permission check
              </a>
            </p>
            <HelpTopicTitleRow title={CONNECT_AWS_SECURELY_PAGE_TITLE} />
            <p className={cn("m-0 max-w-prose text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
              {CONNECT_AWS_SECURELY_PAGE_LEAD}
            </p>
            <p className={cn("m-0 max-w-prose text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
              {CONNECT_AWS_SECURELY_OPTIONAL_ZIP_NOTE}
            </p>
            <HelpTopicRegistryProvenanceLine entry={entry} />
          </div>
          <div className="flex min-w-0 flex-col items-start gap-2" data-testid="help-connect-aws-securely-header-actions">
            <div className="flex flex-wrap items-center gap-2">
              <PageContextualHelpButton />
              <Button asChild size="sm" variant="primary" data-testid="connect-aws-configure-action">
                <Link href={CONNECT_AWS_SECURELY_CONFIGURE_HREF}>{CONNECT_AWS_SECURELY_CONFIGURE_ACTION}</Link>
              </Button>
            </div>
            <p className={cn("m-0 max-w-xs text-al-text-secondary", OPERATOR_TYPOGRAPHY.micro)}>
              {CONNECT_AWS_SECURELY_WITHOUT_CONNECTION_NOTE}
            </p>
          </div>
        </div>
      </header>

      <ConnectAwsSecurelyHelpEvidenceOrientationStrip />

      <div className={HELP_PAGE_LAYOUT.contentGrid}>
        <div className="min-w-0 space-y-8" data-testid="help-connect-aws-securely-primary">
          <section aria-labelledby="security-model" className="space-y-3">
            <HelpSectionHeading id="security-model">{CONNECT_AWS_SECURELY_SECURITY_HEADING}</HelpSectionHeading>
            <Card className={DESIGN_TOKENS.surface.card} data-testid="connect-aws-securely-security-panel">
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
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <ol className={cn("m-0 min-w-0 flex-1 list-decimal space-y-2 pl-5 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
                {CONNECT_AWS_SECURELY_SETUP_STEPS.map((step) => (
                  <li key={step.id}>
                    {step.id === "open-cloud-connections" ? (
                      <>
                        Open{" "}
                        <Link href={CONNECT_AWS_SECURELY_CONFIGURE_HREF} className={OPERATOR_LINK.nav}>
                          {CONNECT_AWS_SECURELY_STEP_AWS_CONNECTION_SETTINGS_LINK}
                        </Link>{" "}
                        and begin an AWS connection.
                      </>
                    ) : step.id === "verify" ? (
                      <>
                        Save the connection, then{" "}
                        <Link href={verifyHref} className={OPERATOR_LINK.nav}>
                          run Re-poll now
                        </Link>{" "}
                        to confirm federated assume-role and inventory access. See{" "}
                        <a href="#connect-aws-securely-verification-callout" className={OPERATOR_LINK.nav}>
                          {CONNECT_AWS_SECURELY_VERIFICATION_HEADING}
                        </a>{" "}
                        below. Review{" "}
                        <Link href={CONNECT_AWS_SECURELY_CONNECTION_STATUS_HREF} className={OPERATOR_LINK.nav}>
                          {CONNECT_AWS_SECURELY_CONNECTION_STATUS_LINK_LABEL}
                        </Link>{" "}
                        for workspace-wide integration health.
                      </>
                    ) : (
                      step.text
                    )}
                  </li>
                ))}
              </ol>
              <a
                href="#connect-aws-securely-federation-panel"
                className={cn(OPERATOR_LINK.stepPill, "no-underline")}
                data-testid="connect-aws-securely-detailed-setup-link"
              >
                {CONNECT_AWS_SECURELY_DETAILED_SETUP_LINK}
              </a>
            </div>
            <div
              id="connect-aws-securely-verification-callout"
              className={cn(DESIGN_TOKENS.callout.info, "space-y-3 scroll-mt-24")}
              data-testid="connect-aws-securely-verification-callout"
            >
              <h3 className={cn("m-0", OPERATOR_TYPOGRAPHY.cardTitle)}>{CONNECT_AWS_SECURELY_VERIFICATION_HEADING}</h3>
              <div className="space-y-2">
                <p className={cn("m-0 font-medium text-al-text-primary", OPERATOR_TYPOGRAPHY.label)}>
                  {CONNECT_AWS_SECURELY_VERIFICATION_CHECKS_LABEL}
                </p>
                <ul className={cn("m-0 list-disc space-y-1 pl-5 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
                  {CONNECT_AWS_SECURELY_VERIFICATION_CHECKS.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
              <div className="space-y-2" data-testid="connect-aws-securely-does-not-verify">
                <p className={cn("m-0 font-medium text-al-text-primary", OPERATOR_TYPOGRAPHY.label)}>
                  {CONNECT_AWS_SECURELY_VERIFICATION_DOES_NOT_VERIFY_LABEL}
                </p>
                <ul className={cn("m-0 list-disc space-y-1 pl-5 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
                  {CONNECT_AWS_SECURELY_VERIFICATION_DOES_NOT_VERIFY.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            </div>
            <HelpConnectAwsSecurelyTrustPolicyPanel />
          </section>

          <section
            aria-labelledby="aws-permissions"
            className="space-y-3 border-t border-neutral-200 pt-6 dark:border-neutral-800"
            data-testid="connect-aws-securely-permissions-section"
          >
            <HelpSectionHeading id="aws-permissions">{CONNECT_AWS_SECURELY_PERMISSIONS_HEADING}</HelpSectionHeading>
            <p className={cn("m-0 max-w-prose text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
              {CONNECT_AWS_SECURELY_PERMISSIONS_AUTHORITY_NOTE}
            </p>
            <AwsPermissionsTable />
            <p className={cn("m-0 max-w-prose text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
              {CONNECT_AWS_SECURELY_RESOURCE_EXPLORER_NOTE}
            </p>
            <aside
              className={cn(DESIGN_TOKENS.callout.warn, "flex gap-3")}
              data-testid="connect-aws-securely-forbidden-policies-callout"
              aria-labelledby="connect-aws-securely-forbidden-policies-heading"
            >
              <AlertTriangle
                className="mt-0.5 h-4 w-4 shrink-0 text-amber-800 dark:text-amber-200"
                aria-hidden
              />
              <div className="min-w-0 space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <h3
                    id="connect-aws-securely-forbidden-policies-heading"
                    className={cn("m-0", OPERATOR_TYPOGRAPHY.cardTitle)}
                  >
                    {CONNECT_AWS_SECURELY_FORBIDDEN_POLICIES_HEADING}
                  </h3>
                  <StatusTag kind="needs-attention" label={CONNECT_AWS_SECURELY_FORBIDDEN_POLICIES_STATUS_LABEL} />
                </div>
                <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
                  {CONNECT_AWS_SECURELY_FORBIDDEN_POLICIES_BODY}
                </p>
              </div>
            </aside>
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

          <section
            aria-labelledby="troubleshoot"
            className="space-y-3 border-t border-neutral-200 pt-6 dark:border-neutral-800"
            data-testid="connect-aws-securely-troubleshoot-section"
          >
            <HelpSectionHeading id="troubleshoot">{AWS_PERMISSIONS_TROUBLESHOOT_HEADING}</HelpSectionHeading>
            <ul className={HELP_PAGE_LAYOUT.bulletList} data-testid="connect-aws-securely-troubleshoot-list">
              {AWS_CLOUD_CONNECTION_TROUBLESHOOTING_ITEMS.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
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
