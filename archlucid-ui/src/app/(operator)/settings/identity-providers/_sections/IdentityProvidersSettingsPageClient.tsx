"use client";

import { IdentityProvidersSettingsGate } from "./IdentityProvidersSettingsGate";
import { IdentityProvidersSettingsPageView } from "./IdentityProvidersSettingsPageView";
import type { IdentityProvidersSettingsPageServerLoad } from "./load-identity-providers-settings-page-data";

type Props = {
  readonly loaded: IdentityProvidersSettingsPageServerLoad;
};

export function IdentityProvidersSettingsPageClient(props: Props): React.JSX.Element {
  return (
    <IdentityProvidersSettingsGate loaded={props.loaded}>
      {(model) => <IdentityProvidersSettingsPageView model={model} />}
    </IdentityProvidersSettingsGate>
  );
}
