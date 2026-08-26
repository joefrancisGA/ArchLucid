import Link from "next/link";

import { AlertTriangle } from "lucide-react";

import { GcpWifStarterPanel } from "@/app/(operator)/integrations/cloud-connections/_sections/GcpWifStarterPanel";
import { HelpConnectGcpSecurelyHeaderActions } from "@/app/(operator)/help/_sections/HelpConnectGcpSecurelyHeaderActions";
import { HelpTopicHashScroll } from "@/app/(operator)/help/HelpTopicHashScroll";
import { ConnectGcpSecurelyHelpClaimDisciplineStrip } from "@/components/help/ConnectGcpSecurelyHelpClaimDisciplineStrip";
import { ConnectGcpSecurelyHelpEvidenceOrientationStrip } from "@/components/help/ConnectGcpSecurelyHelpEvidenceOrientationStrip";
import { HelpConnectGcpSecurelyBreadcrumb } from "@/components/help/HelpConnectGcpSecurelyBreadcrumb";
import { HelpTopicRegistryProvenanceLine } from "@/components/help/HelpTopicRegistryProvenanceLine";
import { HelpTopicTableOfContents } from "@/components/help/HelpTopicTableOfContents";
import { OperatorPageHeader } from "@/components/operator/OperatorPageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { StatusTag } from "@/components/ui/status-tag";
import {
  CONNECT_GCP_SECURELY_BACK_TO_CONNECTIONS,
  CONNECT_GCP_SECURELY_CONFIGURE_HREF,
  CONNECT_GCP_SECURELY_CONNECTION_STATUS_HREF,
  CONNECT_GCP_SECURELY_CONNECTION_STATUS_LINK_LABEL,
  CONNECT_GCP_SECURELY_CONNECTION_VALUE,
  CONNECT_GCP_SECURELY_CREDENTIALS_ITEMS,
  CONNECT_GCP_SECURELY_FORBIDDEN_ROLES_BODY,
  CONNECT_GCP_SECURELY_FORBIDDEN_ROLES_HEADING,
  CONNECT_GCP_SECURELY_FORBIDDEN_ROLES_STATUS_LABEL,
  CONNECT_GCP_SECURELY_PAGE_LEAD,
  CONNECT_GCP_SECURELY_PERMISSIONS_ITEMS,
  CONNECT_GCP_SECURELY_RETAINED_ITEMS,
  CONNECT_GCP_SECURELY_ROLES_HEADING,
  CONNECT_GCP_SECURELY_ROLES_NOTE,
  CONNECT_GCP_SECURELY_SCHEDULED_COLLECTION_NOTE,
  CONNECT_GCP_SECURELY_SECURITY_HEADING,
  CONNECT_GCP_SECURELY_SECURITY_ITEMS,
  CONNECT_GCP_SECURELY_SETUP_HEADING,
  CONNECT_GCP_SECURELY_SETUP_STEPS,
  CONNECT_GCP_SECURELY_UPLOAD_INVENTORY_NOTE,
  CONNECT_GCP_SECURELY_VERIFICATION_CHECKS,
  CONNECT_GCP_SECURELY_VERIFICATION_CHECKS_LABEL,
  CONNECT_GCP_SECURELY_VERIFICATION_DOES_NOT_VERIFY,
  CONNECT_GCP_SECURELY_VERIFICATION_DOES_NOT_VERIFY_LABEL,
  CONNECT_GCP_SECURELY_VERIFICATION_HEADING,
  CONNECT_GCP_SECURELY_WIF_IDENTITY_INTRO,
} from "@/lib/connect-gcp-securely-help-content";
import {
  CONNECT_GCP_SECURELY_HELP_PRIMARY_CONTENT_ID,
  CONNECT_GCP_SECURELY_HELP_SKIP_LINK_LABEL,
} from "@/lib/connect-gcp-securely-help-page-copy";
import {
  GCP_CLOUD_CONNECTION_API_PREREQUISITES,
  GCP_CLOUD_CONNECTION_PERMISSION_ROWS,
  GCP_CLOUD_CONNECTION_TROUBLESHOOTING_ITEMS,
  formatGcpPermissionRequirementLabel,
} from "@/lib/gcp-cloud-connection-permissions-manifest";
import { GCP_PERMISSIONS_TROUBLESHOOT_HEADING } from "@/lib/gcp-cloud-connection-permissions-copy";
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
import { operatorPageContainerClass } from "@/components/operator/OperatorPageContainer";

