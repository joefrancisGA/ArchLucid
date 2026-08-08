"use client";

import Link from "next/link";

import { listTier2Connections } from "@/lib/api/cloud-connections-api";
import { inAppHelpHref } from "@/lib/product-documentation-registry";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cloudSecurityPreflightTopics } from "@/lib/cloud-security-preflight-topics";

import { CloudConnectionsProviderHeader } from "./CloudConnectionsProviderHeader";
import { CloudProviderDetailLayout } from "./CloudProviderDetailLayout";
import {
  CloudSecurityPreflightPanel,
  CloudSecurityPreflightTechnicalDetails,
} from "./CloudSecurityPreflightPanel";
import { Tier2ConnectionWizard } from "./Tier2ConnectionWizard";
import { TIER2_WIZARD_HELP_HREFS } from "./tier2-connection-wizard-content";

export function AzureCloudConnectionDetailClient() {
  return (
    <div className="w-full max-w-3xl space-y-6" data-testid="cloud-connection-detail-azure">
      <CloudConnectionsProviderHeader
        providerLabel="Azure"
        overview="Read-only subscription inventory and cost metadata through federated service principal access."
      />
<CloudProviderDetailLayout
        providerLabel="Azure"
        overview={
          <p className={OPERATOR_TYPOGRAPHY.body}>
            Connect selected Azure subscriptions for scheduled read-only evidence collection. ArchLucid stores
            connection metadata only — no client secrets.
          </p>
        }
        securityPreflight={<CloudSecurityPreflightPanel topics={cloudSecurityPreflightTopics("azure")} providerLabel="Azure" />}
        identitySetup={
          <p className={OPERATOR_TYPOGRAPHY.body}>
            Provision a read-only service principal in your tenant, then add federated credentials that trust
            ArchLucid&apos;s managed identity. Use the setup script in Connection details or deploy the{" "}
            <Link href={TIER2_WIZARD_HELP_HREFS.connectAzureSecurely} className="text-teal-700 underline dark:text-teal-400">
              infrastructure templates
            </Link>
            .
          </p>
        }
        connectionDetails={
          <Tier2ConnectionWizard
            skipSecurityStep
            onSaved={async () => {
              await listTier2Connections();
            }}
          />
        }
        validateConnection={
          <p className={OPERATOR_TYPOGRAPHY.helper}>
            After saving, run the validation pull from the Save &amp; validate step to confirm federated credentials and
            read-only access.
          </p>
        }
        recentActivity={
          <p className={OPERATOR_TYPOGRAPHY.helper}>
            Recent hosted collection runs appear after validation. Return to{" "}
            <Link href="/integrations/cloud-connections" className="text-teal-700 underline dark:text-teal-400">
              Cloud connections
            </Link>{" "}
            for workspace-level status.
          </p>
        }
        technicalDetails={
          <CloudSecurityPreflightTechnicalDetails>
            <p>
              ArchLucid hosts the extractor service on Azure infrastructure. Your tenant provisions a customer-side
              service principal — you are not required to adopt Azure as your primary cloud platform.
            </p>
            <p>
              <Link href={inAppHelpHref("azure-permissions")} className="text-teal-700 underline dark:text-teal-400">
                Azure permissions reference
              </Link>
              {" · "}
              <Link href={inAppHelpHref("configuration-reference")} className="text-teal-700 underline dark:text-teal-400">
                Configuration reference
              </Link>
              {" · "}
              <Link href={inAppHelpHref("cloud-connections-azure")} className="text-teal-700 underline dark:text-teal-400">
                View setup guide
              </Link>
            </p>
          </CloudSecurityPreflightTechnicalDetails>
        }
      />
    </div>
  );
}
