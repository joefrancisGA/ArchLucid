"use client";

import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { GCP_WIF_STARTER_IDENTITY_INTRO } from "@/lib/gcp-cloud-connection-wif-starter";
import { cloudSecurityPreflightTopics } from "@/lib/cloud-security-preflight-topics";

import { CloudConnectionsProviderHeader } from "./CloudConnectionsProviderHeader";
import { CloudProviderDetailLayout } from "./CloudProviderDetailLayout";
import {
  CloudSecurityPreflightPanel,
  CloudSecurityPreflightTechnicalDetails,
} from "./CloudSecurityPreflightPanel";
import { GcpConnectionDataProvider } from "./GcpConnectionDataContext";
import { GcpConnectionRecentActivityPanel } from "./GcpConnectionRecentActivityPanel";
import { GcpConnectionSection } from "./GcpConnectionSection";
import { GcpConnectionValidatePanel } from "./GcpConnectionValidatePanel";
import { GcpWifStarterPanel } from "./GcpWifStarterPanel";

export function GcpCloudConnectionDetailClient() {
  return (
    <GcpConnectionDataProvider>
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
      </div>
    </GcpConnectionDataProvider>
  );
}
