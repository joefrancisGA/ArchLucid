import { IdentityProvidersSamlPageClient } from "../_sections/IdentityProvidersSamlPageClient";
import { loadIdentityProvidersSettingsPageData } from "../_sections/load-identity-providers-settings-page-data";

export default async function IdentityProvidersSamlPage() {
  const loaded = await loadIdentityProvidersSettingsPageData();

  return <IdentityProvidersSamlPageClient loaded={loaded} />;
}
