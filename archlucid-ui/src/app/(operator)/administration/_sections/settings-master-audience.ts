import type { SettingsMasterAudience, SettingsMasterScopeKind } from "./settings-master-types";

/**
 * Derives the audience for a destination from the scope its writes touch.
 *
 * Scope answers "whose record changes when this is saved?", and that is what decides visibility. A caller
 * editing only their own record is not exercising privilege, so self-scoped settings carry no authority
 * gate and are published from the account menu instead of this hub. Anything writing shared
 * tenant/workspace/project state is administrative and stays behind the hub's authority filter.
 */
export function settingsMasterAudienceForScope(scope: SettingsMasterScopeKind): SettingsMasterAudience {
  switch (scope) {
    case "user":
    case "browser":
      return "self";

    case "tenant":
    case "workspace":
    case "project":
      return "workspace-admin";

    default: {
      // Exhaustiveness guard — a new scope kind must be classified here before it can ship.
      const unhandledScope: never = scope;

      return unhandledScope;
    }
  }
}
