"use client";



import Link from "next/link";



import { Button } from "@/components/ui/button";

import { StatusTag } from "@/components/ui/status-tag";

import { inAppHelpHref } from "@/lib/product-documentation-registry";

import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

import { cloudSecurityPreflightTopics } from "@/lib/cloud-security-preflight-topics";

import { azureConnectionStatusTagKind } from "@/lib/azure-connection-present";



import { AzureConnectionDataProvider, useAzureConnectionData } from "./AzureConnectionDataContext";

import { AzureConnectionRecentActivityPanel } from "./AzureConnectionRecentActivityPanel";

import { AzureConnectionValidatePanel } from "./AzureConnectionValidatePanel";

import { CloudConnectionsProviderHeader } from "./CloudConnectionsProviderHeader";

import { CloudProviderDetailLayout } from "./CloudProviderDetailLayout";

import {

  CloudSecurityPreflightPanel,

  CloudSecurityPreflightTechnicalDetails,

} from "./CloudSecurityPreflightPanel";

import { AzureConnectionDetailsPanel } from "./AzureConnectionDetailsPanel";

import { TIER2_WIZARD_HELP_HREFS } from "./tier2-connection-wizard-content";



function AzureCloudConnectionHeaderStatus(): React.ReactElement {

  const { connections, isLoading, loadError } = useAzureConnectionData();



  if (isLoading) {

    return <StatusTag kind="in-progress" label="Loading" data-testid="azure-connection-header-status" />;

  }



  if (loadError !== null) {

    return (

      <StatusTag kind="needs-attention" label="Status unavailable" data-testid="azure-connection-header-status" />

    );

  }



  if (connections.length === 0) {

    return <StatusTag kind="neutral" label="Not connected" data-testid="azure-connection-header-status" />;

  }



  return (

    <StatusTag

      kind={azureConnectionStatusTagKind()}

      label="Connected"

      data-testid="azure-connection-header-status"

    />

  );

}



function AzureCloudConnectionPageHeader(): React.ReactElement {

  const { connections, isLoading, loadError } = useAzureConnectionData();

  const showConnectPrimary = !isLoading && loadError === null && connections.length === 0;



  return (

    <CloudConnectionsProviderHeader

      providerLabel="Azure"

      overview="Read-only subscription inventory and cost metadata through federated service principal access."

      statusBadge={<AzureCloudConnectionHeaderStatus />}

      primaryAction={

        showConnectPrimary ? (

          <Button asChild variant="primary" data-testid="azure-connection-header-connect">

            <a href="#connection-details">Connect Azure subscription</a>

          </Button>

        ) : undefined

      }

    />

  );

}



function AzureConnectionDetailBody() {

  return (

    <CloudProviderDetailLayout

      providerLabel="Azure"

      overview={

        <p className={OPERATOR_TYPOGRAPHY.body}>

          Connect selected Azure subscriptions for scheduled read-only evidence collection. ArchLucid stores

          connection metadata only — no client secrets.

        </p>

      }

      securityPreflight={

        <CloudSecurityPreflightPanel

          topics={cloudSecurityPreflightTopics("azure")}

          providerLabel="Azure"

          collapsedByDefault

        />

      }

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

      connectionDetails={<AzureConnectionDetailsPanel />}

      validateConnection={<AzureConnectionValidatePanel />}

      recentActivity={<AzureConnectionRecentActivityPanel />}

      technicalDetails={

        <CloudSecurityPreflightTechnicalDetails>

          <p>

            ArchLucid hosts the extractor service on Azure infrastructure. Your tenant provisions a customer-side

            service principal — you are not required to adopt Azure as your primary cloud platform.

          </p>

          <p>

            <Link href={inAppHelpHref("cloud-connections-azure")} className="text-teal-700 underline dark:text-teal-400">

              View setup guide

            </Link>

          </p>

        </CloudSecurityPreflightTechnicalDetails>

      }

    />

  );

}



export function AzureCloudConnectionDetailClient() {

  return (

    <AzureConnectionDataProvider>

      <div className="w-full max-w-3xl space-y-4" data-testid="cloud-connection-detail-azure">

        <AzureCloudConnectionPageHeader />

        <AzureConnectionDetailBody />

      </div>

    </AzureConnectionDataProvider>

  );

}


