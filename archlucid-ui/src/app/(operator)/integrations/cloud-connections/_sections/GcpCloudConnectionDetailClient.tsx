"use client";

import { EvidenceOrientationClaimAndSourcesStrip } from "@/components/evidence-orientation/EvidenceOrientationClaimAndSourcesStrip";
import { GcpCloudConnectionEvidenceOrientationStrip } from "@/components/evidence-orientation/registry/claim-and-sources-strips";
import { OperatorPageContainer } from "@/components/operator/OperatorPageContainer";
import { EVIDENCE_SOURCES_STYLE } from "@/components/evidence-orientation/evidence-orientation-styles";
import { StatusTag } from "@/components/ui/status-tag";
import { useLocalizedProductCopy } from "@/hooks/use-localized-product-copy";
import { OPERATOR_BODY_INLINE_LINK_CLASS, OPERATOR_LAYOUT, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { GCP_WIF_STARTER_IDENTITY_INTRO } from "@/lib/gcp-cloud-connection-wif-starter";
import { cloudSecurityPreflightTopics } from "@/lib/cloud-security-preflight-topics";
import { gcpConnectionStatusTagKind } from "@/lib/gcp-connection-present";
import {
  CLOUD_PROVIDER_CONNECTION_CLAIM_DISCIPLINE,
  CLOUD_PROVIDER_CONNECTION_SOURCES_INTRO,
  cloudProviderConnectionSources,
} from "@/lib/cloud-provider-connection-evidence-copy";
import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";
import { HELP_PAGE_LAYOUT } from "@/lib/help/help-page-layout";
import { inAppHelpHref } from "@/lib/product-documentation-registry";
import { cn } from "@/lib/utils";
import Link from "next/link";

import { CloudConnectionsProviderHeader } from "./CloudConnectionsProviderHeader";
import { CloudProviderDetailLayout } from "./CloudProviderDetailLayout";
import {
  CloudSecurityPreflightPanel,
  CloudSecurityPreflightTechnicalDetails,
} from "./CloudSecurityPreflightPanel";
import { GcpConnectionDataProvider, useGcpConnectionData } from "./GcpConnectionDataContext";
import { GcpConnectionRecentActivityPanel } from "./GcpConnectionRecentActivityPanel";
import { GcpConnectionSection } from "./GcpConnectionSection";
import { GcpConnectionValidatePanel } from "./GcpConnectionValidatePanel";
import { GcpWifStarterPanel } from "./GcpWifStarterPanel";
import {
  GCP_CLOUD_CONNECTION_FIRST_VIEWPORT_TEST_ID,
  GCP_CLOUD_CONNECTION_HEADER_CLAIM_DISCIPLINE_TEST_ID,
  GCP_CLOUD_CONNECTION_PRIMARY_CONTENT_ID,
  GCP_CLOUD_CONNECTION_SKIP_LINK_LABEL,
  GCP_CLOUD_CONNECTION_SKIP_TARGET_ID,
  GCP_CLOUD_CONNECTION_START_HERE_CARD_TITLE,
  GCP_CLOUD_CONNECTION_START_HERE_LEAD,
  gcpCloudConnectionPageOverview,
} from "./gcp-cloud-connection-page-copy";

const GCP_OPERATOR_OVERVIEW = "Read-only Cloud Asset Inventory through Workload Identity Federation." as const;

function GcpCloudConnectionHeaderStatus(): React.ReactElement {
  const { connections, isLoading, loadError } = useGcpConnectionData();

  if (isLoading) {
    return <StatusTag kind="in-progress" label="Loading" data-testid="gcp-connection-header-status" />;
  }

  if (loadError !== null) {
    return (
      <StatusTag kind="needs-attention" label="Status unavailable" data-testid="gcp-connection-header-status" />
    );
  }

  if (connections.length === 0) {
    return <StatusTag kind="neutral" label="Not connected" data-testid="gcp-connection-header-status" />;
  }

  const primaryConnection = connections[0];

  return (
    <StatusTag
      kind={gcpConnectionStatusTagKind(primaryConnection.status)}
      label={primaryConnection.status}
      data-testid="gcp-connection-header-status"
    />
  );
}

function GcpCloudConnectionPageHeader(): React.ReactElement {
  return (
    <CloudConnectionsProviderHeader
      providerLabel="GCP"
      overview={GCP_OPERATOR_OVERVIEW}
      buyerOverview={gcpCloudConnectionPageOverview(true, GCP_OPERATOR_OVERVIEW)}
      headerClaimDisciplineTestId={GCP_CLOUD_CONNECTION_HEADER_CLAIM_DISCIPLINE_TEST_ID}
      statusBadge={<GcpCloudConnectionHeaderStatus />}
    />
  );
}

function GcpCloudConnectionStartHerePanel(): React.ReactElement {
  return (
    <section
      className="mb-4 space-y-3 rounded-md border border-neutral-200 bg-neutral-50/80 p-4 dark:border-neutral-700 dark:bg-neutral-900/40"
      data-testid="gcp-cloud-connection-action-panel"
      aria-labelledby="gcp-cloud-connection-action-panel-heading"
    >
      <h2
        id="gcp-cloud-connection-action-panel-heading"
        className={cn("m-0 text-al-text-primary", OPERATOR_TYPOGRAPHY.sectionTitle)}
      >
        {GCP_CLOUD_CONNECTION_START_HERE_CARD_TITLE}
      </h2>
      <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
        {GCP_CLOUD_CONNECTION_START_HERE_LEAD}
      </p>
    </section>
  );
}

function GcpCloudConnectionDetailBody(): React.ReactElement {
  const { productLine, localize } = useLocalizedProductCopy();
  const buyerPolishedShell = isBuyerPolishedOperatorShellEnv();

  const detailLayout = (
    <CloudProviderDetailLayout
      providerLabel="GCP"
      overview={
        <p className={OPERATOR_TYPOGRAPHY.body}>
          {localize(
            "Connect a GCP project for scheduled read-only inventory collection. ArchLucid stores connection metadata only — no downloadable service-account JSON keys.",
          )}
        </p>
      }
      securityPreflight={
        <CloudSecurityPreflightPanel
          topics={cloudSecurityPreflightTopics("gcp", productLine)}
          providerLabel="GCP"
          collapsedByDefault
        />
      }
      identitySetup={
        <div className="space-y-4">
          <p className={OPERATOR_TYPOGRAPHY.body}>{localize(GCP_WIF_STARTER_IDENTITY_INTRO)}</p>
          <GcpWifStarterPanel />
        </div>
      }
      connectionDetails={<GcpConnectionSection embedded />}
      validateConnection={<GcpConnectionValidatePanel />}
      recentActivity={<GcpConnectionRecentActivityPanel />}
      technicalDetails={
        <CloudSecurityPreflightTechnicalDetails>
          <p>
            {localize(
              "GCP Workload Identity Federation binds ArchLucid's hosted identity to your service account without downloadable JSON keys.",
            )}
          </p>
          <p>
            <Link href={inAppHelpHref("cloud-connections-gcp")} className={OPERATOR_BODY_INLINE_LINK_CLASS}>
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
        slug="cloud-connections-gcp"
        claim={CLOUD_PROVIDER_CONNECTION_CLAIM_DISCIPLINE}
        sourcesIntro={CLOUD_PROVIDER_CONNECTION_SOURCES_INTRO}
        sources={cloudProviderConnectionSources("gcp")}
        claimElement="aside"
        sourcesStyle={EVIDENCE_SOURCES_STYLE.operatorMuted}
      />
    </>
  );
}

export function GcpCloudConnectionDetailClient() {
  const buyerPolishedShell = isBuyerPolishedOperatorShellEnv();

  return (
    <GcpConnectionDataProvider>
      <OperatorPageContainer variant="workflow" className={OPERATOR_LAYOUT.sectionStack} data-testid="cloud-connection-detail-gcp">
        {buyerPolishedShell ? (
          <a
            href={`#${GCP_CLOUD_CONNECTION_SKIP_TARGET_ID}`}
            className={HELP_PAGE_LAYOUT.technicalReferenceSkipLink}
          >
            {GCP_CLOUD_CONNECTION_SKIP_LINK_LABEL}
          </a>
        ) : null}

        <div
          id={buyerPolishedShell ? GCP_CLOUD_CONNECTION_PRIMARY_CONTENT_ID : undefined}
          data-testid={buyerPolishedShell ? GCP_CLOUD_CONNECTION_PRIMARY_CONTENT_ID : undefined}
          className={cn(buyerPolishedShell && "scroll-mt-24", buyerPolishedShell && OPERATOR_LAYOUT.sectionStack)}
        >
          <GcpCloudConnectionPageHeader />

          {buyerPolishedShell ? (
            <div
              id={GCP_CLOUD_CONNECTION_SKIP_TARGET_ID}
              data-testid={GCP_CLOUD_CONNECTION_FIRST_VIEWPORT_TEST_ID}
              className={cn(
                "scroll-mt-24 border-b border-neutral-200 pb-6 dark:border-neutral-800",
                OPERATOR_LAYOUT.sectionStack,
              )}
            >
              <GcpCloudConnectionStartHerePanel />
              <GcpCloudConnectionDetailBody />
            </div>
          ) : (
            <GcpCloudConnectionDetailBody />
          )}

          {buyerPolishedShell ? (
            <div data-testid="gcp-cloud-connection-orientation-bottom">
              <GcpCloudConnectionEvidenceOrientationStrip />
            </div>
          ) : null}
        </div>
      </OperatorPageContainer>
    </GcpConnectionDataProvider>
  );
}
