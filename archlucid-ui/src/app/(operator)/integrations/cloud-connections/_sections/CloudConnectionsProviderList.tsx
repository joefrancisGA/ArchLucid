"use client";

import Link from "next/link";

import { CloudPlatformScopePreferencesNotice } from "@/components/preferences/CloudPlatformScopePreferencesNotice";
import {
  CLOUD_CONNECTIONS_PLATFORM_SCOPE_EMPTY_SELECTION_LEAD,
  CLOUD_CONNECTIONS_PLATFORM_SCOPE_EMPTY_SELECTION_MID,
  CLOUD_CONNECTIONS_PLATFORM_SCOPE_EMPTY_SELECTION_REVIEW_LINK_LABEL,
  CLOUD_CONNECTIONS_PLATFORM_SCOPE_PREFERENCES_HREF,
  CLOUD_CONNECTIONS_PLATFORM_SCOPE_PREFERENCES_LINK_LABEL,
} from "@/lib/cloud-platform-scope-copy";
import {
  CLOUD_PROVIDER_NEUTRAL_ORDER,
  type CloudProviderId,
} from "@/lib/cloud-platform-scope-storage";
import { OPERATOR_LINK, OPERATOR_NAV_GROUP_LABEL, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { writeCloudProviderLastViewedId } from "@/lib/resolve-continue-last-cloud-provider";

import { CloudConnectionsContinueLastViewedRow } from "./CloudConnectionsContinueLastViewedRow";
import { CloudConnectionsHubVocabularyDisclosure } from "./CloudConnectionsHubVocabularyDisclosure";
import { CloudProviderSummaryCard } from "./CloudProviderSummaryCard";
import { CloudFirstInventoryCoach } from "@/components/integrations/CloudFirstInventoryCoach";
import { IntegrationZoneRecoveryCard } from "@/components/integrations/IntegrationZoneRecoveryCard";
import type { CloudConnectionsPageViewModel } from "./use-cloud-connections-page";

const CLOUD_PROVIDER_COUNT = CLOUD_PROVIDER_NEUTRAL_ORDER.length;

export type CloudConnectionsProviderListProps = CloudConnectionsPageViewModel;

export function CloudConnectionsProviderList(props: CloudConnectionsProviderListProps) {
  const {
    isLoading,
    visibleProviders,
    providerSummaries,
    integrationZoneRecoveries,
    showConnectionContent,
    hasConfiguredProvider,
    hasSuccessfulPull,
    connectedProviderCount,
    recommendedProviderId,
    continueLastProvider,
  } = props;

  return (
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

      {showConnectionContent && (hasConfiguredProvider || hasSuccessfulPull) ? (
        <CloudFirstInventoryCoach
          hasConnection={hasConfiguredProvider}
          hasSuccessfulPull={hasSuccessfulPull}
          connectedProviderCount={connectedProviderCount}
          totalProviderCount={CLOUD_PROVIDER_COUNT}
          recommendedProviderId={recommendedProviderId}
        />
      ) : null}

      {showConnectionContent && continueLastProvider !== null ? (
        <CloudConnectionsContinueLastViewedRow target={continueLastProvider} />
      ) : null}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-2">
        {visibleProviders.map((providerId: CloudProviderId) => {
          const summary = providerSummaries[providerId];

          return (
            <CloudProviderSummaryCard
              key={providerId}
              provider={providerId}
              status={summary.status}
              lastValidation={summary.lastValidation}
              evidenceCollected={summary.evidenceCollected}
              onOpen={writeCloudProviderLastViewedId}
            />
          );
        })}
      </div>

      {visibleProviders.length === 0 ? (
        <p className={OPERATOR_TYPOGRAPHY.helper}>
          {CLOUD_CONNECTIONS_PLATFORM_SCOPE_EMPTY_SELECTION_LEAD}{" "}
          <Link
            href={CLOUD_CONNECTIONS_PLATFORM_SCOPE_PREFERENCES_HREF}
            className={OPERATOR_LINK.nav}
            data-testid="cloud-platform-scope-empty-selection-preferences-link"
          >
            {CLOUD_CONNECTIONS_PLATFORM_SCOPE_PREFERENCES_LINK_LABEL}
          </Link>
          {CLOUD_CONNECTIONS_PLATFORM_SCOPE_EMPTY_SELECTION_MID}{" "}
          <Link href="/architecture/reviews/new" className={OPERATOR_LINK.nav}>
            {CLOUD_CONNECTIONS_PLATFORM_SCOPE_EMPTY_SELECTION_REVIEW_LINK_LABEL}
          </Link>
          .
        </p>
      ) : null}

      <CloudPlatformScopePreferencesNotice />

      <CloudConnectionsHubVocabularyDisclosure />
    </section>
  );
}
