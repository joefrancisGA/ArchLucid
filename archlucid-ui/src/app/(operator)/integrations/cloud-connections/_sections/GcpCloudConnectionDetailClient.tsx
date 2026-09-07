"use client";

import { EvidenceOrientationClaimAndSourcesStrip } from "@/components/evidence-orientation/EvidenceOrientationClaimAndSourcesStrip";
import { OperatorPageContainer } from "@/components/operator/OperatorPageContainer";
import { EVIDENCE_SOURCES_STYLE } from "@/components/evidence-orientation/evidence-orientation-styles";
import { OPERATOR_BODY_INLINE_LINK_CLASS, OPERATOR_LAYOUT, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { StatusTag } from "@/components/ui/status-tag";
import { useLocalizedProductCopy } from "@/hooks/use-localized-product-copy";
import { GCP_WIF_STARTER_IDENTITY_INTRO } from "@/lib/gcp-cloud-connection-wif-starter";
import { cloudSecurityPreflightTopics } from "@/lib/cloud-security-preflight-topics";
import { gcpConnectionStatusTagKind } from "@/lib/gcp-connection-present";
import {
  CLOUD_PROVIDER_CONNECTION_CLAIM_DISCIPLINE,
  CLOUD_PROVIDER_CONNECTION_SOURCES_INTRO,
  cloudProviderConnectionSources,
} from "@/lib/cloud-provider-connection-evidence-copy";
import { inAppHelpHref } from "@/lib/product-documentation-registry";
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
      overview="Read-only Cloud Asset Inventory through Workload Identity Federation."
      statusBadge={<GcpCloudConnectionHeaderStatus />}
    />
  );
}

function GcpCloudConnectionDetailBody(): React.ReactElement {
  const { productLine, localize } = useLocalizedProductCopy();

  return (
    <>
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
  return (
    <GcpConnectionDataProvider>
      <OperatorPageContainer variant="workflow" className={OPERATOR_LAYOUT.sectionStack} data-testid="cloud-connection-detail-gcp">
        <GcpCloudConnectionPageHeader />
        <GcpCloudConnectionDetailBody />
      </OperatorPageContainer>
    </GcpConnectionDataProvider>
  );
}
