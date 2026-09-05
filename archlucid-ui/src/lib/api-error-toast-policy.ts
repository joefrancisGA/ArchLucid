import type { ApiRequestError } from "@/lib/api-request-error";
import type { ApiProblemDetails } from "@/lib/api-problem";
import type { ApiValidationFieldError } from "@/lib/api-validation-problem";
import {
  buildValidationProblemDisplayCopy,
  isHttpRequestValidationFailure,
  sanitizeOperatorFacingText,
} from "@/lib/api-validation-problem";
import { operatorCopyForProblem } from "@/lib/api-problem-copy";

export type ApiRequestErrorToastPlan =
  | { readonly action: "suppress" }
  | {
      readonly action: "show";
      readonly title: string;
      readonly detail: string;
      readonly type: "error" | "warning";
      readonly endpointLine?: string | null;
      readonly validationFields?: readonly ApiValidationFieldError[];
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

function isUpstreamApiUrlMisconfigurationProblem(params: {
  readonly message: string;
  readonly problem: ApiProblemDetails | null;
}): boolean {
  const lower = params.message.toLowerCase();
  const title = (params.problem?.title ?? "").trim().toLowerCase();
  const detail = (params.problem?.detail ?? "").trim().toLowerCase();
  const supportHint = (params.problem?.supportHint ?? "").trim().toLowerCase();
  const haystack = [lower, title, detail, supportHint].join("\n");

  if (haystack.includes("invalid upstream api configuration")) {
    return true;
  }

  if (haystack.includes("archlucid_api_base_url")) {
    return true;
  }

  if (
    haystack.includes("not configured")
    && (haystack.includes("api base url") || haystack.includes("upstream api url"))
  ) {
    return true;
  }

  return false;
}

export function classifyApiConnectivityFailure(params: {
  readonly message: string;
  readonly httpStatus: number | null;
  readonly problem: ApiProblemDetails | null;
}): ApiConnectivityFailureKind | null {
  const lower = params.message.toLowerCase();

  if (lower.includes("usestream"))
    return "assistant-stream";

  if (params.httpStatus === 503 && isUpstreamApiUrlMisconfigurationProblem(params)) {
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
          "The review assistant stream could not be reached. Core review navigation remains available.",
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
    title: resolveNonConnectivityToastTitle(err),
    detail: resolveNonConnectivityToastDetail(err),
    type: "error",
    endpointLine: resolveValidationEndpointLine(err),
    validationFields: resolveValidationFields(err),
  };
}

function resolveNonConnectivityToastTitle(err: ApiRequestError): string {
  if (isHttpRequestValidationFailure(err.httpStatus, err.problem)) {
    return buildValidationProblemDisplayCopy(err.problem, { httpStatus: err.httpStatus }).heading;
  }

  const copy = operatorCopyForProblem(err.problem, err.message, { httpStatus: err.httpStatus });

  return copy.heading;
}

function resolveNonConnectivityToastDetail(err: ApiRequestError): string {
  if (isHttpRequestValidationFailure(err.httpStatus, err.problem)) {
    const copy = buildValidationProblemDisplayCopy(err.problem, { httpStatus: err.httpStatus });

    if (copy.fieldErrors.length > 0) {
      return "The request body failed server-side validation. See each field below.";
    }
  }

  return sanitizeOperatorFacingText(err.message);
}

function resolveValidationEndpointLine(err: ApiRequestError): string | null {
  if (!isHttpRequestValidationFailure(err.httpStatus, err.problem)) {
    return null;
  }

  return buildValidationProblemDisplayCopy(err.problem, { httpStatus: err.httpStatus }).endpointLine;
}

function resolveValidationFields(err: ApiRequestError): readonly ApiValidationFieldError[] | undefined {
  if (!isHttpRequestValidationFailure(err.httpStatus, err.problem)) {
    return undefined;
  }

  const fields = buildValidationProblemDisplayCopy(err.problem, { httpStatus: err.httpStatus }).fieldErrors;

  return fields.length > 0 ? fields : undefined;
}
