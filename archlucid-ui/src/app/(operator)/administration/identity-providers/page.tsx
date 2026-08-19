import { IdentityProvidersSettingsPageClient } from "./_sections/IdentityProvidersSettingsPageClient";

/**
 * Read-only catalog slice for generic OIDC wiring — surfaces ArchLucidAuth:* keys with masked effective values.
 */
export default function IdentityProvidersSettingsPage() {
  return <IdentityProvidersSettingsPageClient />;
}
