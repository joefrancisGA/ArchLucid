"use client";

import { EvidenceOrientationClaimAndSourcesStrip } from "@/components/evidence-orientation/EvidenceOrientationClaimAndSourcesStrip";
import { OperatorPageContainer } from "@/components/operator/OperatorPageContainer";
import { EVIDENCE_SOURCES_STYLE } from "@/components/evidence-orientation/evidence-orientation-styles";
import { StatusTag } from "@/components/ui/status-tag";
import { useLocalizedProductCopy } from "@/hooks/use-localized-product-copy";
import { OPERATOR_BODY_INLINE_LINK_CLASS, OPERATOR_LAYOUT, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { awsTrustStarterIdentityIntro } from "@/lib/aws-cloud-connection-trust-policy-starter";
import { awsConnectionStatusTagKind } from "@/lib/aws-connection-present";
import {
  CLOUD_PROVIDER_CONNECTION_CLAIM_DISCIPLINE,
  CLOUD_PROVIDER_CONNECTION_SOURCES_INTRO,
  cloudProviderConnectionSources,
} from "@/lib/cloud-provider-connection-evidence-copy";
import { cloudSecurityPreflightTopics } from "@/lib/cloud-security-preflight-topics";
import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";
import { HELP_PAGE_LAYOUT } from "@/lib/help/help-page-layout";
import { inAppHelpHref } from "@/lib/product-documentation-registry";
import { cn } from "@/lib/utils";
import Link from "next/link";

import { AwsConnectionDataProvider, useAwsConnectionData } from "./AwsConnectionDataContext";
import { AwsCloudConnectionSourcesOrientationStrip } from "./AwsCloudConnectionSourcesOrientationStrip";
import { AwsConnectionRecentActivityPanel } from "./AwsConnectionRecentActivityPanel";
import { AwsConnectionSection } from "./AwsConnectionSection";
import { AwsConnectionValidatePanel } from "./AwsConnectionValidatePanel";
import { AwsTrustPolicyStarterPanel } from "./AwsTrustPolicyStarterPanel";
import {
  AWS_CLOUD_CONNECTION_FIRST_VIEWPORT_TEST_ID,
  AWS_CLOUD_CONNECTION_BUYER_OVERVIEW,
  AWS_CLOUD_CONNECTION_HEADER_CLAIM_DISCIPLINE_TEST_ID,
  AWS_CLOUD_CONNECTION_PAGE_LEAD,
  AWS_CLOUD_CONNECTION_PRIMARY_CONTENT_ID,
  AWS_CLOUD_CONNECTION_SKIP_LINK_LABEL,
  AWS_CLOUD_CONNECTION_SKIP_TARGET_ID,
  AWS_CLOUD_CONNECTION_START_HERE_CARD_TITLE,
  AWS_CLOUD_CONNECTION_START_HERE_LEAD,
  AWS_CLOUD_CONNECTION_WORKSPACE_TEST_ID,
  awsCloudConnectionPageOverview,
} from "./aws-cloud-connection-page-copy";
import { CloudConnectionsProviderHeader } from "./CloudConnectionsProviderHeader";
import { CloudProviderDetailLayout } from "./CloudProviderDetailLayout";
import {
  CloudSecurityPreflightPanel,
  CloudSecurityPreflightTechnicalDetails,
} from "./CloudSecurityPreflightPanel";

const AWS_OPERATOR_OVERVIEW = "Read-only Resource Explorer inventory through a federated IAM role." as const;

function AwsCloudConnectionHeaderStatus(): React.ReactElement {
  const { connections, isLoading, loadError } = useAwsConnectionData();

  if (isLoading) {
    return <StatusTag kind="in-progress" label="Loading" data-testid="aws-connection-header-status" />;
  }

  // A failed load is not the same as an unconfigured account — saying "Not connected" here would
  // tell an operator their connection is gone when only the read failed.
  if (loadError !== null) {
    return (
      <StatusTag kind="needs-attention" label="Status unavailable" data-testid="aws-connection-header-status" />
    );
  }

  if (connections.length === 0) {
    return <StatusTag kind="neutral" label="Not connected" data-testid="aws-connection-header-status" />;
  }

  const primaryConnection = connections[0];

  return (
    <StatusTag
      kind={awsConnectionStatusTagKind(primaryConnection.status)}
      label={primaryConnection.status}
      data-testid="aws-connection-header-status"
    />
  );
}

function AwsCloudConnectionPageHeader(): React.ReactElement {
  return (
    <CloudConnectionsProviderHeader
      providerLabel="AWS"
      overview={AWS_OPERATOR_OVERVIEW}
      buyerOverview={awsCloudConnectionPageOverview(true, AWS_OPERATOR_OVERVIEW)}
      headerClaimDisciplineTestId={AWS_CLOUD_CONNECTION_HEADER_CLAIM_DISCIPLINE_TEST_ID}
      statusBadge={<AwsCloudConnectionHeaderStatus />}
    />
  );
}

function AwsCloudConnectionStartHerePanel(): React.ReactElement {
  return (
    <section
      className="mb-4 space-y-3 rounded-md border border-neutral-200 bg-neutral-50/80 p-4 dark:border-neutral-700 dark:bg-neutral-900/40"
      data-testid="aws-cloud-connection-action-panel"
      aria-labelledby="aws-cloud-connection-action-panel-heading"
    >
      <h2
        id="aws-cloud-connection-action-panel-heading"
        className={cn("m-0 text-al-text-primary", OPERATOR_TYPOGRAPHY.sectionTitle)}
      >
        {AWS_CLOUD_CONNECTION_START_HERE_CARD_TITLE}
      </h2>
      <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
        {AWS_CLOUD_CONNECTION_START_HERE_LEAD}
      </p>
    </section>
  );
}

function AwsCloudConnectionDetailBody(): React.ReactElement {
  const { productLine, localize } = useLocalizedProductCopy();
  const buyerPolishedShell = isBuyerPolishedOperatorShellEnv();

  const detailLayout = (
    <CloudProviderDetailLayout
      providerLabel="AWS"
      overview={
        buyerPolishedShell ? undefined : (
          <p className={OPERATOR_TYPOGRAPHY.body}>
            {localize(
              "Connect an AWS account for scheduled read-only inventory collection. ArchLucid stores connection metadata only — no long-lived access keys.",
            )}
          </p>
        )
      }
      securityPreflight={
        <CloudSecurityPreflightPanel topics={cloudSecurityPreflightTopics("aws", productLine)} providerLabel="AWS" />
      }
      identitySetup={
        <div className="space-y-4">
          <p className={OPERATOR_TYPOGRAPHY.body}>{awsTrustStarterIdentityIntro(productLine)}</p>
          <AwsTrustPolicyStarterPanel />
        </div>
      }
      connectionDetails={<AwsConnectionSection embedded />}
      validateConnection={<AwsConnectionValidatePanel />}
      recentActivity={<AwsConnectionRecentActivityPanel />}
      technicalDetails={
        <CloudSecurityPreflightTechnicalDetails>
          <p>
            {localize(
              "ArchLucid assumes your read-only IAM role through OIDC federation from its hosted identity. You only configure AWS on this page — no other cloud subscription is required for this connection.",
            )}
          </p>
          <p>
            <Link href={inAppHelpHref("cloud-connections-aws")} className={OPERATOR_BODY_INLINE_LINK_CLASS}>
              View setup guide
            </Link>
          </p>
        </CloudSecurityPreflightTechnicalDetails>
      }
    />
  );

  if (buyerPolishedShell) {
    return detailLayout;
  }

  return (
    <>
      {detailLayout}
      <EvidenceOrientationClaimAndSourcesStrip
        slug="cloud-connections-aws"
        claim={CLOUD_PROVIDER_CONNECTION_CLAIM_DISCIPLINE}
        sourcesIntro={CLOUD_PROVIDER_CONNECTION_SOURCES_INTRO}
        sources={cloudProviderConnectionSources("aws")}
        claimElement="aside"
        sourcesStyle={EVIDENCE_SOURCES_STYLE.operatorMuted}
      />
    </>
  );
}

export function AwsCloudConnectionDetailClient() {
  const buyerPolishedShell = isBuyerPolishedOperatorShellEnv();
  const readingBodyClass = cn("m-0 max-w-3xl leading-relaxed", HELP_PAGE_LAYOUT.readingBody);

  return (
    <AwsConnectionDataProvider>
      <OperatorPageContainer variant="workflow" className={OPERATOR_LAYOUT.sectionStack} data-testid="cloud-connection-detail-aws">
        {buyerPolishedShell ? (
          <a
            href={`#${AWS_CLOUD_CONNECTION_SKIP_TARGET_ID}`}
            className={HELP_PAGE_LAYOUT.technicalReferenceSkipLink}
          >
            {AWS_CLOUD_CONNECTION_SKIP_LINK_LABEL}
          </a>
        ) : null}

        <div
          id={buyerPolishedShell ? AWS_CLOUD_CONNECTION_PRIMARY_CONTENT_ID : undefined}
          data-testid={buyerPolishedShell ? AWS_CLOUD_CONNECTION_PRIMARY_CONTENT_ID : undefined}
          className={cn(buyerPolishedShell && "scroll-mt-24", buyerPolishedShell && OPERATOR_LAYOUT.sectionStack)}
        >
          <AwsCloudConnectionPageHeader />

          {buyerPolishedShell ? (
            <>
              <div
                id={AWS_CLOUD_CONNECTION_SKIP_TARGET_ID}
                data-testid={AWS_CLOUD_CONNECTION_FIRST_VIEWPORT_TEST_ID}
                className={cn(
                  "scroll-mt-24 border-b border-neutral-200 pb-6 dark:border-neutral-800",
                  OPERATOR_LAYOUT.sectionStack,
                )}
              >
                <div className="space-y-4" data-testid="aws-cloud-connection-buyer-intro">
                  <p className={readingBodyClass} data-testid="aws-cloud-connection-intro">
                    {AWS_CLOUD_CONNECTION_PAGE_LEAD}
                  </p>
                </div>
                <AwsCloudConnectionStartHerePanel />
              </div>
              <p className={readingBodyClass} data-testid="aws-cloud-connection-overview">
                {AWS_CLOUD_CONNECTION_BUYER_OVERVIEW}
              </p>
            </>
          ) : null}

          <section
            className={buyerPolishedShell ? cn("min-w-0", OPERATOR_LAYOUT.sectionStack) : undefined}
            data-testid={buyerPolishedShell ? AWS_CLOUD_CONNECTION_WORKSPACE_TEST_ID : undefined}
          >
            <AwsCloudConnectionDetailBody />
          </section>

          {buyerPolishedShell ? <AwsCloudConnectionSourcesOrientationStrip /> : null}
        </div>
      </OperatorPageContainer>
    </AwsConnectionDataProvider>
  );
}
