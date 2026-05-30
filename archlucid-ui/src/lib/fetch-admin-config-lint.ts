import { mergeRegistrationScopeForProxy } from "@/lib/proxy-fetch-registration-scope";

export type AdminConfigLintSummary = {
  readonly blockingCount: number;
  readonly advisoryCount: number;
  readonly loadFailed: boolean;
};

const CONFIG_LINT_PATH = "/api/proxy/v1/admin/config-lint?includeAdvisory=true";

/** Loads config-lint counts for first-pilot cockpit (#4). Non-admins should not call this route. */
export async function fetchAdminConfigLintSummary(): Promise<AdminConfigLintSummary> {
  try {
    const response = await fetch(
      CONFIG_LINT_PATH,
      mergeRegistrationScopeForProxy({ headers: { Accept: "application/json" }, cache: "no-store" }),
    );

    if (!response.ok)
      return { blockingCount: 0, advisoryCount: 0, loadFailed: true };

    const json: unknown = await response.json();

    if (json === null || typeof json !== "object")
      return { blockingCount: 0, advisoryCount: 0, loadFailed: true };

    const payload = json as {
      blockingFindings?: unknown[] | null;
      advisoryFindings?: unknown[] | null;
    };

    return {
      blockingCount: Array.isArray(payload.blockingFindings) ? payload.blockingFindings.length : 0,
      advisoryCount: Array.isArray(payload.advisoryFindings) ? payload.advisoryFindings.length : 0,
      loadFailed: false,
    };
  } catch {
    return { blockingCount: 0, advisoryCount: 0, loadFailed: true };
  }
}
