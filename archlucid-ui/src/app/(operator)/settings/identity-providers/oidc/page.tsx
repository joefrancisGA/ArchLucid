import { IdentityProvidersOidcPageClient } from "../_sections/IdentityProvidersOidcPageClient";
import { loadIdentityProvidersSettingsPageData } from "../_sections/load-identity-providers-settings-page-data";

export default async function IdentityProvidersOidcPage() {
  const loaded = await loadIdentityProvidersSettingsPageData();

  return <IdentityProvidersOidcPageClient loaded={loaded} />;
}
