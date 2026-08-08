"use client";

import { IDENTITY_PROVIDERS_SAML_PAGE_INTRO, IDENTITY_PROVIDERS_SAML_PAGE_TITLE } from "@/lib/identity-providers-settings-copy";

import { IdentityProvidersSettingsGate } from "./IdentityProvidersSettingsGate";
import { IdentityProvidersSettingsShell } from "./IdentityProvidersSettingsShell";
import type { IdentityProvidersSettingsPageServerLoad } from "./load-identity-providers-settings-page-data";
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
          pageIntro={IDENTITY_PROVIDERS_SAML_PAGE_INTRO}
          refreshing={model.refreshing}
          lastRefreshedAt={model.lastRefreshedAt}
          onRefresh={() => void model.refresh()}
        >
<SamlSpConfigurationForm />
        </IdentityProvidersSettingsShell>
      )}
    </IdentityProvidersSettingsGate>
  );
}
