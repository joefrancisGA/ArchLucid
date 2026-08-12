"use client";

import { useState } from "react";

import {
  IDENTITY_PROVIDERS_ADMIN_FALLBACK_NOTICE,
  IDENTITY_PROVIDERS_SAML_PAGE_SUBTITLE,
  IDENTITY_PROVIDERS_SAML_PAGE_TITLE,
  IDENTITY_PROVIDERS_SAML_TEST_MAPPING_UNSAVED_NOTICE,
} from "@/lib/identity-providers-settings-copy";

import { ArchLucidSamlSpValuesCard } from "./ArchLucidSamlSpValuesCard";
import { AuthTokenTestMappingCard } from "./AuthTokenTestMappingCard";
import { IdentityProvidersSettingsGate } from "./IdentityProvidersSettingsGate";
import { IdentityProvidersSettingsShell } from "./IdentityProvidersSettingsShell";
import type { IdentityProvidersSettingsPageServerLoad } from "./load-identity-providers-settings-page-data";
import { SamlOperationalHealthStrip } from "./SamlOperationalHealthStrip";
import { SamlSpConfigurationForm } from "./SamlSpConfigurationForm";

type Props = {
  readonly loaded: IdentityProvidersSettingsPageServerLoad;
};

export function IdentityProvidersSamlPageClient(props: Props): React.JSX.Element {
  const [hasUnsavedSamlEdits, setHasUnsavedSamlEdits] = useState(false);

  return (
    <IdentityProvidersSettingsGate loaded={props.loaded}>
      {(model) => (
        <IdentityProvidersSettingsShell
          pageTitle={IDENTITY_PROVIDERS_SAML_PAGE_TITLE}
          pageSubtitle={IDENTITY_PROVIDERS_SAML_PAGE_SUBTITLE}
          overview={model.overview}
          statusBadgeReady={model.dataLoaded}
          refreshing={model.refreshing}
          lastRefreshedAt={model.lastRefreshedAt}
          diagnosticsDataUnavailable={model.diagnosticsDataUnavailable}
          onRefresh={() => void model.refresh()}
          showAdminFallbackNotice
        >
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(16rem,22rem)] lg:items-start">
            <div className="space-y-4">
              {model.samlOperationalHealthLoaded ? (
                <SamlOperationalHealthStrip
                  payload={model.samlOperationalHealth}
                  fetchNote={model.samlOperationalHealthNote}
                />
              ) : null}
              <SamlSpConfigurationForm onDirtyChange={setHasUnsavedSamlEdits} />
              <AuthTokenTestMappingCard
                unsavedEditsNotice={
                  hasUnsavedSamlEdits ? IDENTITY_PROVIDERS_SAML_TEST_MAPPING_UNSAVED_NOTICE : null
                }
              />
            </div>
            <ArchLucidSamlSpValuesCard />
          </div>
        </IdentityProvidersSettingsShell>
      )}
    </IdentityProvidersSettingsGate>
  );
}
