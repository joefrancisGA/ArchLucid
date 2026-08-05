"use client";

import { IdentityProvidersOidcPageView } from "./IdentityProvidersOidcPageView";
import { IdentityProvidersSettingsGate } from "./IdentityProvidersSettingsGate";
import type { IdentityProvidersSettingsPageServerLoad } from "./load-identity-providers-settings-page-data";

type Props = {
  readonly loaded: IdentityProvidersSettingsPageServerLoad;
};

export function IdentityProvidersOidcPageClient(props: Props): React.JSX.Element {
  return (
    <IdentityProvidersSettingsGate loaded={props.loaded}>
      {(model) => <IdentityProvidersOidcPageView model={model} />}
    </IdentityProvidersSettingsGate>
  );
}
