import Link from "next/link";

import { AlertTriangle } from "lucide-react";

import { HelpConnectAwsSecurelyHeaderActions } from "@/app/(operator)/help/_sections/HelpConnectAwsSecurelyHeaderActions";
import { HelpConnectAwsSecurelyTrustPolicyPanel } from "@/app/(operator)/help/_sections/HelpConnectAwsSecurelyTrustPolicyPanel";
import { HelpTopicHashScroll } from "@/app/(operator)/help/HelpTopicHashScroll";
import { AwsCloudConnectionPermissionsTable } from "@/components/help/AwsCloudConnectionPermissionsTable";
import { ConnectAwsSecurelyHelpEvidenceOrientationStrip } from "@/components/help/ConnectAwsSecurelyHelpEvidenceOrientationStrip";
import { HelpTopicRegistryProvenanceLine } from "@/components/help/HelpTopicRegistryProvenanceLine";
import { HelpTopicTableOfContents } from "@/components/help/HelpTopicTableOfContents";
import { OperatorPageHeader } from "@/components/operator/OperatorPageHeader";
import {
  AWS_CLOUD_CONNECTION_API_PREREQUISITES,
  AWS_CLOUD_CONNECTION_TROUBLESHOOTING_ITEMS,
} from "@/lib/aws-cloud-connection-permissions-manifest";
import { AWS_PERMISSIONS_TROUBLESHOOT_HEADING } from "@/lib/aws-cloud-connection-permissions-copy";
import {
  CONNECT_AWS_SECURELY_BACK_TO_CONNECTIONS,
  CONNECT_AWS_SECURELY_CONFIGURE_HREF,
  CONNECT_AWS_SECURELY_CONNECTION_STATUS_HREF,
  CONNECT_AWS_SECURELY_CONNECTION_STATUS_LINK_LABEL,
  CONNECT_AWS_SECURELY_CREDENTIALS_ITEMS,
  CONNECT_AWS_SECURELY_DATA_HANDLING_HEADING,
  CONNECT_AWS_SECURELY_DETAILED_SETUP_LINK,
  CONNECT_AWS_SECURELY_FORBIDDEN_POLICIES_BODY,
  CONNECT_AWS_SECURELY_FORBIDDEN_POLICIES_HEADING,
  CONNECT_AWS_SECURELY_OPTIONAL_ZIP_NOTE,
  CONNECT_AWS_SECURELY_PAGE_LEAD,
  CONNECT_AWS_SECURELY_PERMISSIONS_AUTHORITY_NOTE,
  CONNECT_AWS_SECURELY_PERMISSIONS_HEADING,
  CONNECT_AWS_SECURELY_PERMISSIONS_NOT_REQUIRED_NOTE,
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
  CONNECT_AWS_SECURELY_WRITE_ACCESS_NOTE,
  buildConnectAwsSecurelyVerifyHref,
} from "@/lib/connect-aws-securely-help-content";
import { CONNECT_AWS_SECURELY_FOLLOW_UPS_TITLE } from "@/lib/connect-aws-securely-help-evidence-copy";
import {
  CONNECT_AWS_SECURELY_HELP_PRIMARY_CONTENT_ID,
  CONNECT_AWS_SECURELY_HELP_SKIP_LINK_LABEL,
} from "@/lib/connect-aws-securely-help-page-copy";
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

