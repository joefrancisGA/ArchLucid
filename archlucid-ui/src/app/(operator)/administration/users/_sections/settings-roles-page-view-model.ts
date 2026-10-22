import type { ArchLucidAppRole } from "@/lib/current-principal";
import type { UsersMembersDirectorySource } from "@/lib/vocabulary/scim-users-vocabulary";

import type {
  SettingsRolesAssignablePrincipalRow,
  SettingsRolesPageNote,
  SettingsRolesPageSurface,
} from "./settings-roles-page-types";

export type SettingsRolesPageViewModel = {
  readonly surface: SettingsRolesPageSurface;
  readonly loading: boolean;
  readonly sortedRows: SettingsRolesAssignablePrincipalRow[];
  readonly usersNote: SettingsRolesPageNote | null;
  readonly keysNote: SettingsRolesPageNote | null;
  /** Null while SCIM token probe is in flight. */
  readonly usersDirectorySource: UsersMembersDirectorySource | null;
  readonly load: () => Promise<void>;
  readonly onRoleChange: (
    row: SettingsRolesAssignablePrincipalRow,
    nextRole: ArchLucidAppRole,
  ) => Promise<"saved" | "rejected">;
};
