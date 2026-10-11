export type CollectionRunStatus =
  | "Running"
  | "Succeeded"
  | "PartiallySucceeded"
  | "Failed"
  | "Imported"
  | "Rejected";

export type CollectionRun = {
  readonly tenantId: string;
  readonly workspaceId: string;
  readonly projectId: string;
  readonly runId: string;
  readonly agentVersion: string;
  readonly scheduleDescription: string | null;
  readonly startedUtc: string;
  readonly finishedUtc: string | null;
  readonly status: CollectionRunStatus | number;
  readonly subscriptionsCoveredJson: string;
  readonly errorSummary: string | null;
  readonly zipPath: string | null;
  readonly importedSnapshotId: string | null;
};

export type CollectionRunTriggerResponse = {
  readonly runId: string;
  readonly alreadyPending: boolean;
};

export class CollectionRunApiError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "CollectionRunApiError";
    this.status = status;
  }
}

export async function fetchCollectionRuns(signal?: AbortSignal): Promise<CollectionRun[]> {
  const response = await fetch("/api/proxy/v1/collection-runs?limit=50", {
    method: "GET",
    credentials: "include",
    signal,
    headers: { Accept: "application/json" },
  });
  return readResponse<CollectionRun[]>(response);
}

export async function triggerCollectionRun(): Promise<CollectionRunTriggerResponse> {
  const response = await fetch("/api/proxy/v1/collection-runs:trigger", {
    method: "POST",
    credentials: "include",
    headers: { Accept: "application/json" },
  });
  return readResponse<CollectionRunTriggerResponse>(response);
}

async function readResponse<T>(response: Response): Promise<T> {
  const payload: unknown = await response.json().catch(() => null);

  if (!response.ok) {
    const message =
      typeof payload === "object" &&
      payload !== null &&
      "detail" in payload &&
      typeof payload.detail === "string"
        ? payload.detail
        : `Collection agent request failed (${response.status}).`;
    throw new CollectionRunApiError(message, response.status);
  }

  return payload as T;
}
