import { apiGet } from "./http";
import type { WorkspaceSystemNameOccupancyKind } from "@/lib/workspace-system-name-availability-copy";

export type WorkspaceSystemNameAvailabilityResponse = {
  readonly systemName?: string;
  readonly isAvailable?: boolean;
  readonly conflictMessage?: string | null;
};

export type WorkspaceSystemNameAvailabilityQuery = {
  readonly systemName: string;
  readonly occupancyKind?: WorkspaceSystemNameOccupancyKind;
  readonly excludeDraftId?: string | null;
  readonly excludeRunId?: string | null;
  readonly signal?: AbortSignal;
};

/** GET /v1/architecture/workspace-system-name-availability — non-mutating workspace name probe. */
export async function fetchWorkspaceSystemNameAvailability(
  query: WorkspaceSystemNameAvailabilityQuery,
): Promise<WorkspaceSystemNameAvailabilityResponse> {
  const params = new URLSearchParams();
  params.set("systemName", query.systemName);
  params.set("occupancyKind", query.occupancyKind ?? "review");

  const trimmedExcludeDraftId = query.excludeDraftId?.trim() ?? "";
  if (trimmedExcludeDraftId.length > 0) {
    params.set("excludeDraftId", trimmedExcludeDraftId);
  }

  const trimmedExcludeRunId = query.excludeRunId?.trim() ?? "";
  if (trimmedExcludeRunId.length > 0) {
    params.set("excludeRunId", trimmedExcludeRunId);
  }

  return apiGet<WorkspaceSystemNameAvailabilityResponse>(
    `/v1/architecture/workspace-system-name-availability?${params.toString()}`,
    { signal: query.signal },
  );
}
