/**
 * Private-beta wizard create can observe empty non-JSON POSTs to the same proxy path
 * (preflight leftovers, aborted retries). Only JSON create payloads are the run id.
 */
export function isArchitectureRequestCreateJsonResponse(args: {
  url: string;
  method: string;
  contentType: string | undefined;
}): boolean {
  if (args.method !== "POST") {
    return false;
  }

  if (!args.url.includes("/api/proxy/v1/architecture/request")) {
    return false;
  }

  return (args.contentType ?? "").toLowerCase().includes("json");
}

export function readCreatedRunIdFromArchitectureRequestBody(bodyText: string): string {
  const trimmed = bodyText.trim();

  if (trimmed.length === 0) {
    throw new Error("POST /architecture/request returned an empty body.");
  }

  const createJson = JSON.parse(trimmed) as { run?: { runId?: string } };
  const runId = createJson.run?.runId ?? "";

  if (runId.length === 0) {
    throw new Error(`POST /architecture/request JSON omitted run.runId: ${trimmed}`);
  }

  return runId;
}
