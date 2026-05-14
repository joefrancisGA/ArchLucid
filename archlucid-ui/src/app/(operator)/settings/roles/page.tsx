import { SettingsRolesPageClient } from "./_sections/SettingsRolesPageClient";
import { loadSettingsRolesPageData } from "./_sections/load-settings-roles-page-data";

/**
 * Admin-only role management: tenant users and API keys with ArchLucid app roles. Persist calls target
 * provisional REST paths; when the API returns 404/405/501, updates are acknowledged as UI-preview only.
 */
export default async function SettingsRolesPage() {
  const loaded = await loadSettingsRolesPageData();

  return <SettingsRolesPageClient loaded={loaded} />;
}
