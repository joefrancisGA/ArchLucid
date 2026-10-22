import type { components } from "@/lib/openapi-schemas";
import { mergeRegistrationScopeForProxy } from "@/lib/proxy-fetch-registration-scope";

export type AdminOutboxSnapshot = components["schemas"]["AdminOutboxSnapshot"];

const ADMIN_OUTBOX_DIAGNOSTICS_PATH = "/api/proxy/v1/admin/diagnostics/outboxes";

/** Admin queue depths for authority pipeline and integration event outboxes. */
export async function fetchAdminOutboxDiagnostics(): Promise<AdminOutboxSnapshot | null> {
  try {
    const response = await fetch(
      ADMIN_OUTBOX_DIAGNOSTICS_PATH,
      mergeRegistrationScopeForProxy({ headers: { Accept: "application/json" }, cache: "no-store" }),
    );

    if (!response.ok) {
      return null;
    }

    return (await response.json()) as AdminOutboxSnapshot;
  } catch {
    return null;
  }
}
