import type { ArchLucidAppRole } from "@/lib/current-principal";

/** Error / empty-result states surfaced as product copy (not developer diagnostics). */
export type SettingsRolesPageNote = "api_unavailable" | "empty_response" | "load_failed";

export type SettingsRolesAssignablePrincipalRow = {
  id: string;
  kind: "user" | "api_key";
  name: string;
  detail: string;
  role: ArchLucidAppRole;
};

export type SettingsRolesPageSurface = "demo" | "authority_loading" | "forbidden" | "admin";
