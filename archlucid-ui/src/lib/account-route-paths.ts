/**
 * Canonical URLs for settings that write only the signed-in caller's own record.
 *
 * The `/account` prefix is an audience contract: these pages are ungated and personal, while
 * `/administration/*` administers the tenant (see `settings-master-audience.ts`). Keeping the two
 * namespaces apart is what lets personal settings drop the "no Admin role is required" disclaimer —
 * the URL no longer implies otherwise.
 *
 * Add a page here only when it writes nothing but the caller's own record. Hubs that merely launch
 * workspace-scoped configuration stay under `SETTINGS_ROOT_PATH` even when the account menu lists
 * them (for example the notification preference hub).
 */
export const ACCOUNT_ROOT_PATH = "/account" as const;

/** Personal appearance and theme settings, reached from the top-bar account menu. */
export const ACCOUNT_PREFERENCES_PATH = `${ACCOUNT_ROOT_PATH}/preferences` as const;

/** Personal sign-in methods — linking and removal — reached from the top-bar account menu. */
export const ACCOUNT_SECURITY_PATH = `${ACCOUNT_ROOT_PATH}/security` as const;
