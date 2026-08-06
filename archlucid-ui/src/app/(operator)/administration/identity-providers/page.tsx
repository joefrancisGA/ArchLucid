import { IdentityProvidersSettingsPageClient } from "./_sections/IdentityProvidersSettingsPageClient";
import { loadIdentityProvidersSettingsPageData } from "./_sections/load-identity-providers-settings-page-data";

/**
 * Read-only catalog slice for generic OIDC wiring — surfaces ArchLucidAuth:* keys with masked effective values.
 */
export default async function IdentityProvidersSettingsPage() {
  const loaded = await loadIdentityProvidersSettingsPageData();

  return <IdentityProvidersSettingsPageClient loaded={loaded} />;
}
