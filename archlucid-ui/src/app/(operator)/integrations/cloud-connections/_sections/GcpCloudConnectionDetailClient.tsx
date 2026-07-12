"use client";

import Link from "next/link";

import { inAppHelpHref } from "@/lib/product-documentation-registry";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
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
        overview="Read-only Cloud Asset Inventory through Workload Identity Federation. Preview connector."
      />

      <CloudProviderDetailLayout
        providerLabel="GCP"
        overview={
          <p className={OPERATOR_TYPOGRAPHY.body}>
            Connect a GCP project for scheduled read-only inventory collection. This connector is in preview — validate
            in a non-production project first.
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
          <p className={OPERATOR_TYPOGRAPHY.helper}>
            Use Re-poll now on a saved connection to validate access and ingest a hosted inventory package.
          </p>
        }
        recentActivity={
          <p className={OPERATOR_TYPOGRAPHY.helper}>
            Saved connections and last poll timestamps appear in Connection details after you save a project.
          </p>
        }
        technicalDetails={
          <CloudSecurityPreflightTechnicalDetails>
            <p>
              GCP Workload Identity Federation binds ArchLucid&apos;s hosted identity to your service account without
              downloadable JSON keys.
            </p>
            <p>
              <Link href={inAppHelpHref("cloud-connections-gcp")} className="text-teal-700 underline dark:text-teal-400">
                View setup guide
              </Link>
            </p>
          </CloudSecurityPreflightTechnicalDetails>
        }
      />
    </div>
  );
}
