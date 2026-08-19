import type { ApiProblemDetails } from "@/lib/api-problem";
import {
  classifyApiConnectivityFailure,
  type ApiConnectivityFailureKind,
} from "@/lib/api-error-toast-policy";
import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";
import { ensureCorrelationId } from "@/lib/usability/ensure-correlation-id";

export const OPERATOR_CONNECTIVITY_ERROR_PRIMARY_HEADING = "Workspace data unavailable";

export const OPERATOR_CONNECTIVITY_ERROR_PRIMARY_BODY =
  "ArchLucid could not reach the API service for this workspace. Retry the request, open troubleshooting, or review system health.";

export const OPERATOR_CONNECTIVITY_CONFIG_HINT_GENERIC =
  "Verify API service status, network/proxy access, and configured API base URL.";

export const OPERATOR_CONNECTIVITY_CHECKLIST_LABEL = "Connectivity checklist";

export const OPERATOR_CONNECTIVITY_TECHNICAL_DETAILS_LABEL = "Technical details";

export type OperatorConnectivityPresentationInput = {
  readonly message: string;
  readonly httpStatus: number | null;
  readonly problem: ApiProblemDetails | null;
  readonly correlationId: string | null;
};

export type OperatorConnectivityTechnicalDetails = {
  readonly kind: ApiConnectivityFailureKind;
  readonly errorType: string;
  readonly cause: string;
  readonly correlationId: string;
  readonly configurationHint: string;
  readonly localDevConfigurationHint: string | null;
  readonly errorCode: string | null;
  readonly httpStatus: number | null;
  readonly endpointLine: string | null;
};

function resolveErrorType(kind: ApiConnectivityFailureKind, problem: ApiProblemDetails | null): string {
  const title = problem?.title?.trim();

  if (title !== undefined && title.length > 0) {
    return title;
  }

  if (kind === "assistant-stream") {
    return "Review assistant stream unreachable";
  }

  if (kind === "api-not-configured") {
    return "API URL not configured";
  }

  if (kind === "network") {
    return "Network or transport failure";
  }

  return "Upstream API unreachable";
}

function resolveCause(message: string, problem: ApiProblemDetails | null): string {
  const detail = problem?.detail?.trim();

  if (detail !== undefined && detail.length > 0) {
    return detail;
  }

  const trimmedMessage = message.trim();

  if (trimmedMessage.length > 0) {
    return trimmedMessage;
  }

  return "Unknown connectivity failure";
}

function resolveLocalDevConfigurationHint(problem: ApiProblemDetails | null): string | null {
  if (process.env.NODE_ENV !== "development" || isBuyerPolishedOperatorShellEnv()) {
    return null;
  }

  const supportHint = problem?.supportHint?.trim();

  if (supportHint !== undefined && supportHint.length > 0) {
    return supportHint;
  }

  return "Set ARCHLUCID_API_BASE_URL in archlucid-ui/.env.local to the API root (e.g. http://localhost:5128). Restart the dev server after editing.";
}

export function classifyOperatorConnectivityFailure(
  input: OperatorConnectivityPresentationInput,
): ApiConnectivityFailureKind | null {
  return classifyApiConnectivityFailure({
    message: input.message,
    httpStatus: input.httpStatus,
    problem: input.problem,
  });
}

export function resolveOperatorConnectivityTechnicalDetails(
  input: OperatorConnectivityPresentationInput,
): OperatorConnectivityTechnicalDetails | null {
  const kind = classifyOperatorConnectivityFailure(input);

  if (kind === null) {
    return null;
  }

  return {
    kind,
    errorType: resolveErrorType(kind, input.problem),
    cause: resolveCause(input.message, input.problem),
    correlationId: ensureCorrelationId(input.correlationId ?? input.problem?.correlationId),
    configurationHint: OPERATOR_CONNECTIVITY_CONFIG_HINT_GENERIC,
    localDevConfigurationHint: resolveLocalDevConfigurationHint(input.problem),
    errorCode: input.problem?.errorCode?.trim() ?? null,
    httpStatus: input.httpStatus ?? input.problem?.status ?? null,
    endpointLine: input.problem?.instance?.trim() ?? null,
  };
}
