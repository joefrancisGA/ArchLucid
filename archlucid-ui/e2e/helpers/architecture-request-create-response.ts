/**
 * Wizard create posts POST /v1/architecture/request/async (Tier C: 202 + Location, empty body).
 * Sync Simulator create still posts JSON to POST /v1/architecture/request.
 * Draft / idempotency / batch siblings share the prefix and must not match.
 */

const SYNC_PROXY_SUFFIX = "/api/proxy/v1/architecture/request";
const ASYNC_PROXY_SUFFIX = "/api/proxy/v1/architecture/request/async";

export function isArchitectureRequestCreateResponse(args: {
  url: string;
  method: string;
}): boolean {
  if (args.method !== "POST") {
    return false;
  }

  const pathname = proxyPathname(args.url);

  return pathname.endsWith(ASYNC_PROXY_SUFFIX) || pathname.endsWith(SYNC_PROXY_SUFFIX);
}

export function readCreatedRunIdFromArchitectureRequestCreate(args: {
  status: number;
  bodyText: string;
  location: string | null | undefined;
}): string {
  const fromBody = tryReadRunIdFromJsonBody(args.bodyText);

  if (fromBody.length > 0) {
    return fromBody;
  }

  const fromLocation = tryReadRunIdFromLocation(args.location);

  if (fromLocation.length > 0) {
    return fromLocation;
  }

  const bodyPreview = args.bodyText.trim().slice(0, 500);
  const location = (args.location ?? "").trim();

  throw new Error(
    `POST /architecture/request create omitted run id (status ${String(args.status)}, location ${location.length > 0 ? location : "<none>"}, body ${bodyPreview.length > 0 ? bodyPreview : "<empty>"}).`,
  );
}

export function readCreatedRunIdFromArchitectureRequestBody(bodyText: string): string {
  const fromBody = tryReadRunIdFromJsonBody(bodyText);

  if (fromBody.length > 0) {
    return fromBody;
  }

  const trimmed = bodyText.trim();

  if (trimmed.length === 0) {
    throw new Error("POST /architecture/request returned an empty body.");
  }

  throw new Error(`POST /architecture/request JSON omitted run.runId: ${trimmed}`);
}

function proxyPathname(url: string): string {
  try {
    return new URL(url).pathname.replace(/\/+$/, "");
  } catch {
    const withoutQuery = (url.split("?")[0] ?? "").split("#")[0] ?? "";

    return withoutQuery.replace(/\/+$/, "");
  }
}

function tryReadRunIdFromJsonBody(bodyText: string): string {
  const trimmed = bodyText.trim();

  if (trimmed.length === 0) {
    return "";
  }

  try {
    const createJson = JSON.parse(trimmed) as { run?: { runId?: string } };

    return createJson.run?.runId ?? "";
  } catch {
    return "";
  }
}

function tryReadRunIdFromLocation(location: string | null | undefined): string {
  if (location === null || location === undefined) {
    return "";
  }

  const trimmed = location.trim();

  if (trimmed.length === 0) {
    return "";
  }

  const marker = "/operations/";
  const markerIndex = trimmed.toLowerCase().indexOf(marker);

  if (markerIndex < 0) {
    return "";
  }

  const rest = trimmed.slice(markerIndex + marker.length);
  const withoutQuery = rest.split("?")[0] ?? "";
  const withoutHash = withoutQuery.split("#")[0] ?? "";

  try {
    const operationId = decodeURIComponent(withoutHash.trim());

    if (!operationId.toLowerCase().startsWith("run:") || operationId.length <= 4) {
      return "";
    }

    return operationId.slice(4);
  } catch {
    return "";
  }
}
