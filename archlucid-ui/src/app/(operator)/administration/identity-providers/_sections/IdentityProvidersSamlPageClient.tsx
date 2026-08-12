"use client";

import {
  IDENTITY_PROVIDERS_SAML_PAGE_SUBTITLE,
  IDENTITY_PROVIDERS_SAML_PAGE_TITLE,
} from "@/lib/identity-providers-settings-copy";

import { IdentityProvidersSettingsGate } from "./IdentityProvidersSettingsGate";
import { IdentityProvidersSettingsShell } from "./IdentityProvidersSettingsShell";
import type { IdentityProvidersSettingsPageServerLoad } from "./load-identity-providers-settings-page-data";
import { SamlOperationalHealthStrip } from "./SamlOperationalHealthStrip";
import { SamlSpConfigurationForm } from "./SamlSpConfigurationForm";

type Props = {
  readonly loaded: IdentityProvidersSettingsPageServerLoad;
};

export function IdentityProvidersSamlPageClient(props: Props): React.JSX.Element {
  return (
    <IdentityProvidersSettingsGate loaded={props.loaded}>
      {(model) => (
        <IdentityProvidersSettingsShell
          pageTitle={IDENTITY_PROVIDERS_SAML_PAGE_TITLE}
          pageSubtitle={IDENTITY_PROVIDERS_SAML_PAGE_SUBTITLE}
          refreshing={model.refreshing}
          lastRefreshedAt={model.lastRefreshedAt}
          onRefresh={() => void model.refresh()}
        >
          <div className="space-y-4">
            {model.samlOperationalHealthLoaded ? (
              <SamlOperationalHealthStrip
                payload={model.samlOperationalHealth}
                fetchNote={model.samlOperationalHealthNote}
              />
            ) : null}
            <SamlSpConfigurationForm />
          </div>
        </IdentityProvidersSettingsShell>
      )}
    </IdentityProvidersSettingsGate>
  );
}
