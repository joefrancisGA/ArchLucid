"use client";

import { EvidenceOrientationClaimAndSourcesStrip } from "@/components/evidence-orientation/EvidenceOrientationClaimAndSourcesStrip";
import { EVIDENCE_SOURCES_STYLE } from "@/components/evidence-orientation/evidence-orientation-styles";
import { Button } from "@/components/ui/button";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { StatusTag } from "@/components/ui/status-tag";
import { GCP_WIF_STARTER_IDENTITY_INTRO } from "@/lib/gcp-cloud-connection-wif-starter";
import { cloudSecurityPreflightTopics } from "@/lib/cloud-security-preflight-topics";
import { gcpConnectionStatusTagKind } from "@/lib/gcp-connection-present";
import {
  CLOUD_PROVIDER_CONNECTION_CLAIM_DISCIPLINE,
  CLOUD_PROVIDER_CONNECTION_SOURCES_INTRO,
  cloudProviderConnectionSources,
} from "@/lib/cloud-provider-connection-evidence-copy";

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
  const { connections, isLoading, loadError } = useGcpConnectionData();
  const showConnectPrimary = !isLoading && loadError === null && connections.length === 0;

  return (
    <CloudConnectionsProviderHeader
      providerLabel="GCP"
      overview="Read-only Cloud Asset Inventory through Workload Identity Federation."
      statusBadge={<GcpCloudConnectionHeaderStatus />}
      primaryAction={
        showConnectPrimary ? (
          <Button asChild variant="primary" data-testid="gcp-connection-header-connect">
            <a href="#connection-details">Connect GCP project</a>
          </Button>
        ) : undefined
      }
    />
  );
}

export function GcpCloudConnectionDetailClient() {
  return (
    <GcpConnectionDataProvider>
      <div className="w-full max-w-3xl space-y-4" data-testid="cloud-connection-detail-gcp">
        <GcpCloudConnectionPageHeader />
        <CloudProviderDetailLayout
          providerLabel="GCP"
          overview={
            <p className={OPERATOR_TYPOGRAPHY.body}>
              Connect a GCP project for scheduled read-only inventory collection. ArchLucid stores connection metadata
              only — no downloadable service-account JSON keys.
            </p>
          }
          securityPreflight={
            <CloudSecurityPreflightPanel
              topics={cloudSecurityPreflightTopics("gcp")}
              providerLabel="GCP"
              collapsedByDefault
            />
          }
          identitySetup={
            <div className="space-y-4">
              <p className={OPERATOR_TYPOGRAPHY.body}>{GCP_WIF_STARTER_IDENTITY_INTRO}</p>
              <GcpWifStarterPanel />
            </div>
          }
          connectionDetails={<GcpConnectionSection embedded />}
          validateConnection={<GcpConnectionValidatePanel />}
          recentActivity={<GcpConnectionRecentActivityPanel />}
          technicalDetails={
            <CloudSecurityPreflightTechnicalDetails>
              <p>
                GCP Workload Identity Federation binds ArchLucid&apos;s hosted identity to your service account without
                downloadable JSON keys.
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
      </div>
    </GcpConnectionDataProvider>
  );
}
