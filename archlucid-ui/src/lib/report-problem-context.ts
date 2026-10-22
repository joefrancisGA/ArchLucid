import type { ApiProblemDetails } from "@/lib/api-problem";
import {
  formatCiBuildNumberLabel,
  formatShortCommitSha,
  isKnownFingerprintValue,
  readClientDeploymentFingerprint,
} from "@/lib/deployment-fingerprint";
import type { VersionInfoResponse } from "@/lib/health-dashboard-types";
import { getEffectiveBrowserProxyScopeHeaders } from "@/lib/operator/operator-scope-storage";
import { pathnameMatchesReportProblemRoute } from "@/lib/report-problem-surfaces";
import { isSafeCorrelationId } from "@/lib/correlation";
import { ensureCorrelationId } from "@/lib/usability/ensure-correlation-id";

/** Serializable investigation context for Report Problem submit (TB-783). */
export type ReportProblemContext = {
  readonly reviewId: string | null;
  readonly tenantId: string | null;
  readonly workspaceId: string | null;
  readonly productVersion: string | null;
  readonly uiVersion: string | null;
  readonly apiCommitSha: string | null;
  readonly uiCommitSha: string | null;
  readonly deployStamp: string | null;
  readonly environment: string | null;
  readonly browserClient: string | null;
  readonly correlationId: string | null;
  readonly clientRequestId: string | null;
  readonly routePath: string | null;
  readonly errorCode: string | null;
  readonly errorTitle: string | null;
  readonly httpStatus: number | null;
  readonly submittedAtUtc: string;
};

export type ReportProblemScopeSnapshot = {
  readonly tenantId: string;
  readonly workspaceId: string;
};

export type BuildReportProblemContextInput = {
  readonly routePath?: string | null;
  readonly reviewId?: string | null;
  readonly scope?: ReportProblemScopeSnapshot | null;
  readonly productVersion?: VersionInfoResponse | null;
  readonly correlationId?: string | null;
  readonly clientRequestId?: string | null;
  readonly problem?: ApiProblemDetails | null;
  readonly errorCode?: string | null;
  readonly errorTitle?: string | null;
  readonly httpStatus?: number | null;
  /** Test hook — defaults to `new Date().toISOString()` in the browser. */
  readonly submittedAtUtc?: string | null;
};

const REVIEW_DETAIL_ROUTE_PATTERN = "/architecture/reviews/[reviewId]";

export function extractReviewIdFromRoutePath(routePath: string): string | null {
  const normalized = normalizeRoutePath(routePath);

  if (!pathnameMatchesReportProblemRoute(REVIEW_DETAIL_ROUTE_PATTERN, normalized)) {
    return null;
  }

  const parts = normalized.split("/").filter((part) => part.length > 0);
  const reviewsIdx = parts.indexOf("reviews");

  if (reviewsIdx < 0 || parts[0] === "sponsor") {
    return null;
  }

  const segment = parts[reviewsIdx + 1] ?? "";

  if (segment.length === 0 || segment === "new") {
    return null;
  }

  return segment;
}

export function formatReportProblemProductVersion(
  version: VersionInfoResponse | null | undefined,
): string | null {
  if (version === null || version === undefined) {
    return null;
  }

  const parts: string[] = [];

  const application = version.application?.trim() ?? "";

  if (application.length > 0) {
    parts.push(application);
  }

  const informationalVersion = version.informationalVersion?.trim() ?? "";

  if (informationalVersion.length > 0) {
    parts.push(informationalVersion);
  }

  const commitSha = version.commitSha?.trim() ?? "";

  if (commitSha.length > 0) {
    parts.push(`sha=${formatShortCommitSha(commitSha)}`);
  }

  return parts.length > 0 ? parts.join(" ") : null;
}

export function formatReportProblemUiVersion(): string | null {
  const fingerprint = readClientDeploymentFingerprint();
  const identityParts: string[] = [];

  if (isKnownFingerprintValue(fingerprint.frontendCommitSha)) {
    identityParts.push(formatShortCommitSha(fingerprint.frontendCommitSha));
  }

  if (isKnownFingerprintValue(fingerprint.buildTimestamp)) {
    identityParts.push(fingerprint.buildTimestamp);
  }

  const identity = identityParts.join("@");
  const ciLabel = formatCiBuildNumberLabel(fingerprint.ciBuildNumber);

  if (ciLabel !== null && identity.length > 0) {
    return `${ciLabel} ${identity}`;
  }

  if (ciLabel !== null) {
    return ciLabel;
  }

  if (identity.length === 0) {
    return null;
  }

  return identity;
}

export function buildBrowserClientSummary(): string | null {
  if (typeof navigator === "undefined") {
    return null;
  }

  const userAgent = navigator.userAgent.trim().slice(0, 240);

  if (userAgent.length === 0) {
    return null;
  }

  if (typeof window === "undefined") {
    return userAgent;
  }

  const viewport = `${window.innerWidth}x${window.innerHeight}`;

  return `${userAgent}; viewport=${viewport}`;
}

