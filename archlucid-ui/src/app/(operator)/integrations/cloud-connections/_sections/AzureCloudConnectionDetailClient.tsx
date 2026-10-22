"use client";

import Link from "next/link";

import { EvidenceOrientationClaimAndSourcesStrip } from "@/components/evidence-orientation/EvidenceOrientationClaimAndSourcesStrip";
import { OperatorPageContainer } from "@/components/operator/OperatorPageContainer";
import { StatusTag } from "@/components/ui/status-tag";
import { useLocalizedProductCopy } from "@/hooks/use-localized-product-copy";
import { OPERATOR_BODY_INLINE_LINK_CLASS, OPERATOR_LAYOUT, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { EVIDENCE_SOURCES_STYLE } from "@/components/evidence-orientation/evidence-orientation-styles";
import { azureConnectionStatusTagKind } from "@/lib/azure-connection-present";
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

import { AzureConnectionDataProvider, useAzureConnectionData } from "./AzureConnectionDataContext";
import { AzureCloudConnectionSourcesOrientationStrip } from "./AzureCloudConnectionSourcesOrientationStrip";
import { AzureConnectionDetailsPanel } from "./AzureConnectionDetailsPanel";
import { AzureConnectionRecentActivityPanel } from "./AzureConnectionRecentActivityPanel";
import { AzureConnectionValidatePanel } from "./AzureConnectionValidatePanel";
import {
  AZURE_CLOUD_CONNECTION_FIRST_VIEWPORT_TEST_ID,
  AZURE_CLOUD_CONNECTION_BUYER_OVERVIEW,
  AZURE_CLOUD_CONNECTION_HEADER_CLAIM_DISCIPLINE_TEST_ID,
  AZURE_CLOUD_CONNECTION_PAGE_LEAD,
  AZURE_CLOUD_CONNECTION_PRIMARY_CONTENT_ID,
  AZURE_CLOUD_CONNECTION_SKIP_LINK_LABEL,
  AZURE_CLOUD_CONNECTION_SKIP_TARGET_ID,
  AZURE_CLOUD_CONNECTION_START_HERE_CARD_TITLE,
  AZURE_CLOUD_CONNECTION_START_HERE_LEAD,
  AZURE_CLOUD_CONNECTION_WORKSPACE_TEST_ID,
  azureCloudConnectionPageOverview,
} from "./azure-cloud-connection-page-copy";
import { CloudConnectionsProviderHeader } from "./CloudConnectionsProviderHeader";
import { CloudProviderDetailLayout } from "./CloudProviderDetailLayout";
import {
  CloudSecurityPreflightPanel,
  CloudSecurityPreflightTechnicalDetails,
} from "./CloudSecurityPreflightPanel";
import { TIER2_WIZARD_HELP_HREFS } from "./tier2-connection-wizard-content";

const AZURE_OPERATOR_OVERVIEW =
  "Read-only subscription inventory and cost metadata through federated service principal access." as const;

function AzureCloudConnectionHeaderStatus(): React.ReactElement {
  const { connections, isLoading, loadError } = useAzureConnectionData();

  if (isLoading) {
    return <StatusTag kind="in-progress" label="Loading" data-testid="azure-connection-header-status" />;
  }

  if (loadError !== null) {
    return (
      <StatusTag kind="needs-attention" label="Status unavailable" data-testid="azure-connection-header-status" />
    );
  }

  if (connections.length === 0) {
    return <StatusTag kind="neutral" label="Not connected" data-testid="azure-connection-header-status" />;
  }

  return (
    <StatusTag
      kind={azureConnectionStatusTagKind()}
      label="Connected"
      data-testid="azure-connection-header-status"
    />
  );
}

function AzureCloudConnectionPageHeader(): React.ReactElement {
  return (
    <CloudConnectionsProviderHeader
      providerLabel="Azure"
      overview={AZURE_OPERATOR_OVERVIEW}
      buyerOverview={azureCloudConnectionPageOverview(true, AZURE_OPERATOR_OVERVIEW)}
      headerClaimDisciplineTestId={AZURE_CLOUD_CONNECTION_HEADER_CLAIM_DISCIPLINE_TEST_ID}
      statusBadge={<AzureCloudConnectionHeaderStatus />}
    />
  );
}

function AzureCloudConnectionStartHerePanel(): React.ReactElement {
  return (
    <section
      className="mb-4 space-y-3 rounded-md border border-neutral-200 bg-neutral-50/80 p-4 dark:border-neutral-700 dark:bg-neutral-900/40"
      data-testid="azure-cloud-connection-action-panel"
      aria-labelledby="azure-cloud-connection-action-panel-heading"
    >
      <h2
        id="azure-cloud-connection-action-panel-heading"
        className={cn("m-0 text-al-text-primary", OPERATOR_TYPOGRAPHY.sectionTitle)}
      >
        {AZURE_CLOUD_CONNECTION_START_HERE_CARD_TITLE}
      </h2>
      <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
        {AZURE_CLOUD_CONNECTION_START_HERE_LEAD}
      </p>
    </section>
  );
}

function AzureConnectionDetailBody(): React.ReactElement {
  const { productLine, localize } = useLocalizedProductCopy();
  const buyerPolishedShell = isBuyerPolishedOperatorShellEnv();

  const detailLayout = (
    <CloudProviderDetailLayout
      providerLabel="Azure"
      overview={
        buyerPolishedShell ? undefined : (
          <p className={OPERATOR_TYPOGRAPHY.body}>
            {localize(
              "Connect selected Azure subscriptions for scheduled read-only evidence collection. ArchLucid stores connection metadata only — no client secrets.",
            )}
          </p>
        )
      }
      securityPreflight={
        <CloudSecurityPreflightPanel
          topics={cloudSecurityPreflightTopics("azure", productLine)}
          providerLabel="Azure"
          collapsedByDefault
        />
      }
      identitySetup={
        <p className={OPERATOR_TYPOGRAPHY.body}>
          {localize(
            "Provision a read-only service principal in your tenant, then add federated credentials that trust ArchLucid's managed identity. Use the setup script in Connection details or deploy the",
          )}{" "}
          <Link href={TIER2_WIZARD_HELP_HREFS.connectAzureSecurely} className={OPERATOR_BODY_INLINE_LINK_CLASS}>
            infrastructure templates
          </Link>
          .
        </p>
      }
      connectionDetails={<AzureConnectionDetailsPanel />}
      validateConnection={<AzureConnectionValidatePanel />}
      recentActivity={<AzureConnectionRecentActivityPanel />}
      technicalDetails={
        <CloudSecurityPreflightTechnicalDetails>
          <p>
            {localize(
              "ArchLucid hosts the extractor service on Azure infrastructure. Your tenant provisions a customer-side service principal — you are not required to adopt Azure as your primary cloud platform.",
            )}
          </p>
          <p>
            <Link href={inAppHelpHref("cloud-connections-azure")} className={OPERATOR_BODY_INLINE_LINK_CLASS}>
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
        slug="cloud-connections-azure"
        claim={CLOUD_PROVIDER_CONNECTION_CLAIM_DISCIPLINE}
        sourcesIntro={CLOUD_PROVIDER_CONNECTION_SOURCES_INTRO}
        sources={cloudProviderConnectionSources("azure")}
        claimElement="aside"
        sourcesStyle={EVIDENCE_SOURCES_STYLE.operatorMuted}
      />
    </>
  );
}

export function AzureCloudConnectionDetailClient() {
  const buyerPolishedShell = isBuyerPolishedOperatorShellEnv();
  const readingBodyClass = cn("m-0 max-w-3xl leading-relaxed", HELP_PAGE_LAYOUT.readingBody);

  return (
    <AzureConnectionDataProvider>
      <OperatorPageContainer
        variant="workflow"
        className={OPERATOR_LAYOUT.sectionStack}
        data-testid="cloud-connection-detail-azure"
      >
        {buyerPolishedShell ? (
          <a
            href={`#${AZURE_CLOUD_CONNECTION_SKIP_TARGET_ID}`}
            className={HELP_PAGE_LAYOUT.technicalReferenceSkipLink}
          >
            {AZURE_CLOUD_CONNECTION_SKIP_LINK_LABEL}
          </a>
        ) : null}

        <div
          id={buyerPolishedShell ? AZURE_CLOUD_CONNECTION_PRIMARY_CONTENT_ID : undefined}
          data-testid={buyerPolishedShell ? AZURE_CLOUD_CONNECTION_PRIMARY_CONTENT_ID : undefined}
          className={cn(buyerPolishedShell && "scroll-mt-24", buyerPolishedShell && OPERATOR_LAYOUT.sectionStack)}
        >
          <AzureCloudConnectionPageHeader />

          {buyerPolishedShell ? (
            <>
              <div
                id={AZURE_CLOUD_CONNECTION_SKIP_TARGET_ID}
                data-testid={AZURE_CLOUD_CONNECTION_FIRST_VIEWPORT_TEST_ID}
                className={cn(
                  "scroll-mt-24 border-b border-neutral-200 pb-6 dark:border-neutral-800",
                  OPERATOR_LAYOUT.sectionStack,
                )}
              >
                <div className="space-y-4" data-testid="azure-cloud-connection-buyer-intro">
                  <p className={readingBodyClass} data-testid="azure-cloud-connection-intro">
                    {AZURE_CLOUD_CONNECTION_PAGE_LEAD}
                  </p>
                </div>
                <AzureCloudConnectionStartHerePanel />
              </div>
              <p className={readingBodyClass} data-testid="azure-cloud-connection-overview">
                {AZURE_CLOUD_CONNECTION_BUYER_OVERVIEW}
              </p>
            </>
          ) : null}

          <section
            className={buyerPolishedShell ? cn("min-w-0", OPERATOR_LAYOUT.sectionStack) : undefined}
            data-testid={buyerPolishedShell ? AZURE_CLOUD_CONNECTION_WORKSPACE_TEST_ID : undefined}
          >
            <AzureConnectionDetailBody />
          </section>

          {buyerPolishedShell ? <AzureCloudConnectionSourcesOrientationStrip /> : null}
        </div>
      </OperatorPageContainer>
    </AzureConnectionDataProvider>
  );
}
