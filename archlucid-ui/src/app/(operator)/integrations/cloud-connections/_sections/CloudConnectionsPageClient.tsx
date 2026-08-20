"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

import { IntegrationZoneRecoveryCard } from "@/components/integrations/IntegrationZoneRecoveryCard";
import { CloudPlatformScopePreferencesNotice } from "@/components/preferences/CloudPlatformScopePreferencesNotice";
import { listAwsTier2Connections } from "@/lib/api/aws-cloud-connections-api";
import { listTier2Connections } from "@/lib/api/cloud-connections-api";
import { listGcpTier2Connections } from "@/lib/api/gcp-cloud-connections-api";
import {
  CLOUD_CONNECTIONS_OPTIONAL_NOTE,
  CLOUD_CONNECTIONS_PAGE_SUBTITLE,
  CLOUD_CONNECTIONS_PAGE_TITLE,
  CLOUD_CONNECTIONS_PROVIDER_EVIDENCE_NONE,
} from "@/lib/cloud-connections-copy";
import { CLOUD_CONNECTIONS_PLATFORM_SCOPE_EMPTY_SELECTION } from "@/lib/cloud-platform-scope-copy";
import { CLOUD_CONNECTIONS_PATH } from "@/lib/integrations-nav-paths";
import {
  cloudConnectionIndicatesSuccessfulPull,
} from "@/lib/cloud-first-inventory-coach";
import {
  CLOUD_PROVIDER_NEUTRAL_ORDER,
  resolveLandingCloudPlatformScope,
  subscribeCloudPlatformScopeChanges,
  syncCloudPlatformScopeFromServer,
  visibleLandingPlatformCards,
  type CloudPlatformId,
  type CloudProviderId,
} from "@/lib/cloud-platform-scope-storage";
import { OPERATOR_LAYOUT, OPERATOR_LINK, OPERATOR_NAV_GROUP_LABEL, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import {
  buildIntegrationZoneRecoveries,
  type IntegrationZoneLoadSlice,
} from "@/lib/integration-zone-recovery";

import { CloudConnectionsEvidenceOrientationStrip } from "@/components/evidence-orientation/registry/claim-and-sources-strips";
import { CloudFirstInventoryCoach } from "@/components/integrations/CloudFirstInventoryCoach";
import { PageHeading } from "@/components/PageHeading";
import { PageContextualHelpButton } from "@/components/usability/PageContextualHelpButton";
import { CloudConnectionsHubVocabularyDisclosure } from "./CloudConnectionsHubVocabularyDisclosure";
import { CloudConnectionsSecurityAssuranceBand } from "./CloudConnectionsSecurityAssuranceBand";
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

const CLOUD_CONNECTIONS_LOAD_FAILURE_MESSAGE =
  "Could not load cloud connection status. Check your permissions, then try again.";

function integrationZoneLoadReasonMessage(reason: unknown, fallback: string): string {
  if (reason instanceof Error && reason.message.trim().length > 0) {
    return reason.message.trim();
  }

  return fallback;
}

const DEFAULT_PROVIDER_SUMMARY: ProviderSummaryState = {
  status: "Not configured",
  lastValidation: "Not validated yet",
  evidenceCollected: CLOUD_CONNECTIONS_PROVIDER_EVIDENCE_NONE,
};

const CLOUD_PROVIDER_COUNT = CLOUD_PROVIDER_NEUTRAL_ORDER.length;

export function CloudConnectionsPageClient() {
  const [platformScope, setPlatformScope] = useState(() => resolveLandingCloudPlatformScope());
  const [isLoading, setIsLoading] = useState(true);
  const [hasSuccessfulPull, setHasSuccessfulPull] = useState(false);
  const [providerSummaries, setProviderSummaries] = useState<Record<CloudProviderId, ProviderSummaryState>>({
    azure: DEFAULT_PROVIDER_SUMMARY,
    aws: DEFAULT_PROVIDER_SUMMARY,
    gcp: DEFAULT_PROVIDER_SUMMARY,
  });
  const [zoneLoadSlices, setZoneLoadSlices] = useState<readonly IntegrationZoneLoadSlice[]>([]);

  const refreshSummaries = useCallback(async () => {
    const [azureOutcome, awsOutcome, gcpOutcome] = await Promise.allSettled([
      listTier2Connections(),
      listAwsTier2Connections(),
      listGcpTier2Connections(),
    ]);

    const zones: IntegrationZoneLoadSlice[] = [
      {
        id: "azure",
        label: "Azure cloud connections",
        failed: azureOutcome.status === "rejected",
        errorMessage:
          azureOutcome.status === "rejected"
            ? integrationZoneLoadReasonMessage(azureOutcome.reason, "Could not load Azure connections.")
            : null,
      },
      {
        id: "aws",
        label: "AWS cloud connections",
        failed: awsOutcome.status === "rejected",
        errorMessage:
          awsOutcome.status === "rejected"
            ? integrationZoneLoadReasonMessage(awsOutcome.reason, "Could not load AWS connections.")
            : null,
      },
      {
        id: "gcp",
        label: "GCP cloud connections",
        failed: gcpOutcome.status === "rejected",
        errorMessage:
          gcpOutcome.status === "rejected"
            ? integrationZoneLoadReasonMessage(gcpOutcome.reason, "Could not load GCP connections.")
            : null,
      },
    ];

    setZoneLoadSlices(zones);

    if (azureOutcome.status === "fulfilled") {
      const azureConnections = azureOutcome.value;

      setProviderSummaries((previous) => ({
        ...previous,
        azure:
          azureConnections.length > 0
            ? {
                status: "Configured",
                lastValidation: formatTimestamp(azureConnections[0]?.updatedUtc),
                evidenceCollected: `${azureConnections.length} connection${azureConnections.length === 1 ? "" : "s"}`,
              }
            : DEFAULT_PROVIDER_SUMMARY,
      }));
    }

    if (awsOutcome.status === "fulfilled") {
      const awsConnections = awsOutcome.value;
      const awsIndicatesPull = awsConnections.some((connection) =>
        cloudConnectionIndicatesSuccessfulPull(connection),
      );

      setHasSuccessfulPull((previous) => previous || awsIndicatesPull);
      setProviderSummaries((previous) => ({
        ...previous,
        aws:
          awsConnections.length > 0
            ? {
                status: awsConnections[0]?.status ?? "Configured",
                lastValidation: formatTimestamp(
                  awsConnections[0]?.lastPolledUtc ?? awsConnections[0]?.updatedUtc,
                ),
                evidenceCollected: "Resource inventory packages",
              }
            : DEFAULT_PROVIDER_SUMMARY,
      }));
    }

    if (gcpOutcome.status === "fulfilled") {
      const gcpConnections = gcpOutcome.value;
      const gcpIndicatesPull = gcpConnections.some((connection) =>
        cloudConnectionIndicatesSuccessfulPull(connection),
      );

      setHasSuccessfulPull((previous) => previous || gcpIndicatesPull);
      setProviderSummaries((previous) => ({
        ...previous,
        gcp:
          gcpConnections.length > 0
            ? {
                status: gcpConnections[0]?.status ?? "Configured",
                lastValidation: formatTimestamp(
                  gcpConnections[0]?.lastPolledUtc ?? gcpConnections[0]?.updatedUtc,
                ),
                evidenceCollected: "Cloud Asset Inventory packages",
              }
            : DEFAULT_PROVIDER_SUMMARY,
      }));
    }
  }, []);

  const loadSummaries = useCallback(async () => {
    setIsLoading(true);

    try {
      await refreshSummaries();
    } catch (error) {
      console.error(error);
      setZoneLoadSlices([
        {
          id: "azure",
          label: "Azure cloud connections",
          failed: true,
          errorMessage: CLOUD_CONNECTIONS_LOAD_FAILURE_MESSAGE,
        },
        {
          id: "aws",
          label: "AWS cloud connections",
          failed: true,
          errorMessage: CLOUD_CONNECTIONS_LOAD_FAILURE_MESSAGE,
        },
        {
          id: "gcp",
          label: "GCP cloud connections",
          failed: true,
          errorMessage: CLOUD_CONNECTIONS_LOAD_FAILURE_MESSAGE,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  }, [refreshSummaries]);

  useEffect(() => {
    void loadSummaries();
  }, [loadSummaries]);

  useEffect(() => {
    void syncCloudPlatformScopeFromServer();
  }, []);

  useEffect(
    () =>
      subscribeCloudPlatformScopeChanges(() => {
        setPlatformScope(resolveLandingCloudPlatformScope());
      }),
    [],
  );

  const visibleCards = useMemo(() => visibleLandingPlatformCards(platformScope), [platformScope]);

  const connectedProviderCount = useMemo(
    () =>
      CLOUD_PROVIDER_NEUTRAL_ORDER.filter((provider) =>
        isCloudProviderSummaryConfigured(providerSummaries[provider].status),
      ).length,
    [providerSummaries],
  );

  const hasConfiguredProvider = connectedProviderCount > 0;

  const recommendedProviderId = useMemo((): CloudProviderId => {
    const visibleUnconfigured = CLOUD_PROVIDER_NEUTRAL_ORDER.find(
      (provider) =>
        platformScope[provider] && !isCloudProviderSummaryConfigured(providerSummaries[provider].status),
    );

    if (visibleUnconfigured !== undefined) {
      return visibleUnconfigured;
    }

    const anyVisible = CLOUD_PROVIDER_NEUTRAL_ORDER.find((provider) => platformScope[provider]);

    return anyVisible ?? CLOUD_PROVIDER_NEUTRAL_ORDER[0];
  }, [platformScope, providerSummaries]);

  const integrationZoneRecoveries = useMemo(
    () => buildIntegrationZoneRecoveries(zoneLoadSlices),
    [zoneLoadSlices],
  );

  const allZonesFailed =
    zoneLoadSlices.length > 0 && zoneLoadSlices.every((zone) => zone.failed);

  const showConnectionContent = !isLoading && !allZonesFailed;

  return (
    <div className={cn("w-full max-w-[1120px] px-1 py-4 sm:px-0", OPERATOR_LAYOUT.sectionStack)} data-testid="cloud-connections-page">
      <PageHeading
        navHref={CLOUD_CONNECTIONS_PATH}
        title={CLOUD_CONNECTIONS_PAGE_TITLE}
        variant="integration"
        actions={<PageContextualHelpButton />}
        description={
          <>
            <p className={cn("m-0 max-w-3xl text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
              {CLOUD_CONNECTIONS_PAGE_SUBTITLE}
            </p>
            <p className={cn("m-0 max-w-3xl text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
              {CLOUD_CONNECTIONS_OPTIONAL_NOTE}
            </p>
          </>
        }
      />

      <CloudConnectionsEvidenceOrientationStrip />

      <section className="space-y-4" aria-labelledby="cloud-connections-options-heading">
        <h2 id="cloud-connections-options-heading" className={OPERATOR_NAV_GROUP_LABEL}>
          Connection options
        </h2>

        {integrationZoneRecoveries.length > 0 ? (
          <div className="space-y-3" data-testid="cloud-connections-zone-recoveries">
            {integrationZoneRecoveries.map((recovery) => (
              <IntegrationZoneRecoveryCard key={recovery.zoneId} recovery={recovery} />
            ))}
          </div>
        ) : null}

        {isLoading ? <p className={OPERATOR_TYPOGRAPHY.helper}>Loading connection status...</p> : null}

        {showConnectionContent ? (
          <CloudFirstInventoryCoach
            hasConnection={hasConfiguredProvider}
            hasSuccessfulPull={hasSuccessfulPull}
            connectedProviderCount={connectedProviderCount}
            totalProviderCount={CLOUD_PROVIDER_COUNT}
            recommendedProviderId={recommendedProviderId}
          />
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
            {CLOUD_CONNECTIONS_PLATFORM_SCOPE_EMPTY_SELECTION}{" "}
            <Link href="/architecture/reviews/new" className={OPERATOR_LINK.nav}>
              evidence-only review
            </Link>
            .
          </p>
        ) : null}

        <CloudPlatformScopePreferencesNotice />

        <CloudConnectionsHubVocabularyDisclosure />
      </section>

      <CloudConnectionsSecurityAssuranceBand />
    </div>
  );
}
