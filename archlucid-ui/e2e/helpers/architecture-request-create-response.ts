/**
 * Private-beta wizard create can observe empty non-JSON POSTs to the same proxy path
 * (preflight leftovers, aborted retries). Sync JSON create payloads carry the run id.
 * Wizard-managed creates now admit via POST /architecture/request/async (202 + Location).
 */

export function isArchitectureRequestCreateProxyPost(args: {
  url: string;
  method: string;
}): boolean {
  if (args.method !== "POST") {
    return false;
  }

  return args.url.includes("/api/proxy/v1/architecture/request");
}

export function isArchitectureRequestCreateJsonResponse(args: {
  url: string;
  method: string;
  contentType: string | undefined;
}): boolean {
  if (!isArchitectureRequestCreateProxyPost(args)) {
    return false;
  }

  return (args.contentType ?? "").toLowerCase().includes("json");
}

export function isArchitectureRequestCreateAcceptedResponse(args: {
  url: string;
  method: string;
  status: number;
}): boolean {
  if (!isArchitectureRequestCreateProxyPost(args)) {
    return false;
  }

  return args.status === 202;
}

export function isArchitectureRequestCreateObservedResponse(args: {
  url: string;
  method: string;
  contentType: string | undefined;
  status: number;
}): boolean {
  return (
    isArchitectureRequestCreateJsonResponse(args) || isArchitectureRequestCreateAcceptedResponse(args)
  );
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

export function readCreatedRunIdFromArchitectureRequestLocation(
  location: string | null | undefined,
): string {
  if (location === null || location === undefined) {
    throw new Error("POST /architecture/request/async 202 omitted Location.");
  }

  const trimmed = location.trim();

  if (trimmed.length === 0) {
    throw new Error("POST /architecture/request/async 202 omitted Location.");
  }

  const marker = "/operations/";
  const markerIndex = trimmed.toLowerCase().indexOf(marker);

  if (markerIndex < 0) {
    throw new Error(`POST /architecture/request/async Location omitted /operations/: ${trimmed}`);
  }

  const rest = trimmed.slice(markerIndex + marker.length);
  const withoutQuery = rest.split("?")[0] ?? "";
  const withoutHash = withoutQuery.split("#")[0] ?? "";
  let operationId = withoutHash.trim();

  try {
    operationId = decodeURIComponent(operationId);
  } catch {
    throw new Error(`POST /architecture/request/async Location was not decodable: ${trimmed}`);
  }

  if (operationId.startsWith("run:") && operationId.length > 4) {
    return operationId.slice(4);
  }

  throw new Error(`POST /architecture/request/async Location omitted run: handle: ${trimmed}`);
}

export function readCreatedRunIdFromArchitectureRequestResponse(args: {
  status: number;
  bodyText: string;
  location: string | undefined;
}): string {
  if (args.status === 202) {
    return readCreatedRunIdFromArchitectureRequestLocation(args.location);
  }

  return readCreatedRunIdFromArchitectureRequestBody(args.bodyText);
}
