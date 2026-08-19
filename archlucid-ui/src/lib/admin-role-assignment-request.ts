import type { ArchLucidAppRole } from "@/lib/current-principal";
import { mergeRegistrationScopeForProxy } from "@/lib/proxy-fetch-registration-scope";

export type RoleAssignablePrincipalKind = "user" | "api_key";

/**
 * PUTs an app-role assignment for a tenant user or API key through the Next.js proxy.
 * Returns whether the API persisted the change or failed (missing endpoints are failures, not preview success).
 */
export async function requestPrincipalAppRoleAssignment(
  row: { kind: RoleAssignablePrincipalKind; id: string },
  appRole: ArchLucidAppRole,
  fetchFn: typeof fetch = fetch,
): Promise<"saved" | "failed"> {
  const path =
    row.kind === "user"
      ? `/api/proxy/v1/admin/users/${encodeURIComponent(row.id)}/role`
      : `/api/proxy/v1/admin/api-keys/${encodeURIComponent(row.id)}/role`;

  try {
    const res = await fetchFn(
      path,
      mergeRegistrationScopeForProxy({
        method: "PUT",
        headers: { Accept: "application/json", "Content-Type": "application/json" },
        body: JSON.stringify({ appRole }),
      }),
    );

    if (res.ok) {
      return "saved";
    }

    return "failed";
  } catch {
    return "failed";
  }
}
