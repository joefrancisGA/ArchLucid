import type { ReactNode } from "react";

import { IdentityProvidersSettingsLayoutClient } from "./_sections/IdentityProvidersSettingsLayoutClient";
import { loadIdentityProvidersSettingsPageData } from "./_sections/load-identity-providers-settings-page-data";

export default async function IdentityProvidersSettingsLayout({ children }: { children: ReactNode }) {
  const loaded = await loadIdentityProvidersSettingsPageData();

  return <IdentityProvidersSettingsLayoutClient loaded={loaded}>{children}</IdentityProvidersSettingsLayoutClient>;
}
