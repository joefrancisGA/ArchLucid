import { IdentityProvidersDiagnosticsPageClient } from "../_sections/IdentityProvidersDiagnosticsPageClient";
import { loadIdentityProvidersSettingsPageData } from "../_sections/load-identity-providers-settings-page-data";

export default async function IdentityProvidersDiagnosticsPage() {
  const loaded = await loadIdentityProvidersSettingsPageData();

  return <IdentityProvidersDiagnosticsPageClient loaded={loaded} />;
}
