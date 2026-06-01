import type { ApiRequestError } from "@/lib/api-request-error";
import type { ApiProblemDetails } from "@/lib/api-problem";

export type ApiRequestErrorToastPlan =
  | { readonly action: "suppress" }
  | {
      readonly action: "show";
      readonly title: string;
      readonly detail: string;
      readonly type: "error" | "warning";
    };

export type ApiConnectivityFailureKind =
  | "assistant-stream"
  | "upstream-unreachable"
  | "api-not-configured"
  | "network";

/** @deprecated Use {@link classifyApiConnectivityFailure} for toast routing (TB-157). */
export function isConnectivityOrAssistantFailure(message: string): boolean {
  return classifyApiConnectivityFailure({ message, httpStatus: null, problem: null }) !== null;
}

export function classifyApiConnectivityFailure(params: {
  readonly message: string;
  readonly httpStatus: number | null;
  readonly problem: ApiProblemDetails | null;
}): ApiConnectivityFailureKind | null {
  const lower = params.message.toLowerCase();
  const supportHint = (params.problem?.supportHint ?? "").trim();

  if (lower.includes("usestream"))
    return "assistant-stream";

  if (
    params.httpStatus === 503
    && (lower.includes("not configured") || lower.includes("archlucid_api_base_url") || supportHint.length > 0)
  ) {
    return "api-not-configured";
  }

  if (
    params.httpStatus === 502
    || lower.includes("upstream api unreachable")
    || lower.includes("upstream unreachable")
  ) {
    return "upstream-unreachable";
  }

  if (
    lower.includes("fetch failed")
    || lower.includes("econnreset")
    || lower.includes("network error")
    || lower.includes("failed to fetch")
  ) {
    return "network";
  }

  return null;
}

export function resolveApiRequestErrorToastPlan(
  err: ApiRequestError,
  buyerPolishedShell: boolean,
): ApiRequestErrorToastPlan {
  const connectivityKind = classifyApiConnectivityFailure({
    message: err.message,
    httpStatus: err.httpStatus,
    problem: err.problem,
  });

  if (connectivityKind !== null) {
    if (buyerPolishedShell) {
      return { action: "suppress" };
    }

    const supportHint = err.problem?.supportHint?.trim();
    const correlationSuffix =
      err.correlationId && err.correlationId.trim().length > 0
        ? ` Correlation id: ${err.correlationId.trim()}.`
        : "";

    if (connectivityKind === "assistant-stream") {
      return {
        action: "show",
        title: "Review assistant unavailable",
        detail:
          "The review assistant stream could not be reached. Core review package navigation remains available.",
        type: "warning",
      };
    }

    if (connectivityKind === "api-not-configured") {
      return {
        action: "show",
        title: "API URL not configured",
        detail:
          supportHint
          ?? "Set ARCHLUCID_API_BASE_URL in archlucid-ui/.env.local to your ArchLucid.Api base URL, then restart npm run dev.",
        type: "error",
      };
    }

    if (connectivityKind === "upstream-unreachable") {
      return {
        action: "show",
        title: "ArchLucid API unreachable",
        detail:
          (supportHint
            ?? "The UI proxy could not reach the backend API. Verify ArchLucid.Api is running and ARCHLUCID_API_BASE_URL matches its port.")
          + correlationSuffix,
        type: "warning",
      };
    }

    return {
      action: "show",
      title: "Cannot reach ArchLucid API",
      detail: `Network or transport failure while calling the API.${correlationSuffix}`,
      type: "warning",
    };
  }

  return {
    action: "show",
    title: "Server error",
    detail: err.message,
    type: "error",
  };
}
