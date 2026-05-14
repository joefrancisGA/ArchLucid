"use client";

import type { IdentityProvidersSettingsPageServerLoad } from "./load-identity-providers-settings-page-data";
import { IdentityProvidersSettingsPageView } from "./IdentityProvidersSettingsPageView";
import { useIdentityProvidersSettingsPage } from "./use-identity-providers-settings-page";

type Props = {
  readonly loaded: IdentityProvidersSettingsPageServerLoad;
};

export function IdentityProvidersSettingsPageClient(props: Props) {
  const model = useIdentityProvidersSettingsPage(props.loaded);

  return <IdentityProvidersSettingsPageView model={model} />;
}
