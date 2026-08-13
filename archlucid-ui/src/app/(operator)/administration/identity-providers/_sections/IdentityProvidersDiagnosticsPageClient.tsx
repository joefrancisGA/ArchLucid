"use client";

import { IdentityProvidersDiagnosticsPageView } from "./IdentityProvidersDiagnosticsPageView";
import { IdentityProvidersSettingsGate } from "./IdentityProvidersSettingsGate";

export function IdentityProvidersDiagnosticsPageClient(): React.JSX.Element {
  return (
    <IdentityProvidersSettingsGate>
      {(model) => <IdentityProvidersDiagnosticsPageView model={model} />}
    </IdentityProvidersSettingsGate>
  );
}
