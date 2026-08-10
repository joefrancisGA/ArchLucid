"use client";

import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { AWS_TRUST_STARTER_IDENTITY_INTRO } from "@/lib/aws-cloud-connection-trust-policy-starter";
import { cloudSecurityPreflightTopics } from "@/lib/cloud-security-preflight-topics";

import { AwsConnectionDataProvider } from "./AwsConnectionDataContext";
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

export function AwsCloudConnectionDetailClient() {
  return (
    <AwsConnectionDataProvider>
      <div className="w-full max-w-3xl space-y-6" data-testid="cloud-connection-detail-aws">
        <CloudConnectionsProviderHeader
          providerLabel="AWS"
          overview="Read-only Resource Explorer inventory through a federated IAM role."
        />
        <CloudProviderDetailLayout
          providerLabel="AWS"
          overview={
            <p className={OPERATOR_TYPOGRAPHY.body}>
              Connect an AWS account for scheduled read-only inventory collection. ArchLucid stores connection metadata
              only — no long-lived access keys.
            </p>
          }
          securityPreflight={<CloudSecurityPreflightPanel topics={cloudSecurityPreflightTopics("aws")} providerLabel="AWS" />}
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
                Cross-cloud trust uses OIDC federation from ArchLucid&apos;s hosted identity to your AWS IAM role. This
                does not require you to run workloads on Azure.
              </p>
            </CloudSecurityPreflightTechnicalDetails>
          }
        />
      </div>
    </AwsConnectionDataProvider>
  );
}
