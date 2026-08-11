"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

import { listAwsTier2Connections } from "@/lib/api/aws-cloud-connections-api";
import { listTier2Connections } from "@/lib/api/cloud-connections-api";
import { listGcpTier2Connections } from "@/lib/api/gcp-cloud-connections-api";
import {
  CLOUD_CONNECTIONS_OPTIONAL_NOTE,
  CLOUD_CONNECTIONS_PAGE_SUBTITLE,
  CLOUD_CONNECTIONS_PAGE_TITLE,
} from "@/lib/cloud-connections-copy";
import { CLOUD_CONNECTIONS_PATH } from "@/lib/integrations-nav-paths";
import {
  hasCloudPlatformScopeWorkspace,
  resolveLandingCloudPlatformScope,
  subscribeCloudPlatformScopeChanges,
  visibleLandingPlatformCards,
  writeCloudPlatformScopeToStorage,
  type CloudPlatformId,
  type CloudPlatformScope,
  type CloudProviderId,
} from "@/lib/cloud-platform-scope-storage";
import { OPERATOR_LINK, OPERATOR_NAV_GROUP_LABEL, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

import { CloudFirstInventoryCoach } from "@/components/integrations/CloudFirstInventoryCoach";
import { PageHeading } from "@/components/PageHeading";
import { PageContextualHelpButton } from "@/components/usability/PageContextualHelpButton";
import { CloudPlatformScopePanel } from "./CloudPlatformScopePanel";
import { CloudProviderSummaryCard } from "./CloudProviderSummaryCard";
import { EvidenceOnlyConnectionCard } from "./EvidenceOnlyConnectionCard";
import { isCloudProviderSummaryConfigured } from "./is-cloud-provider-summary-configured";

function formatTimestamp(value: string | null | undefined): string {
  if (value === null || value === undefined || value.trim().length === 0) {
    return "Not validated yet";
  }

  const parsed = Date.parse(value);

  if (Number.isNaN(parsed)) {
    return value;
  }

  return new Date(parsed).toLocaleString();
}

type ProviderSummaryState = {
  readonly status: string;
  readonly lastValidation: string;
  readonly evidenceCollected: string;
};

const DEFAULT_PROVIDER_SUMMARY: ProviderSummaryState = {
  status: "Not configured",
  lastValidation: "Not validated yet",
  evidenceCollected: "No packages collected",
};

export function CloudConnectionsPageClient() {
  const [platformScope, setPlatformScope] = useState(() => resolveLandingCloudPlatformScope());
  const [persistAvailable, setPersistAvailable] = useState(() => hasCloudPlatformScopeWorkspace());
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [providerSummaries, setProviderSummaries] = useState<Record<CloudProviderId, ProviderSummaryState>>({
    azure: DEFAULT_PROVIDER_SUMMARY,
    aws: DEFAULT_PROVIDER_SUMMARY,
    gcp: DEFAULT_PROVIDER_SUMMARY,
  });

  const refreshSummaries = useCallback(async () => {
    const [azureConnections, awsConnections, gcpConnections] = await Promise.all([
      listTier2Connections(),
      listAwsTier2Connections(),
      listGcpTier2Connections(),
    ]);

    setProviderSummaries({
      azure:
        azureConnections.length > 0
          ? {
              status: "Configured",
              lastValidation: formatTimestamp(azureConnections[0]?.updatedUtc),
              evidenceCollected: `${azureConnections.length} connection${azureConnections.length === 1 ? "" : "s"}`,
            }
          : DEFAULT_PROVIDER_SUMMARY,
      aws:
        awsConnections.length > 0
          ? {
              status: awsConnections[0]?.status ?? "Configured",
              lastValidation: formatTimestamp(awsConnections[0]?.lastPolledUtc ?? awsConnections[0]?.updatedUtc),
              evidenceCollected: "Resource inventory packages",
            }
          : DEFAULT_PROVIDER_SUMMARY,
      gcp:
        gcpConnections.length > 0
          ? {
              status: gcpConnections[0]?.status ?? "Configured",
              lastValidation: formatTimestamp(gcpConnections[0]?.lastPolledUtc ?? gcpConnections[0]?.updatedUtc),
              evidenceCollected: "Cloud Asset Inventory packages",
            }
          : DEFAULT_PROVIDER_SUMMARY,
    });
    setLoadError(null);
  }, []);

  useEffect(() => {
    void (async () => {
      try {
        await refreshSummaries();
      } catch (error) {
        console.error(error);
        setLoadError("Could not load cloud connection status. Check your permissions and try refreshing the page.");
      } finally {
        setIsLoading(false);
      }
    })();
  }, [refreshSummaries]);

  useEffect(
    () =>
      subscribeCloudPlatformScopeChanges(() => {
        setPlatformScope(resolveLandingCloudPlatformScope());
        setPersistAvailable(hasCloudPlatformScopeWorkspace());
      }),
    [],
  );

  const handlePlatformScopeChange = useCallback((nextScope: CloudPlatformScope) => {
    setPlatformScope(nextScope);
    writeCloudPlatformScopeToStorage(nextScope);
  }, []);

  const visibleCards = useMemo(() => visibleLandingPlatformCards(platformScope), [platformScope]);

  const hasConfiguredProvider =
    isCloudProviderSummaryConfigured(providerSummaries.azure.status) ||
    isCloudProviderSummaryConfigured(providerSummaries.aws.status) ||
    isCloudProviderSummaryConfigured(providerSummaries.gcp.status);

  const hasSuccessfulPull =
    providerSummaries.aws.evidenceCollected !== "No packages collected" ||
    providerSummaries.gcp.evidenceCollected !== "No packages collected" ||
    providerSummaries.azure.evidenceCollected !== "No packages collected";

  return (
    <div className="w-full max-w-5xl space-y-6" data-testid="cloud-connections-page">
      <PageHeading
        navHref={CLOUD_CONNECTIONS_PATH}
        title={CLOUD_CONNECTIONS_PAGE_TITLE}
        variant="integration"
        actions={<PageContextualHelpButton />}
        description={
          <>
            <p className={cn("m-0 max-w-3xl", OPERATOR_TYPOGRAPHY.helper)}>{CLOUD_CONNECTIONS_PAGE_SUBTITLE}</p>
            <p className={cn("m-0 max-w-3xl", OPERATOR_TYPOGRAPHY.helper)}>{CLOUD_CONNECTIONS_OPTIONAL_NOTE}</p>
          </>
        }
      />
      <CloudPlatformScopePanel
        scope={platformScope}
        onScopeChange={handlePlatformScopeChange}
        persistAvailable={persistAvailable}
      />

      <section className="space-y-4" aria-labelledby="cloud-connections-options-heading">
        <h2 id="cloud-connections-options-heading" className={OPERATOR_NAV_GROUP_LABEL}>
          Connection options
        </h2>

        {loadError ? (
          <p className={cn(OPERATOR_TYPOGRAPHY.body, "text-red-600 dark:text-red-400")} role="alert">
            {loadError}
          </p>
        ) : null}

        {isLoading ? <p className={OPERATOR_TYPOGRAPHY.helper}>Loading connection status...</p> : null}

        {!isLoading && !loadError && hasConfiguredProvider ? (
          <CloudFirstInventoryCoach hasConnection hasSuccessfulPull={hasSuccessfulPull} />
        ) : null}

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-2">
          {visibleCards.map((platformId: CloudPlatformId) => {
            if (platformId === "evidence-only") {
              return <EvidenceOnlyConnectionCard key={platformId} />;
            }

            const summary = providerSummaries[platformId];

            return (
              <CloudProviderSummaryCard
                key={platformId}
                provider={platformId}
                status={summary.status}
                lastValidation={summary.lastValidation}
                evidenceCollected={summary.evidenceCollected}
              />
            );
          })}
        </div>

        {visibleCards.length === 0 ? (
          <p className={OPERATOR_TYPOGRAPHY.helper}>
            No platforms are selected. Enable at least one option above, or use{" "}
            <Link href="/architecture/reviews/new" className={OPERATOR_LINK.nav}>
              evidence-only review
            </Link>
            .
          </p>
        ) : null}
      </section>
    </div>
  );
}
