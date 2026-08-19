"use client";

import { IdentityProvidersOidcPageView } from "./IdentityProvidersOidcPageView";
import { IdentityProvidersSettingsGate } from "./IdentityProvidersSettingsGate";

export function IdentityProvidersOidcPageClient(): React.JSX.Element {
  return (
    <IdentityProvidersSettingsGate>
      {(model) => <IdentityProvidersOidcPageView model={model} />}
    </IdentityProvidersSettingsGate>
  );
}
