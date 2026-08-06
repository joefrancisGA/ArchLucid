import type { ArchLucidAppRole } from "@/lib/current-principal";

export const SETTINGS_ROLES_USERS_PATH = "/api/proxy/v1/admin/users";
export const SETTINGS_ROLES_API_KEYS_PATH = "/api/proxy/v1/admin/api-keys";

export const SETTINGS_ROLES_ASSIGNABLE: readonly ArchLucidAppRole[] = ["Admin", "Operator", "Reader", "Auditor"];
