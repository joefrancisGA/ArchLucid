"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { listAwsTier2Connections } from "@/lib/api/aws-cloud-connections-api";
import { listTier2Connections } from "@/lib/api/cloud-connections-api";
import { listGcpTier2Connections } from "@/lib/api/gcp-cloud-connections-api";
import { CLOUD_CONNECTIONS_PROVIDER_EVIDENCE_NONE } from "@/lib/cloud-connections-copy";
import { cloudConnectionIndicatesSuccessfulPull } from "@/lib/cloud-first-inventory-coach";
import {
  CLOUD_PROVIDER_NEUTRAL_ORDER,
  resolveLandingCloudPlatformScope,
  subscribeCloudPlatformScopeChanges,
  syncCloudPlatformScopeFromServer,
  visibleCloudProviders,
  type CloudProviderId,
} from "@/lib/cloud-platform-scope-storage";
import {
  buildIntegrationZoneRecoveries,
  type IntegrationZoneLoadSlice,
} from "@/lib/integration-zone-recovery";
import {
  resolveCloudConnectionsConnectSteps,
  resolveCloudConnectionsEmphasizedStepId,
} from "@/lib/cloud-connections-connect-checklist";
import {
  resolveContinueLastCloudProvider,
} from "@/lib/resolve-continue-last-cloud-provider";
import { isCloudProviderSummaryConfigured } from "@/app/(operator)/integrations/cloud-connections/_sections/is-cloud-provider-summary-configured";

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

export type ProviderSummaryState = {
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

export function useCloudConnectionsPage() {
  const [platformScope, setPlatformScope] = useState(() => resolveLandingCloudPlatformScope());
  const [isLoading, setIsLoading] = useState(true);
  const [successfulPullByProvider, setSuccessfulPullByProvider] = useState<Record<CloudProviderId, boolean>>({
    azure: false,
    aws: false,
    gcp: false,
  });
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
      const azureIndicatesPull = azureConnections.some((connection) =>
        cloudConnectionIndicatesSuccessfulPull({
          lastPolledUtc: connection.updatedUtc ?? null,
        }),
      );

      setSuccessfulPullByProvider((previous) => ({ ...previous, azure: azureIndicatesPull }));
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
        cloudConnectionIndicatesSuccessfulPull({
          lastPolledUtc: connection.lastPolledUtc ?? connection.updatedUtc ?? null,
          status: connection.status ?? null,
        }),
      );

      setSuccessfulPullByProvider((previous) => ({ ...previous, aws: awsIndicatesPull }));
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
        cloudConnectionIndicatesSuccessfulPull({
          lastPolledUtc: connection.lastPolledUtc ?? connection.updatedUtc ?? null,
          status: connection.status ?? null,
        }),
      );

      setSuccessfulPullByProvider((previous) => ({ ...previous, gcp: gcpIndicatesPull }));
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

  const visibleProviders = useMemo(() => visibleCloudProviders(platformScope), [platformScope]);

  const hasSuccessfulPull = useMemo(
    () => CLOUD_PROVIDER_NEUTRAL_ORDER.some((provider) => successfulPullByProvider[provider]),
    [successfulPullByProvider],
  );

  const continueLastProvider = useMemo(
    () =>
      resolveContinueLastCloudProvider({
        visibleProviders,
        successfulPullByProvider,
      }),
    [successfulPullByProvider, visibleProviders],
  );

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

  const cloudConnectChecklistInput = {
    providerSelected: visibleProviders.length > 0,
    connectionConfigured: hasConfiguredProvider,
    connectionValidated: hasSuccessfulPull,
  };

  const cloudConnectSteps = resolveCloudConnectionsConnectSteps(cloudConnectChecklistInput);
  const cloudConnectEmphasizedStepId = resolveCloudConnectionsEmphasizedStepId(cloudConnectChecklistInput);

  return {
    isLoading,
    visibleProviders,
    providerSummaries,
    integrationZoneRecoveries,
    showConnectionContent,
    cloudConnectSteps,
    cloudConnectEmphasizedStepId,
    hasConfiguredProvider,
    hasSuccessfulPull,
    connectedProviderCount,
    recommendedProviderId,
    continueLastProvider,
  };
}

export type CloudConnectionsPageViewModel = ReturnType<typeof useCloudConnectionsPage>;
