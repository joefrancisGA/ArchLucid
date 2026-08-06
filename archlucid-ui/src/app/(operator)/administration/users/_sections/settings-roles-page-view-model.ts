import type { ArchLucidAppRole } from "@/lib/current-principal";

import type {
  SettingsRolesAssignablePrincipalRow,
  SettingsRolesPageNote,
  SettingsRolesPageSurface,
} from "./settings-roles-page-types";

export type SettingsRolesPageViewModel = {
  readonly surface: SettingsRolesPageSurface;
  readonly loading: boolean;
  readonly sortedRows: SettingsRolesAssignablePrincipalRow[];
  readonly note: SettingsRolesPageNote | null;
  readonly load: () => Promise<void>;
  readonly onRoleChange: (row: SettingsRolesAssignablePrincipalRow, nextRole: ArchLucidAppRole) => Promise<void>;
};