export function buildReportProblemContext(input: BuildReportProblemContextInput = {}): ReportProblemContext {
  const routePath = normalizeOptionalString(input.routePath);
  const reviewId =
    normalizeOptionalString(input.reviewId) ??
    (routePath !== null ? extractReviewIdFromRoutePath(routePath) : null);
  const scope = resolveReportProblemScope(input.scope);
  const correlation = resolveReportProblemCorrelationFields(input);
  const problem = input.problem ?? null;
  const fingerprint = readClientDeploymentFingerprint();
  const version = input.productVersion ?? null;
  const apiCommitSha = normalizeOptionalString(version?.commitSha);
  const uiCommitSha =
    fingerprint.frontendCommitSha !== "unknown" ? fingerprint.frontendCommitSha : null;
  const apiDeployStamp = normalizeOptionalString(version?.deployStamp);
  const uiDeployStamp = fingerprint.deployStamp !== "unknown" ? fingerprint.deployStamp : null;
  const apiEnvironment = normalizeOptionalString(version?.environment);
  const uiEnvironment = fingerprint.environment !== "unknown" ? fingerprint.environment : null;

  return {
    reviewId,
    tenantId: scope.tenantId,
    workspaceId: scope.workspaceId,
    productVersion: formatReportProblemProductVersion(version),
    uiVersion: formatReportProblemUiVersion(),
    apiCommitSha,
    uiCommitSha,
    // Prefer API stamp so support can match Container Apps revision env when both are present.
    deployStamp: apiDeployStamp ?? uiDeployStamp,
    environment: apiEnvironment ?? uiEnvironment,
    browserClient: buildBrowserClientSummary(),
    correlationId: correlation.correlationId,
    clientRequestId: correlation.clientRequestId,
    routePath,
    errorCode:
      normalizeOptionalString(input.errorCode) ??
      normalizeOptionalString(problem?.errorCode) ??
      formatHttpStatusErrorCode(input.httpStatus ?? problem?.status ?? null),
    errorTitle: normalizeOptionalString(input.errorTitle) ?? normalizeOptionalString(problem?.title),
    httpStatus: resolveHttpStatus(input.httpStatus, problem?.status),
    submittedAtUtc: resolveSubmittedAtUtc(input.submittedAtUtc),
  };
}

function resolveReportProblemScope(
  explicitScope: ReportProblemScopeSnapshot | null | undefined,
): { tenantId: string | null; workspaceId: string | null } {
  if (explicitScope !== null && explicitScope !== undefined) {
    return {
      tenantId: normalizeOptionalString(explicitScope.tenantId),
      workspaceId: normalizeOptionalString(explicitScope.workspaceId),
    };
  }

  if (typeof window === "undefined") {
    return { tenantId: null, workspaceId: null };
  }

  const headers = getEffectiveBrowserProxyScopeHeaders();

  return {
    tenantId: normalizeOptionalString(headers["x-tenant-id"]),
    workspaceId: normalizeOptionalString(headers["x-workspace-id"]),
  };
}

function resolveReportProblemCorrelationFields(input: BuildReportProblemContextInput): {
  correlationId: string | null;
  clientRequestId: string | null;
} {
  const serverCandidate =
    normalizeOptionalString(input.correlationId) ??
    normalizeOptionalString(input.problem?.correlationId);
  const clientCandidate = normalizeOptionalString(input.clientRequestId);

  if (serverCandidate !== null && isSafeCorrelationId(serverCandidate)) {
    return {
      correlationId: serverCandidate,
      clientRequestId:
        clientCandidate !== null &&
        isSafeCorrelationId(clientCandidate) &&
        clientCandidate !== serverCandidate
          ? clientCandidate
          : null,
    };
  }

  if (clientCandidate !== null && isSafeCorrelationId(clientCandidate)) {
    return {
      correlationId: null,
      clientRequestId: clientCandidate,
    };
  }

  return {
    correlationId: null,
    clientRequestId: ensureCorrelationId(null),
  };
}

function resolveHttpStatus(
  explicitStatus: number | null | undefined,
  problemStatus: number | undefined,
): number | null {
  if (typeof explicitStatus === "number" && Number.isFinite(explicitStatus)) {
    return explicitStatus;
  }

  if (typeof problemStatus === "number" && Number.isFinite(problemStatus)) {
    return problemStatus;
  }

  return null;
}

function formatHttpStatusErrorCode(httpStatus: number | null): string | null {
  if (httpStatus === null) {
    return null;
  }

  return String(httpStatus);
}

function resolveSubmittedAtUtc(explicit: string | null | undefined): string {
  const trimmed = explicit?.trim() ?? "";

  if (trimmed.length > 0) {
    return trimmed;
  }

  return new Date().toISOString();
}

function normalizeRoutePath(routePath: string): string {
  const trimmed = routePath.trim();

  if (trimmed.length === 0) {
    return "/";
  }

  const withoutTrailing = trimmed.replace(/\/+$/, "");

  if (withoutTrailing.length === 0) {
    return "/";
  }

  return withoutTrailing.startsWith("/") ? withoutTrailing : `/${withoutTrailing}`;
}

function normalizeOptionalString(value: string | null | undefined): string | null {
  if (value === null || value === undefined) {
    return null;
  }

  const trimmed = value.trim();

  return trimmed.length > 0 ? trimmed : null;
}
