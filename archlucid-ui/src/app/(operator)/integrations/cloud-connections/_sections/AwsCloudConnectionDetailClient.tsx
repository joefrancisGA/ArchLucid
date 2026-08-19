"use client";

import { EvidenceOrientationClaimAndSourcesStrip } from "@/components/evidence-orientation/EvidenceOrientationClaimAndSourcesStrip";
import { EVIDENCE_SOURCES_STYLE } from "@/components/evidence-orientation/evidence-orientation-styles";
import { StatusTag } from "@/components/ui/status-tag";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { AWS_TRUST_STARTER_IDENTITY_INTRO } from "@/lib/aws-cloud-connection-trust-policy-starter";
import { awsConnectionStatusTagKind } from "@/lib/aws-connection-present";
import {
  CLOUD_PROVIDER_CONNECTION_CLAIM_DISCIPLINE,
  CLOUD_PROVIDER_CONNECTION_SOURCES_INTRO,
  cloudProviderConnectionSources,
} from "@/lib/cloud-provider-connection-evidence-copy";
import { cloudSecurityPreflightTopics } from "@/lib/cloud-security-preflight-topics";

import { AwsConnectionDataProvider, useAwsConnectionData } from "./AwsConnectionDataContext";
import { AwsConnectionRecentActivityPanel } from "./AwsConnectionRecentActivityPanel";
import { AwsConnectionSection } from "./AwsConnectionSection";
import { AwsConnectionValidatePanel } from "./AwsConnectionValidatePanel";
import { AwsTrustPolicyStarterPanel } from "./AwsTrustPolicyStarterPanel";
import { CloudConnectionsProviderHeader } from "./CloudConnectionsProviderHeader";
import { CloudProviderDetailLayout } from "./CloudProviderDetailLayout";
import {
  CloudSecurityPreflightPanel,
  CloudSecurityPreflightTechnicalDetails,
} from "./CloudSecurityPreflightPanel";

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
      overview="Read-only Resource Explorer inventory through a federated IAM role."
      statusBadge={<AwsCloudConnectionHeaderStatus />}
    />
  );
}

function AwsCloudConnectionDetailBody(): React.ReactElement {
  return (
    <>
      <CloudProviderDetailLayout
        providerLabel="AWS"
        overview={
          <p className={OPERATOR_TYPOGRAPHY.body}>
            Connect an AWS account for scheduled read-only inventory collection. ArchLucid stores connection
            metadata only — no long-lived access keys.
          </p>
        }
        securityPreflight={
          <CloudSecurityPreflightPanel topics={cloudSecurityPreflightTopics("aws")} providerLabel="AWS" />
        }
        identitySetup={
          <div className="space-y-4">
            <p className={OPERATOR_TYPOGRAPHY.body}>{AWS_TRUST_STARTER_IDENTITY_INTRO}</p>
            <AwsTrustPolicyStarterPanel />
          </div>
        }
        connectionDetails={<AwsConnectionSection embedded />}
        validateConnection={<AwsConnectionValidatePanel />}
        recentActivity={<AwsConnectionRecentActivityPanel />}
        technicalDetails={
          <CloudSecurityPreflightTechnicalDetails>
            <p>
              Cross-cloud trust uses OIDC federation from ArchLucid&apos;s hosted identity to your AWS IAM role.
              This does not require you to run workloads on Azure.
            </p>
          </CloudSecurityPreflightTechnicalDetails>
        }
      />

      <EvidenceOrientationClaimAndSourcesStrip
        slug="cloud-connections-aws"
        claim={CLOUD_PROVIDER_CONNECTION_CLAIM_DISCIPLINE}
        sourcesIntro={CLOUD_PROVIDER_CONNECTION_SOURCES_INTRO}
        sources={cloudProviderConnectionSources("aws")}
        claimElement="aside"
        sourcesStyle={EVIDENCE_SOURCES_STYLE.operatorMuted}
        sourcesLayout="wrap"
      />
    </>
  );
}

export function AwsCloudConnectionDetailClient() {
  return (
    <AwsConnectionDataProvider>
      <div className="w-full max-w-3xl space-y-4" data-testid="cloud-connection-detail-aws">
        <AwsCloudConnectionPageHeader />
        <AwsCloudConnectionDetailBody />
      </div>
    </AwsConnectionDataProvider>
  );
}
