import Link from "next/link";

import { OPERATOR_BODY_INLINE_LINK_CLASS } from "@/lib/design-tokens";

import { AlertTriangle } from "lucide-react";

import { AzureCloudConnectionRolesTable } from "@/components/help/AzureCloudConnectionRolesTable";
import { ConnectAzureSecurelyHelpClaimDisciplineStrip } from "@/components/help/ConnectAzureSecurelyHelpClaimDisciplineStrip";
import { ConnectAzureSecurelyHelpEvidenceOrientationStrip } from "@/components/help/ConnectAzureSecurelyHelpEvidenceOrientationStrip";
import { HelpTopicTitleRow } from "@/components/help/HelpTopicPageHeader";
import { HelpTopicHashScroll } from "@/app/(operator)/help/HelpTopicHashScroll";
import { HelpTopicRegistryProvenanceLine } from "@/components/help/HelpTopicRegistryProvenanceLine";
import { HelpTopicTableOfContents } from "@/components/help/HelpTopicTableOfContents";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { StatusTag } from "@/components/ui/status-tag";
import {
  AZURE_CLOUD_CONNECTION_SCOPE_GUIDANCE,
  AZURE_CLOUD_CONNECTION_TROUBLESHOOTING_ITEMS,
} from "@/lib/azure-cloud-connection-permissions-manifest";
import { AZURE_PERMISSIONS_SCOPE_HEADING, AZURE_PERMISSIONS_TROUBLESHOOT_HEADING } from "@/lib/azure-cloud-connection-permissions-copy";
import {
  CONNECT_AZURE_SECURELY_BACK_TO_CONNECTIONS,
  CONNECT_AZURE_SECURELY_CONFIGURE_ACTION,
  CONNECT_AZURE_SECURELY_CONFIGURE_HREF,
  CONNECT_AZURE_SECURELY_DETAILED_SETUP_LINK,
  CONNECT_AZURE_SECURELY_FORBIDDEN_ROLES_BODY,
  CONNECT_AZURE_SECURELY_FORBIDDEN_ROLES_HEADING,
  CONNECT_AZURE_SECURELY_FORBIDDEN_ROLES_STATUS_LABEL,
  CONNECT_AZURE_SECURELY_PAGE_LEAD,
  CONNECT_AZURE_SECURELY_PAGE_TITLE,
  CONNECT_AZURE_SECURELY_PERMISSIONS_AUTHORITY_NOTE,
  CONNECT_AZURE_SECURELY_PERMISSIONS_GUIDE_HREF,
  CONNECT_AZURE_SECURELY_PERMISSIONS_ITEMS,
  CONNECT_AZURE_SECURELY_RETAINED_ITEMS,
  CONNECT_AZURE_SECURELY_ROLES_HEADING,
  CONNECT_AZURE_SECURELY_SECURITY_HEADING,
  CONNECT_AZURE_SECURELY_SECURITY_ITEMS,
  CONNECT_AZURE_SECURELY_SETUP_HEADING,
  CONNECT_AZURE_SECURELY_SETUP_STEPS,
  CONNECT_AZURE_SECURELY_STEP_AZURE_CONNECTION_SETTINGS_LINK,
  CONNECT_AZURE_SECURELY_VERIFICATION_CHECKS,
  CONNECT_AZURE_SECURELY_VERIFICATION_CHECKS_LABEL,
  CONNECT_AZURE_SECURELY_VERIFICATION_DOES_NOT_VERIFY,
  CONNECT_AZURE_SECURELY_VERIFICATION_DOES_NOT_VERIFY_LABEL,
  CONNECT_AZURE_SECURELY_VERIFICATION_HEADING,
  CONNECT_AZURE_SECURELY_WITHOUT_CONNECTION_NOTE,
  CONNECT_AZURE_SECURELY_CONNECTION_STATUS_HREF,
  CONNECT_AZURE_SECURELY_CONNECTION_STATUS_LINK_LABEL,
  CONNECT_AZURE_SECURELY_CREDENTIALS_ITEMS,
  buildConnectAzureSecurelyVerifyHref,
} from "@/lib/connect-azure-securely-help-content";
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

