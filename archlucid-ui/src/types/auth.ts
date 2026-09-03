/**
 * Role assigned to a principal in the ArchLucid RBAC model (`ArchLucidRoles` on the API).
 *
 * Wave 9: no OpenAPI enum/schema exists for app roles — this string union is intentional and mirrors
 * server constants. For principal read-models see `ArchLucidAppRole` in `@/lib/current-principal`.
 */
export type ArchLucidRole = "Admin" | "Operator" | "Reader" | "Auditor";
