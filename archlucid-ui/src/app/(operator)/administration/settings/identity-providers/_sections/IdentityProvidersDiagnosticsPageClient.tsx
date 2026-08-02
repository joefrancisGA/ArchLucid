"use client";

import { IdentityProvidersDiagnosticsPageView } from "./IdentityProvidersDiagnosticsPageView";
import { IdentityProvidersSettingsGate } from "./IdentityProvidersSettingsGate";
import type { IdentityProvidersSettingsPageServerLoad } from "./load-identity-providers-settings-page-data";

type Props = {
  readonly loaded: IdentityProvidersSettingsPageServerLoad;
};

export function IdentityProvidersDiagnosticsPageClient(props: Props): React.JSX.Element {
  return (
    <IdentityProvidersSettingsGate loaded={props.loaded}>
      {(model) => <IdentityProvidersDiagnosticsPageView model={model} />}
    </IdentityProvidersSettingsGate>
  );
}