const CONNECT_AZURE_SECURELY_TOC_HEADINGS: readonly HelpMarkdownHeading[] = [
  { id: "security-model", title: CONNECT_AZURE_SECURELY_SECURITY_HEADING, level: 2 },
  { id: "setup-azure-connection", title: CONNECT_AZURE_SECURELY_SETUP_HEADING, level: 2 },
  { id: "azure-roles", title: CONNECT_AZURE_SECURELY_ROLES_HEADING, level: 2 },
  { id: "information-retained", title: "Information retained", level: 2 },
  { id: "credentials-not-retained", title: "Credentials not retained", level: 2 },
  { id: "permissions-not-required", title: "Permissions not required", level: 2 },
  { id: "troubleshoot", title: AZURE_PERMISSIONS_TROUBLESHOOT_HEADING, level: 2 },
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
  const { entry } = props;
  const returnHref = props.returnHref ?? "/integrations/cloud-connections";
  const verifyHref = buildConnectAzureSecurelyVerifyHref(returnHref);

  return (
    <article
      className={cn(operatorPageContainerClass("workflow"), OPERATOR_LAYOUT.majorSectionGap)}
      data-testid="help-connect-azure-securely-guide"
    >
      <HelpTopicHashScroll />
      <header className={cn(HELP_PAGE_LAYOUT.articleHeader, "space-y-3 pb-4")}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 space-y-3">
            <p className={cn("m-0", OPERATOR_TYPOGRAPHY.helper)}>
              <Link href={returnHref} className={OPERATOR_BODY_INLINE_LINK_CLASS}>
                ← {CONNECT_AZURE_SECURELY_BACK_TO_CONNECTIONS}
              </Link>
              <span aria-hidden="true"> · </span>
              <a href="#troubleshoot" className={OPERATOR_BODY_INLINE_LINK_CLASS}>
                Fix a failed permission check
              </a>
            </p>
            <HelpTopicTitleRow title={CONNECT_AZURE_SECURELY_PAGE_TITLE} />
            <p className={cn("m-0 max-w-prose text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
              {CONNECT_AZURE_SECURELY_PAGE_LEAD}
            </p>
            <HelpTopicRegistryProvenanceLine entry={entry} />
          </div>
          <div className="flex min-w-0 flex-col items-start gap-2">
            <Button asChild size="sm" variant="primary" data-testid="connect-azure-configure-action">
              <Link href={CONNECT_AZURE_SECURELY_CONFIGURE_HREF}>{CONNECT_AZURE_SECURELY_CONFIGURE_ACTION}</Link>
            </Button>
            <p className={cn("m-0 max-w-xs text-al-text-secondary", OPERATOR_TYPOGRAPHY.micro)}>
              {CONNECT_AZURE_SECURELY_WITHOUT_CONNECTION_NOTE}
            </p>
          </div>
        </div>
      </header>

      <ConnectAzureSecurelyHelpClaimDisciplineStrip />

      <div className={HELP_PAGE_LAYOUT.contentGrid}>
        <div className="min-w-0 space-y-8" data-testid="help-connect-azure-securely-primary">
          <ConnectAzureSecurelyHelpEvidenceOrientationStrip />

          <section aria-labelledby="security-model" className="space-y-3">
            <HelpSectionHeading id="security-model">{CONNECT_AZURE_SECURELY_SECURITY_HEADING}</HelpSectionHeading>
            <Card className={DESIGN_TOKENS.surface.card} data-testid="connect-azure-securely-security-panel">
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
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <ol className={cn("m-0 min-w-0 flex-1 list-decimal space-y-2 pl-5 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
                {CONNECT_AZURE_SECURELY_SETUP_STEPS.map((step) => (
                  <li key={step.id}>
                    {step.id === "open-cloud-connections" ? (
                      <>
                        Open{" "}
                        <Link
                          href={CONNECT_AZURE_SECURELY_CONFIGURE_HREF}
                          className={OPERATOR_BODY_INLINE_LINK_CLASS}
                        >
                          {CONNECT_AZURE_SECURELY_STEP_AZURE_CONNECTION_SETTINGS_LINK}
                        </Link>{" "}
                        and begin an Azure connection.
                      </>
                    ) : step.id === "verify" ? (
                      <>
                        Return to ArchLucid and{" "}
                        <Link href={verifyHref} className={OPERATOR_LINK.nav}>
                          verify the connection
                        </Link>
                        . See{" "}
                        <a href="#connect-azure-securely-verification-callout" className={OPERATOR_LINK.nav}>
                          {CONNECT_AZURE_SECURELY_VERIFICATION_HEADING}
                        </a>{" "}
                        below. Review{" "}
                        <Link href={CONNECT_AZURE_SECURELY_CONNECTION_STATUS_HREF} className={OPERATOR_LINK.nav}>
                          {CONNECT_AZURE_SECURELY_CONNECTION_STATUS_LINK_LABEL}
                        </Link>{" "}
                        for workspace-wide integration health.
                      </>
                    ) : (
                      step.text
                    )}
                  </li>
                ))}
              </ol>
              <Link
                href={CONNECT_AZURE_SECURELY_PERMISSIONS_GUIDE_HREF}
                className={cn(OPERATOR_LINK.stepPill, "no-underline")}
                data-testid="connect-azure-securely-detailed-setup-link"
              >
                {CONNECT_AZURE_SECURELY_DETAILED_SETUP_LINK}
              </Link>
            </div>
            <div
              id="connect-azure-securely-verification-callout"
              className={cn(DESIGN_TOKENS.callout.info, "space-y-3 scroll-mt-24")}
              data-testid="connect-azure-securely-verification-callout"
            >
              <h3 className={cn("m-0", OPERATOR_TYPOGRAPHY.cardTitle)}>{CONNECT_AZURE_SECURELY_VERIFICATION_HEADING}</h3>
              <div className="space-y-2">
                <p className={cn("m-0 font-medium text-al-text-primary", OPERATOR_TYPOGRAPHY.label)}>
                  {CONNECT_AZURE_SECURELY_VERIFICATION_CHECKS_LABEL}
                </p>
                <ul className={cn("m-0 list-disc space-y-1 pl-5 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
                  {CONNECT_AZURE_SECURELY_VERIFICATION_CHECKS.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
              <div className="space-y-2" data-testid="connect-azure-securely-does-not-verify">
                <p className={cn("m-0 font-medium text-al-text-primary", OPERATOR_TYPOGRAPHY.label)}>
                  {CONNECT_AZURE_SECURELY_VERIFICATION_DOES_NOT_VERIFY_LABEL}
                </p>
                <ul className={cn("m-0 list-disc space-y-1 pl-5 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
                  {CONNECT_AZURE_SECURELY_VERIFICATION_DOES_NOT_VERIFY.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            </div>
          </section>

          <section
            aria-labelledby="azure-roles"
            className="space-y-3 border-t border-neutral-200 pt-6 dark:border-neutral-800"
            data-testid="connect-azure-securely-roles-section"
          >
            <HelpSectionHeading id="azure-roles">{CONNECT_AZURE_SECURELY_ROLES_HEADING}</HelpSectionHeading>
            <p className={cn("m-0 max-w-prose text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
              {CONNECT_AZURE_SECURELY_PERMISSIONS_AUTHORITY_NOTE}{" "}
              <Link href={CONNECT_AZURE_SECURELY_PERMISSIONS_GUIDE_HREF} className={OPERATOR_LINK.nav}>
                Azure permissions guide
              </Link>
              .
            </p>
            <AzureCloudConnectionRolesTable expandedDetails={false} testId="connect-azure-securely-roles-table" />
            <div className="space-y-3" data-testid="connect-azure-securely-scope-guidance">
              <h3 className={cn("m-0", OPERATOR_TYPOGRAPHY.cardTitle)}>{AZURE_PERMISSIONS_SCOPE_HEADING}</h3>
              <p className={cn("m-0 max-w-prose text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
                {AZURE_CLOUD_CONNECTION_SCOPE_GUIDANCE.recommendedTier2}
              </p>
              <ul className={HELP_PAGE_LAYOUT.bulletList}>
                <li>{AZURE_CLOUD_CONNECTION_SCOPE_GUIDANCE.multipleSubscriptions}</li>
                <li>{AZURE_CLOUD_CONNECTION_SCOPE_GUIDANCE.resourceGroupLimitation}</li>
                <li>{AZURE_CLOUD_CONNECTION_SCOPE_GUIDANCE.managementGroupLimitation}</li>
                <li>{AZURE_CLOUD_CONNECTION_SCOPE_GUIDANCE.billingScope}</li>
              </ul>
            </div>
            <aside
              className={cn(DESIGN_TOKENS.callout.warn, "flex gap-3")}
              data-testid="connect-azure-securely-forbidden-roles-callout"
              aria-labelledby="connect-azure-securely-forbidden-roles-heading"
            >
              <AlertTriangle
                className="mt-0.5 h-4 w-4 shrink-0 text-amber-800 dark:text-amber-200"
                aria-hidden
              />
              <div className="min-w-0 space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <h3
                    id="connect-azure-securely-forbidden-roles-heading"
                    className={cn("m-0", OPERATOR_TYPOGRAPHY.cardTitle)}
                  >
                    {CONNECT_AZURE_SECURELY_FORBIDDEN_ROLES_HEADING}
                  </h3>
                  <StatusTag kind="needs-attention" label={CONNECT_AZURE_SECURELY_FORBIDDEN_ROLES_STATUS_LABEL} />
                </div>
                <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
                  {CONNECT_AZURE_SECURELY_FORBIDDEN_ROLES_BODY}
                </p>
              </div>
            </aside>
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

          <section
            aria-labelledby="troubleshoot"
            className="space-y-3 border-t border-neutral-200 pt-6 dark:border-neutral-800"
            data-testid="connect-azure-securely-troubleshoot-section"
          >
            <HelpSectionHeading id="troubleshoot">{AZURE_PERMISSIONS_TROUBLESHOOT_HEADING}</HelpSectionHeading>
            <ul className={HELP_PAGE_LAYOUT.bulletList} data-testid="connect-azure-securely-troubleshoot-list">
              {AZURE_CLOUD_CONNECTION_TROUBLESHOOTING_ITEMS.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </section>
        </div>
        <HelpTopicTableOfContents headings={CONNECT_AZURE_SECURELY_TOC_HEADINGS} enableScrollSpy />
      </div>
    </article>
  );
}
