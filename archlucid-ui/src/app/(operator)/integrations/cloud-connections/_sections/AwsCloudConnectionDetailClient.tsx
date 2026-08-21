"use client";

import { EvidenceOrientationClaimAndSourcesStrip } from "@/components/evidence-orientation/EvidenceOrientationClaimAndSourcesStrip";
import { EVIDENCE_SOURCES_STYLE } from "@/components/evidence-orientation/evidence-orientation-styles";
import { Button } from "@/components/ui/button";
import { StatusTag } from "@/components/ui/status-tag";
import { OPERATOR_BODY_INLINE_LINK_CLASS, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { AWS_TRUST_STARTER_IDENTITY_INTRO } from "@/lib/aws-cloud-connection-trust-policy-starter";
import { awsConnectionStatusTagKind } from "@/lib/aws-connection-present";
import {
  CLOUD_PROVIDER_CONNECTION_CLAIM_DISCIPLINE,
  CLOUD_PROVIDER_CONNECTION_SOURCES_INTRO,
  cloudProviderConnectionSources,
} from "@/lib/cloud-provider-connection-evidence-copy";
import { cloudSecurityPreflightTopics } from "@/lib/cloud-security-preflight-topics";
import { inAppHelpHref } from "@/lib/product-documentation-registry";
import Link from "next/link";

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
  const { connections, isLoading, loadError } = useAwsConnectionData();
  const showConnectPrimary = !isLoading && loadError === null && connections.length === 0;

  return (
    <CloudConnectionsProviderHeader
      providerLabel="AWS"
      overview="Read-only Resource Explorer inventory through a federated IAM role."
      statusBadge={<AwsCloudConnectionHeaderStatus />}
      primaryAction={
        showConnectPrimary ? (
          <Button asChild variant="primary" data-testid="aws-connection-header-connect">
            <a href="#connection-details">Connect AWS account</a>
          </Button>
        ) : undefined
      }
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
              ArchLucid assumes your read-only IAM role through OIDC federation from its hosted identity. You only
              configure AWS on this page — no other cloud subscription is required for this connection.
            </p>
            <p>
              <Link href={inAppHelpHref("cloud-connections-aws")} className={OPERATOR_BODY_INLINE_LINK_CLASS}>
                View setup guide
              </Link>
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
