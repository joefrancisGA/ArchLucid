"use client";

import { IdentityProvidersSettingsGate } from "./IdentityProvidersSettingsGate";
import { IdentityProvidersSettingsPageView } from "./IdentityProvidersSettingsPageView";

export function IdentityProvidersSettingsPageClient(): React.JSX.Element {
  return (
    <IdentityProvidersSettingsGate>
      {(model) => <IdentityProvidersSettingsPageView model={model} />}
    </IdentityProvidersSettingsGate>
  );
}
