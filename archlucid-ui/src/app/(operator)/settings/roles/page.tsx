import { SettingsRolesPageMain } from "./_sections/SettingsRolesPageMain";

/**
 * Admin-only role management: tenant users and API keys with ArchLucid app roles. Persist calls target
 * provisional REST paths; when the API returns 404/405/501, updates are acknowledged as UI-preview only.
 */
export default function SettingsRolesPage() {
  return <SettingsRolesPageMain />;
}
