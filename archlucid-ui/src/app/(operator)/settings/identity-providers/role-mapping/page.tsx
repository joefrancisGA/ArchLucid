import { IdentityProvidersRoleMappingPageClient } from "../_sections/IdentityProvidersRoleMappingPageClient";
import { loadIdentityProvidersSettingsPageData } from "../_sections/load-identity-providers-settings-page-data";

export default async function IdentityProvidersRoleMappingPage() {
  const loaded = await loadIdentityProvidersSettingsPageData();

  return <IdentityProvidersRoleMappingPageClient loaded={loaded} />;
}
