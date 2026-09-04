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
import { type CloudProviderId } from "@/lib/cloud-platform-scope-storage";
import { cloudConnectionsPlatformHrefFromSearch } from "@/lib/integrations/cloud-connections-platform-url";
import { OPERATOR_LINK, OPERATOR_NAV_GROUP_LABEL, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { buyerFilterChipClass } from "@/lib/buyer/buyer-shell-home-present";
import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";
import { writeCloudProviderLastViewedId } from "@/lib/resolve-continue-last-cloud-provider";
import { FilterChip } from "@/components/ui/filter-chip";
import { FilterChipGroup } from "@/components/ui/filter-chip-group";
import { CloudFirstInventoryCoach } from "@/components/integrations/CloudFirstInventoryCoach";
import { IntegrationZoneRecoveryCard } from "@/components/integrations/IntegrationZoneRecoveryCard";

import { CloudConnectionsContinueLastViewedRow } from "./CloudConnectionsContinueLastViewedRow";
import { CloudConnectionsHubVocabularyDisclosure } from "./CloudConnectionsHubVocabularyDisclosure";
import { CloudProviderSummaryCard } from "./CloudProviderSummaryCard";
import {
  CLOUD_PLATFORM_CHIP_OPTIONS,
  type CloudConnectionsPageViewModel,
} from "./use-cloud-connections-page";

export type CloudConnectionsProviderListProps = CloudConnectionsPageViewModel;

export function CloudConnectionsProviderList(props: CloudConnectionsProviderListProps) {
  const buyerPolishedShell = isBuyerPolishedOperatorShellEnv();
  const {
    currentSearch,
    urlPlatform,
    isLoading,
    visibleProviders,
    providerSummaries,
    integrationZoneRecoveries,
    showConnectionContent,
    hasConfiguredProvider,
    hasSuccessfulPull,
    connectedProviderCount,
    totalProviderCount,
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
          totalProviderCount={totalProviderCount}
          recommendedProviderId={recommendedProviderId}
        />
      ) : null}

      {showConnectionContent && continueLastProvider !== null ? (
        <CloudConnectionsContinueLastViewedRow target={continueLastProvider} />
      ) : null}

      <FilterChipGroup
        aria-label="Filter cloud connections by platform"
        className="flex flex-wrap gap-2"
        data-testid="cloud-connections-platform-chips"
      >
        {CLOUD_PLATFORM_CHIP_OPTIONS.map((option) => (
          <FilterChip
            key={option.id}
            href={cloudConnectionsPlatformHrefFromSearch(currentSearch, option.id)}
            scroll={false}
            className={buyerFilterChipClass(urlPlatform === option.id, false)}
            aria-current={urlPlatform === option.id ? "page" : undefined}
            data-testid={`cloud-connections-platform-${option.id}`}
          >
            {option.label}
          </FilterChip>
        ))}
      </FilterChipGroup>

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

      {!buyerPolishedShell ? <CloudConnectionsHubVocabularyDisclosure /> : null}
    </section>
  );
}
