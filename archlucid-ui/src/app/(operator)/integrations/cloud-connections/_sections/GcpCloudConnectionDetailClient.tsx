"use client";

import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import {
  GCP_CONNECTION_RECENT_ACTIVITY_INSTRUCTIONS,
  GCP_CONNECTION_VALIDATE_INSTRUCTIONS,
} from "@/lib/gcp-cloud-connection-copy";
import { cloudSecurityPreflightTopics } from "@/lib/cloud-security-preflight-topics";

import { CloudConnectionsProviderHeader } from "./CloudConnectionsProviderHeader";
import { CloudProviderDetailLayout } from "./CloudProviderDetailLayout";
import {
  CloudSecurityPreflightPanel,
  CloudSecurityPreflightTechnicalDetails,
} from "./CloudSecurityPreflightPanel";
import { GcpConnectionSection } from "./GcpConnectionSection";

export function GcpCloudConnectionDetailClient() {
  return (
    <div className="w-full max-w-3xl space-y-6" data-testid="cloud-connection-detail-gcp">
      <CloudConnectionsProviderHeader
        providerLabel="GCP"
        overview="Read-only Cloud Asset Inventory through Workload Identity Federation."
      />
      <CloudProviderDetailLayout
        providerLabel="GCP"
        overview={
          <p className={OPERATOR_TYPOGRAPHY.body}>
            Connect a GCP project for scheduled read-only inventory collection. ArchLucid stores connection metadata
            only — no downloadable service-account JSON keys.
          </p>
        }
        securityPreflight={<CloudSecurityPreflightPanel topics={cloudSecurityPreflightTopics("gcp")} providerLabel="GCP" />}
        identitySetup={
          <p className={OPERATOR_TYPOGRAPHY.body}>
            Configure Workload Identity Federation to let ArchLucid impersonate a read-only service account. Record the
            pool provider resource name and service account email for connection setup.
          </p>
        }
        connectionDetails={<GcpConnectionSection embedded />}
        validateConnection={
          <p className={OPERATOR_TYPOGRAPHY.helper}>{GCP_CONNECTION_VALIDATE_INSTRUCTIONS}</p>
        }
        recentActivity={
          <p className={OPERATOR_TYPOGRAPHY.helper}>{GCP_CONNECTION_RECENT_ACTIVITY_INSTRUCTIONS}</p>
        }
        technicalDetails={
          <CloudSecurityPreflightTechnicalDetails>
            <p>
              GCP Workload Identity Federation binds ArchLucid&apos;s hosted identity to your service account without
              downloadable JSON keys.
            </p>
          </CloudSecurityPreflightTechnicalDetails>
        }
      />
    </div>
  );
}