const CONNECT_GCP_SECURELY_TOC_HEADINGS: readonly HelpMarkdownHeading[] = [
  { id: "security-model", title: CONNECT_GCP_SECURELY_SECURITY_HEADING, level: 2 },
  { id: "setup-gcp-connection", title: CONNECT_GCP_SECURELY_SETUP_HEADING, level: 2 },
  { id: "gcp-roles", title: CONNECT_GCP_SECURELY_ROLES_HEADING, level: 2 },
  { id: "verification", title: CONNECT_GCP_SECURELY_VERIFICATION_HEADING, level: 2 },
  { id: "information-retained", title: "Information retained", level: 2 },
  { id: "credentials-not-retained", title: "Credentials not retained", level: 2 },
  { id: "permissions-not-required", title: "Permissions not required", level: 2 },
  { id: "troubleshoot", title: GCP_PERMISSIONS_TROUBLESHOOT_HEADING, level: 2 },
];

type HelpConnectGcpSecurelyGuideViewProps = {
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

function ClassificationList(props: { readonly items: readonly string[] }): React.ReactElement {
  return (
    <ul className={cn("m-0 list-disc space-y-1.5 pl-5", OPERATOR_TYPOGRAPHY.body)}>
      {props.items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  );
}

function GcpRolesTable(): React.ReactElement {
  return (
    <div className={HELP_PAGE_LAYOUT.tableWrap} data-testid="connect-gcp-securely-roles-table">
      <table className={HELP_PAGE_LAYOUT.table}>
        <caption className="sr-only">GCP roles for cloud connections</caption>
        <thead>
          <tr>
            <th scope="col" className={HELP_PAGE_LAYOUT.tableHeadCell}>
              GCP role
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
          {GCP_CLOUD_CONNECTION_PERMISSION_ROWS.map((row, index) => (
            <tr
              key={row.gcpRole}
              className={index % 2 === 0 ? HELP_PAGE_LAYOUT.tableRowOdd : HELP_PAGE_LAYOUT.tableRowEven}
            >
              <th scope="row" className={HELP_PAGE_LAYOUT.tableBodyCell}>
                {row.displayName} ({row.gcpRole})
              </th>
              <td className={HELP_PAGE_LAYOUT.tableBodyCell}>
                <span className="font-semibold">{formatGcpPermissionRequirementLabel(row.requirement)}</span>
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

/** Buyer-safe GCP connector setup for `/help/cloud-connections/gcp` (HGC). */
export function HelpConnectGcpSecurelyGuideView(props: HelpConnectGcpSecurelyGuideViewProps): React.ReactElement {
  const { entry } = props;
  const returnHref = props.returnHref ?? CONNECT_GCP_SECURELY_CONFIGURE_HREF;

  return (
    <article
      className={cn(operatorPageContainerClass("workflow"), OPERATOR_LAYOUT.majorSectionGap)}
      data-testid="help-connect-gcp-securely-guide"
    >
      <a
        href={`#${CONNECT_GCP_SECURELY_HELP_PRIMARY_CONTENT_ID}`}
        className={HELP_PAGE_LAYOUT.technicalReferenceSkipLink}
      >
        {CONNECT_GCP_SECURELY_HELP_SKIP_LINK_LABEL}
      </a>

      <HelpTopicHashScroll />

      <OperatorPageHeader
        title={entry.title}
        titleTestId="help-connect-gcp-securely-page-title"
        subtitle={entry.summary}
        headingLevel="h1"
        navHref="/help/cloud-connections/gcp"
        breadcrumb={<HelpConnectGcpSecurelyBreadcrumb topicTitle={entry.title} />}
        metadata={
          <div className="space-y-2">
            <p className={cn("m-0 max-w-3xl text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
              <Link href={returnHref} className={OPERATOR_LINK.nav} data-testid="connect-gcp-back-to-connections">
                ← {CONNECT_GCP_SECURELY_BACK_TO_CONNECTIONS}
              </Link>
              <span aria-hidden="true"> · </span>
              <a href="#troubleshoot" className={OPERATOR_LINK.nav}>
                Fix a failed permission check
              </a>
            </p>
            <HelpTopicRegistryProvenanceLine entry={entry} />
          </div>
        }
        actions={<HelpConnectGcpSecurelyHeaderActions entry={entry} />}
      />

      <ConnectGcpSecurelyHelpClaimDisciplineStrip />

      <div
        id={CONNECT_GCP_SECURELY_HELP_PRIMARY_CONTENT_ID}
        className={cn("scroll-mt-24 space-y-6", OPERATOR_LAYOUT.sectionStack)}
        data-testid="help-connect-gcp-securely-primary-content"
      >
      <ConnectGcpSecurelyHelpEvidenceOrientationStrip />

      <div className="space-y-3">
        <p className={cn("m-0 max-w-3xl text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>{CONNECT_GCP_SECURELY_PAGE_LEAD}</p>
        <p className={cn("m-0 max-w-3xl text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
          {CONNECT_GCP_SECURELY_CONNECTION_VALUE}
        </p>
        <p className={cn("m-0 max-w-3xl text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
          {CONNECT_GCP_SECURELY_UPLOAD_INVENTORY_NOTE}
        </p>
        <p className={cn("m-0 max-w-3xl text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
          {CONNECT_GCP_SECURELY_SCHEDULED_COLLECTION_NOTE}
        </p>
      </div>

      <div className={HELP_PAGE_LAYOUT.contentGrid}>
        <div className="min-w-0 space-y-8" data-testid="help-connect-gcp-securely-primary">
          <section aria-labelledby="security-model" className="space-y-3">
            <HelpSectionHeading id="security-model">{CONNECT_GCP_SECURELY_SECURITY_HEADING}</HelpSectionHeading>
            <Card className={DESIGN_TOKENS.surface.card} data-testid="connect-gcp-securely-security-panel">
              <CardContent className="space-y-3 pt-6">
                <ul className="m-0 list-none space-y-3 p-0">
                  {CONNECT_GCP_SECURELY_SECURITY_ITEMS.map((item) => (
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
            aria-labelledby="setup-gcp-connection"
            className="space-y-3 border-t border-neutral-200 pt-6 dark:border-neutral-800"
            data-testid="connect-gcp-securely-setup-section"
          >
            <HelpSectionHeading id="setup-gcp-connection">{CONNECT_GCP_SECURELY_SETUP_HEADING}</HelpSectionHeading>
            <ol className={cn("m-0 list-decimal space-y-2 pl-5 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
              {CONNECT_GCP_SECURELY_SETUP_STEPS.map((step) => (
                <li key={step.id}>
                  {step.id === "open-cloud-connections" ? (
                    <>
                      Open{" "}
                      <Link href={CONNECT_GCP_SECURELY_CONFIGURE_HREF} className={OPERATOR_LINK.nav}>
                        Cloud connections
                      </Link>{" "}
                      and begin a GCP connection.
                    </>
                  ) : step.id === "verify" ? (
                    <>
                      Save the connection, then run Re-poll now to confirm federation and inventory access. See{" "}
                      <a href="#verification" className={OPERATOR_LINK.nav}>
                        {CONNECT_GCP_SECURELY_VERIFICATION_HEADING}
                      </a>{" "}
                      below. Review{" "}
                      <Link href={CONNECT_GCP_SECURELY_CONNECTION_STATUS_HREF} className={OPERATOR_LINK.nav}>
                        {CONNECT_GCP_SECURELY_CONNECTION_STATUS_LINK_LABEL}
                      </Link>{" "}
                      for workspace-wide integration health.
                    </>
                  ) : (
                    step.text
                  )}
                </li>
              ))}
            </ol>
            <p className={cn("m-0 max-w-3xl text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
              {CONNECT_GCP_SECURELY_WIF_IDENTITY_INTRO}
            </p>
            <GcpWifStarterPanel />
          </section>

          <section
            aria-labelledby="gcp-roles"
            className="space-y-3 border-t border-neutral-200 pt-6 dark:border-neutral-800"
            data-testid="connect-gcp-securely-roles-section"
          >
            <HelpSectionHeading id="gcp-roles">{CONNECT_GCP_SECURELY_ROLES_HEADING}</HelpSectionHeading>
            <p className={cn("m-0 max-w-3xl text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
              {CONNECT_GCP_SECURELY_ROLES_NOTE}
            </p>
            <ul
              className={cn("m-0 list-disc space-y-1.5 pl-5 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}
              data-testid="connect-gcp-securely-prerequisites"
            >
              {GCP_CLOUD_CONNECTION_API_PREREQUISITES.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
            <GcpRolesTable />
            <aside
              className={cn(DESIGN_TOKENS.callout.warn, "flex gap-3")}
              data-testid="connect-gcp-securely-forbidden-roles-callout"
              aria-labelledby="connect-gcp-securely-forbidden-roles-heading"
            >
              <AlertTriangle
                className="mt-0.5 h-4 w-4 shrink-0 text-amber-800 dark:text-amber-200"
                aria-hidden
              />
              <div className="min-w-0 space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <h3
                    id="connect-gcp-securely-forbidden-roles-heading"
                    className={cn("m-0", OPERATOR_TYPOGRAPHY.cardTitle)}
                  >
                    {CONNECT_GCP_SECURELY_FORBIDDEN_ROLES_HEADING}
                  </h3>
                  <StatusTag kind="needs-attention" label={CONNECT_GCP_SECURELY_FORBIDDEN_ROLES_STATUS_LABEL} />
                </div>
                <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
                  {CONNECT_GCP_SECURELY_FORBIDDEN_ROLES_BODY}
                </p>
              </div>
            </aside>
          </section>

          <section
            aria-labelledby="verification"
            className="space-y-3 border-t border-neutral-200 pt-6 dark:border-neutral-800"
            data-testid="connect-gcp-securely-verification-section"
          >
            <HelpSectionHeading id="verification">{CONNECT_GCP_SECURELY_VERIFICATION_HEADING}</HelpSectionHeading>
            <div
              id="connect-gcp-securely-verification-callout"
              className={cn(DESIGN_TOKENS.callout.info, "space-y-3 scroll-mt-24")}
              data-testid="connect-gcp-securely-verification-callout"
            >
              <div className="space-y-2">
                <p className={cn("m-0 font-medium text-al-text-primary", OPERATOR_TYPOGRAPHY.label)}>
                  {CONNECT_GCP_SECURELY_VERIFICATION_CHECKS_LABEL}
                </p>
                <ul className={cn("m-0 list-disc space-y-1 pl-5 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
                  {CONNECT_GCP_SECURELY_VERIFICATION_CHECKS.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
              <div className="space-y-2" data-testid="connect-gcp-securely-does-not-verify">
                <p className={cn("m-0 font-medium text-al-text-primary", OPERATOR_TYPOGRAPHY.label)}>
                  {CONNECT_GCP_SECURELY_VERIFICATION_DOES_NOT_VERIFY_LABEL}
                </p>
                <ul className={cn("m-0 list-disc space-y-1 pl-5 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
                  {CONNECT_GCP_SECURELY_VERIFICATION_DOES_NOT_VERIFY.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            </div>
          </section>

          <section
            aria-labelledby="information-retained"
            className="border-t border-neutral-200 pt-6 dark:border-neutral-800"
            data-testid="connect-gcp-securely-classification-section"
          >
            <div className="grid gap-6 lg:grid-cols-2">
              <div className="space-y-3">
                <HelpSectionHeading id="information-retained">Information retained</HelpSectionHeading>
                <ClassificationList items={CONNECT_GCP_SECURELY_RETAINED_ITEMS} />
              </div>
              <div className="space-y-3">
                <HelpSectionHeading id="credentials-not-retained">Credentials not retained</HelpSectionHeading>
                <ClassificationList items={CONNECT_GCP_SECURELY_CREDENTIALS_ITEMS} />
              </div>
            </div>
            <div className="mt-6 space-y-3">
              <HelpSectionHeading id="permissions-not-required">Permissions not required</HelpSectionHeading>
              <ClassificationList items={CONNECT_GCP_SECURELY_PERMISSIONS_ITEMS} />
            </div>
          </section>

          <section
            aria-labelledby="troubleshoot"
            className="space-y-3 border-t border-neutral-200 pt-6 dark:border-neutral-800"
            data-testid="connect-gcp-securely-troubleshoot-section"
          >
            <HelpSectionHeading id="troubleshoot">{GCP_PERMISSIONS_TROUBLESHOOT_HEADING}</HelpSectionHeading>
            <ul className={HELP_PAGE_LAYOUT.bulletList} data-testid="connect-gcp-securely-troubleshoot-list">
              {GCP_CLOUD_CONNECTION_TROUBLESHOOTING_ITEMS.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </section>
        </div>
        <HelpTopicTableOfContents headings={CONNECT_GCP_SECURELY_TOC_HEADINGS} enableScrollSpy />
      </div>
      </div>
    </article>
  );
}
