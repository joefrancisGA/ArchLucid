"use client";

import { IdentityProvidersRoleMappingPageView } from "./IdentityProvidersRoleMappingPageView";
import { IdentityProvidersSettingsGate } from "./IdentityProvidersSettingsGate";
import type { IdentityProvidersSettingsPageServerLoad } from "./load-identity-providers-settings-page-data";

type Props = {
  readonly loaded: IdentityProvidersSettingsPageServerLoad;
};

export function IdentityProvidersRoleMappingPageClient(props: Props): React.JSX.Element {
  return (
    <IdentityProvidersSettingsGate loaded={props.loaded}>
      {(model) => <IdentityProvidersRoleMappingPageView model={model} />}
    </IdentityProvidersSettingsGate>
  );
}
