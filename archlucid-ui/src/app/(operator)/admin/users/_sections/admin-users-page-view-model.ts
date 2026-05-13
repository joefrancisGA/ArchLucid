import type { AdminUsersDirectoryRow, AdminUsersNote } from "./admin-users-page-types";

export type AdminUsersPageViewModel = {
  readonly isDemo: boolean;
  readonly loading: boolean;
  readonly rows: AdminUsersDirectoryRow[];
  readonly note: AdminUsersNote | null;
  readonly load: () => Promise<void>;
};