const CONNECT_AWS_SECURELY_TOC_HEADINGS: readonly HelpMarkdownHeading[] = [
  { id: "security-model", title: CONNECT_AWS_SECURELY_SECURITY_HEADING, level: 2 },
  { id: "setup-aws-connection", title: CONNECT_AWS_SECURELY_SETUP_HEADING, level: 2 },
  { id: "aws-permissions", title: CONNECT_AWS_SECURELY_PERMISSIONS_HEADING, level: 2 },
  { id: "verification", title: CONNECT_AWS_SECURELY_VERIFICATION_HEADING, level: 2 },
  { id: "data-handling", title: CONNECT_AWS_SECURELY_DATA_HANDLING_HEADING, level: 2 },
  { id: "troubleshoot", title: AWS_PERMISSIONS_TROUBLESHOOT_HEADING, level: 2 },
  { id: "where-to-go-next", title: CONNECT_AWS_SECURELY_FOLLOW_UPS_TITLE, level: 2 },
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

function ClassificationList(props: { readonly items: readonly string[] }): React.ReactElement {
  return (
    <ul className={cn("m-0 list-disc space-y-1.5 pl-5", OPERATOR_TYPOGRAPHY.body)}>
      {props.items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  );
}

/** Buyer-safe AWS connector setup for `/help/cloud-connections/aws` (HEC). */
export function HelpConnectAwsSecurelyGuideView(props: HelpConnectAwsSecurelyGuideViewProps): React.ReactElement {
  const { entry } = props;
  const returnHref = props.returnHref ?? CONNECT_AWS_SECURELY_CONFIGURE_HREF;
  const verifyHref = buildConnectAwsSecurelyVerifyHref(returnHref);

  return (
    <article
      className={cn(operatorPageContainerClass("workflow"), OPERATOR_LAYOUT.majorSectionGap)}
      data-testid="help-connect-aws-securely-guide"
    >
      <a href="#security-model" className={HELP_PAGE_LAYOUT.technicalReferenceSkipLink}>
        {CONNECT_AWS_SECURELY_HELP_SKIP_LINK_LABEL}
      </a>

      <HelpTopicHashScroll />

      <OperatorPageHeader
        title={entry.title}
        titleTestId="help-connect-aws-securely-page-title"
        subtitle={`${CONNECT_AWS_SECURELY_PAGE_LEAD} ${CONNECT_AWS_SECURELY_WITHOUT_CONNECTION_NOTE}`}
        headingLevel="h1"
        navHref="/help/cloud-connections/aws"
        metadata={
          <div className="space-y-2">
            <p className={cn("m-0 max-w-3xl text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
              <Link href={returnHref} className={OPERATOR_LINK.nav} data-testid="connect-aws-back-to-connections">
                {CONNECT_AWS_SECURELY_BACK_TO_CONNECTIONS}
              </Link>
              <span aria-hidden="true"> · </span>
              <a href="#troubleshoot" className={OPERATOR_LINK.nav}>
                Fix a failed permission check
              </a>
            </p>
            <HelpTopicRegistryProvenanceLine entry={entry} />
          </div>
        }
        actions={<HelpConnectAwsSecurelyHeaderActions entry={entry} />}
      />

      <div
        id={CONNECT_AWS_SECURELY_HELP_PRIMARY_CONTENT_ID}
        className={cn("scroll-mt-24", OPERATOR_LAYOUT.sectionStack)}
        data-testid="help-connect-aws-securely-primary-content"
      >
        <div className={HELP_PAGE_LAYOUT.contentGrid}>
          <div className="min-w-0 space-y-4" data-testid="help-connect-aws-securely-primary">
            <section aria-labelledby="security-model" className="space-y-3">
              <HelpSectionHeading id="security-model">{CONNECT_AWS_SECURELY_SECURITY_HEADING}</HelpSectionHeading>
              <p className={cn("m-0 max-w-3xl text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
                {CONNECT_AWS_SECURELY_OPTIONAL_ZIP_NOTE}
              </p>
              <div
                className="space-y-3 rounded-md border border-neutral-200 p-4 dark:border-neutral-700"
                data-testid="connect-aws-securely-security-panel"
              >
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
              </div>
            </section>

            <section
              aria-labelledby="setup-aws-connection"
              className="space-y-3 border-t border-neutral-200 pt-4 dark:border-neutral-800"
              data-testid="connect-aws-securely-setup-section"
            >
              <HelpSectionHeading id="setup-aws-connection">{CONNECT_AWS_SECURELY_SETUP_HEADING}</HelpSectionHeading>
              <ol className={cn("m-0 list-decimal space-y-2 pl-5 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
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
                    ) : step.id === "configure-trust" ? (
                      <>
                        Create a read-only IAM role with an OIDC trust policy for ArchLucid&apos;s federated identity.{" "}
                        <a href="#connect-aws-securely-federation-panel" className={OPERATOR_LINK.nav}>
                          {CONNECT_AWS_SECURELY_DETAILED_SETUP_LINK}
                        </a>
                      </>
                    ) : step.id === "verify" ? (
                      <>
                        Save the connection, then{" "}
                        <Link href={verifyHref} className={OPERATOR_LINK.nav}>
                          run Re-poll now
                        </Link>{" "}
                        to confirm federated assume-role and inventory access.
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
              className="space-y-3 border-t border-neutral-200 pt-4 dark:border-neutral-800"
              data-testid="connect-aws-securely-permissions-section"
            >
              <HelpSectionHeading id="aws-permissions">{CONNECT_AWS_SECURELY_PERMISSIONS_HEADING}</HelpSectionHeading>
              <p className={cn("m-0 max-w-3xl text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
                {CONNECT_AWS_SECURELY_PERMISSIONS_AUTHORITY_NOTE}
              </p>
              <ul
                className={cn("m-0 list-disc space-y-1.5 pl-5 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}
                data-testid="connect-aws-securely-prerequisites"
              >
                {AWS_CLOUD_CONNECTION_API_PREREQUISITES.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
              <p className={cn("m-0 max-w-3xl text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
                {CONNECT_AWS_SECURELY_WRITE_ACCESS_NOTE}
              </p>
              <AwsCloudConnectionPermissionsTable />
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
                  <h3
                    id="connect-aws-securely-forbidden-policies-heading"
                    className={cn("m-0", OPERATOR_TYPOGRAPHY.cardTitle)}
                  >
                    {CONNECT_AWS_SECURELY_FORBIDDEN_POLICIES_HEADING}
                  </h3>
                  <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
                    {CONNECT_AWS_SECURELY_FORBIDDEN_POLICIES_BODY}
                  </p>
                </div>
              </aside>
            </section>

            <section
              aria-labelledby="verification"
              className="space-y-3 border-t border-neutral-200 pt-4 dark:border-neutral-800"
              data-testid="connect-aws-securely-verification-section"
            >
              <HelpSectionHeading id="verification">{CONNECT_AWS_SECURELY_VERIFICATION_HEADING}</HelpSectionHeading>
              <div
                id="connect-aws-securely-verification-callout"
                className={cn(DESIGN_TOKENS.callout.info, "space-y-3 scroll-mt-24")}
                data-testid="connect-aws-securely-verification-callout"
              >
                <p className={cn("m-0", OPERATOR_TYPOGRAPHY.body)}>
                  <Link href={verifyHref} className={OPERATOR_LINK.nav} data-testid="connect-aws-verify-action">
                    Run Re-poll now
                  </Link>{" "}
                  on AWS connection settings after you save the role ARN. Review{" "}
                  <Link href={CONNECT_AWS_SECURELY_CONNECTION_STATUS_HREF} className={OPERATOR_LINK.nav}>
                    {CONNECT_AWS_SECURELY_CONNECTION_STATUS_LINK_LABEL}
                  </Link>{" "}
                  for workspace-wide integration health.
                </p>
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
            </section>

            <section
              aria-labelledby="data-handling"
              className="space-y-3 border-t border-neutral-200 pt-4 dark:border-neutral-800"
              data-testid="connect-aws-securely-data-handling-section"
            >
              <HelpSectionHeading id="data-handling">{CONNECT_AWS_SECURELY_DATA_HANDLING_HEADING}</HelpSectionHeading>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2" data-testid="connect-aws-securely-information-retained-section">
                  <h3 className={cn("m-0", OPERATOR_TYPOGRAPHY.cardTitle)}>Information retained</h3>
                  <ClassificationList items={CONNECT_AWS_SECURELY_RETAINED_ITEMS} />
                </div>
                <div className="space-y-2" data-testid="connect-aws-securely-credentials-not-retained-section">
                  <h3 className={cn("m-0", OPERATOR_TYPOGRAPHY.cardTitle)}>Credentials not retained</h3>
                  <ClassificationList items={CONNECT_AWS_SECURELY_CREDENTIALS_ITEMS} />
                </div>
              </div>
              <p className={cn("m-0 max-w-3xl text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
                {CONNECT_AWS_SECURELY_PERMISSIONS_NOT_REQUIRED_NOTE}
              </p>
            </section>

            <section
              aria-labelledby="troubleshoot"
              className="space-y-3 border-t border-neutral-200 pt-4 dark:border-neutral-800"
              data-testid="connect-aws-securely-troubleshoot-section"
            >
              <HelpSectionHeading id="troubleshoot">{AWS_PERMISSIONS_TROUBLESHOOT_HEADING}</HelpSectionHeading>
              <ul className={HELP_PAGE_LAYOUT.bulletList} data-testid="connect-aws-securely-troubleshoot-list">
                {AWS_CLOUD_CONNECTION_TROUBLESHOOTING_ITEMS.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </section>

            <ConnectAwsSecurelyHelpEvidenceOrientationStrip />
          </div>
          <HelpTopicTableOfContents headings={CONNECT_AWS_SECURELY_TOC_HEADINGS} enableScrollSpy />
        </div>
      </div>
    </article>
  );
}
