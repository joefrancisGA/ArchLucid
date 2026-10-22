"use client";

import { IdentityProvidersRoleMappingPageView } from "./IdentityProvidersRoleMappingPageView";
import { IdentityProvidersSettingsGate } from "./IdentityProvidersSettingsGate";

export function IdentityProvidersRoleMappingPageClient(): React.JSX.Element {
  return (
    <IdentityProvidersSettingsGate>
      {(model) => <IdentityProvidersRoleMappingPageView model={model} />}
    </IdentityProvidersSettingsGate>
  );
}
