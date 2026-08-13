import { ApiV1Routes } from "@/lib/api-v1-routes";
import { mergeRegistrationScopeForProxy } from "@/lib/proxy-fetch-registration-scope";

export type DeleteTenantWorkspaceProjectResult =
  | Readonly<{ ok: true }>
  | Readonly<{ ok: false; status: number; message: string }>;

export async function deleteTenantWorkspaceProject(
  workspaceId: string,
  projectId: string,
): Promise<DeleteTenantWorkspaceProjectResult> {
  const encodedWorkspace = encodeURIComponent(workspaceId.trim());
  const encodedProject = encodeURIComponent(projectId.trim());
  const path = `/api/proxy/${ApiV1Routes.tenantWorkspaces}/${encodedWorkspace}/projects/${encodedProject}`;

  const response = await fetch(
    path,
    mergeRegistrationScopeForProxy({
      method: "DELETE",
      headers: { Accept: "application/json" },
    }),
  );

  if (response.status === 204) {
    return { ok: true };
  }

  let message = `Could not delete project (${response.status}).`;

  try {
    const json: unknown = await response.json();

    if (json !== null && typeof json === "object") {
      const detail = (json as { detail?: unknown; title?: unknown }).detail;

      if (typeof detail === "string" && detail.trim().length > 0) {
        message = detail.trim();
      } else {
        const title = (json as { title?: unknown }).title;

        if (typeof title === "string" && title.trim().length > 0) {
          message = title.trim();
        }
      }
    }
  } catch {
    // Keep generic message when problem+json is unavailable.
  }

  return { ok: false, status: response.status, message };
}
