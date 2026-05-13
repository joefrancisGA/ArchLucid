"use client";

import { IdentityProvidersSettingsPageView } from "./IdentityProvidersSettingsPageView";
import { useIdentityProvidersSettingsPage } from "./use-identity-providers-settings-page";

export function IdentityProvidersSettingsPageMain() {
  const model = useIdentityProvidersSettingsPage();

  return <IdentityProvidersSettingsPageView model={model} />;
}
