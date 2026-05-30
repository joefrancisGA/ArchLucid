import type { ApiProblemDetails } from "@/lib/api-problem";

export type OperatorProblemCopy = {
  heading: string;
  body: string;
  hint?: string;
};

/** Optional HTTP context for operator copy (e.g. 429 + `Retry-After`). */
export type OperatorProblemCopyContext = {
  httpStatus?: number | null;
  retryAfterSeconds?: number | null;
};

/** Short headings for stable `extensions.errorCode` values (API contract). */
const ERROR_CODE_HEADINGS: Record<string, string> = {
  RUN_NOT_FOUND: "Review not found",
  MANIFEST_NOT_FOUND: "Manifest not found",
  RESOURCE_NOT_FOUND: "Resource not found",
  DATABASE_TIMEOUT: "Database timeout",
  DATABASE_UNAVAILABLE: "Database unavailable",
  CIRCUIT_BREAKER_OPEN: "AI service temporarily unavailable",
  VALIDATION_FAILED: "Validation failed",
  BAD_REQUEST: "Bad request",
  CONFLICT: "Conflict",
  COMPARISON_VERIFICATION_FAILED: "Comparison verification failed",
  INTERNAL_ERROR: "Server error",
  COMMIT_FAILED: "Finalization failed",
  INVALID_RUN_STATE: "Invalid review state",
  POLICY_PACK_VERSION_NOT_FOUND: "Policy pack version not found",
  GRAPH_TOO_LARGE_FOR_FULL_RESPONSE: "Graph too large for one response",
  GRAPH_RESOLUTION_FAILED: "Graph could not be built",
  LLM_TOKEN_QUOTA_EXCEEDED: "AI usage limit reached",
  COST_LIMIT_EXCEEDED: "Cost guardrail triggered",
  TRIAL_LIMIT_EXCEEDED: "Trial limit reached",
  REQUEST_PAYLOAD_TOO_LARGE: "Request too large",
  EXPORT_FAILED: "Export failed",
  UNAVAILABLE_IN_PRODUCTION: "Not available in this environment",
  BATCH_REPLAY_ALL_FAILED: "Batch replay failed",
  QUALITY_GATE_REJECTED: "Quality gate rejected",
  UPSTREAM_INTEGRATION_FAILED: "Upstream integration failed",
  GOVERNANCE_PRE_COMMIT_BLOCKED: "Governance blocked commit",
  PROOF_PACKET_HOLD: "Proof packet blocked",
  CONFIG_LINT_HOLD: "Config lint blocked",
  SPONSOR_HANDOFF_HOLD: "Sponsor handoff blocked",
};

/**
 * Common, actionable remediation steps for stable `errorCode` values.
 * Used as a fallback if the API does not provide a specific `supportHint`.
 */
const ERROR_CODE_REMEDIATION: Record<string, string> = {
  DATABASE_TIMEOUT: "The database took too long to respond. Wait a minute and try again. If the issue persists, check the database health in the admin dashboard.",
  DATABASE_UNAVAILABLE: "The database is currently unreachable. Verify your connection strings and ensure the database server is running.",
  CIRCUIT_BREAKER_OPEN: "The AI service is currently overwhelmed or unavailable. Please wait a few minutes before retrying your request.",
  VALIDATION_FAILED: "Review the highlighted fields above and correct any invalid inputs before resubmitting.",
  CONFLICT: "Another user or process may have modified this resource. Please refresh the page to see the latest changes.",
  COMPARISON_VERIFICATION_FAILED: "The architecture reviews you selected cannot be compared. Ensure they belong to the same project and have compatible manifests.",
  INVALID_RUN_STATE: "This review is not in a valid state for this action. Refresh the page to check its current progress.",
  POLICY_PACK_VERSION_NOT_FOUND: "The requested policy pack version is missing. It may have been deleted or archived.",
  INTERNAL_ERROR: "An unexpected server error occurred. Try your action again in a few moments.",
  GRAPH_TOO_LARGE_FOR_FULL_RESPONSE:
    "The graph for this review exceeds the single-response size limit. Use a narrower mode (decision focus or node neighborhood), reduce depth, or ask support about paging options.",
  GRAPH_RESOLUTION_FAILED:
    "The server could not resolve graph data for this run. Confirm the review finished ingestion, then retry. If it persists, check admin health and correlation id with support.",
  LLM_TOKEN_QUOTA_EXCEEDED:
    "This workspace hit an AI token budget. Wait for the next billing window or ask an administrator to raise the cap.",
  COST_LIMIT_EXCEEDED:
    "A configured cost guardrail blocked this action. Review tenant usage settings and retry with a smaller scope or after limits reset.",
  TRIAL_LIMIT_EXCEEDED:
    "This trial tenant exceeded a published limit (runs, seats, or similar). Upgrade or contact sales to continue.",
  REQUEST_PAYLOAD_TOO_LARGE:
    "The request body is too large. Shorten free-text fields, drop heavy attachments from the brief, or split the work across reviews.",
  EXPORT_FAILED:
    "Packaging or download failed on the server. Retry once; if it repeats, note the correlation id and check storage health in admin.",
  UNAVAILABLE_IN_PRODUCTION:
    "This operation is disabled in production for this deployment (often a safety gate). Use a non-production environment or an allowed API surface.",
  BATCH_REPLAY_ALL_FAILED:
    "None of the replay jobs in the batch succeeded. Open individual replay results for error detail, then retry failed items.",
  QUALITY_GATE_REJECTED:
    "Agent output did not meet the workspace quality bar. Review evidence depth, rerun execute after adding context, or adjust quality settings with a workspace owner. See docs/runbooks/QUALITY_GATE_REJECTION.md.",
  UPSTREAM_INTEGRATION_FAILED:
    "An upstream identity or integration dependency failed. Verify OIDC/SAML settings, network reachability, and IdP metadata before retrying.",
  GOVERNANCE_PRE_COMMIT_BLOCKED:
    "Governance policy blocked manifest commit. Resolve critical findings or obtain approval per your policy pack before finalizing.",
  PROOF_PACKET_HOLD:
    "Proof collection returned HOLD. Open the proof disposition JSON, clear blocking findings, and rerun collect-first-pilot-proof before external send.",
  CONFIG_LINT_HOLD:
    "Production-like config lint reported blocking findings. Run `archlucid config lint --profile production-like-hosted-pilot`, fix blocking rows, then retry.",
  SPONSOR_HANDOFF_HOLD:
    "Sponsor handoff is blocked until HOLD findings are cleared. Review first-pilot proof disposition and triage cards before sending externally.",
};

function mergeRateLimitCopy(
  base: OperatorProblemCopy,
  context: OperatorProblemCopyContext,
  problem: ApiProblemDetails | null,
): OperatorProblemCopy {
  const effectiveStatus = context.httpStatus ?? problem?.status ?? null;

  if (effectiveStatus !== 429) {
    return base;
  }

  const retrySec = context.retryAfterSeconds;
  const retryLine =
    retrySec !== null && retrySec !== undefined && retrySec > 0
      ? `The service asked you to wait about ${retrySec} second${retrySec === 1 ? "" : "s"} before retrying.`
      : "Wait a short time, then try again.";

  const hintParts = [retryLine, base.hint?.trim()].filter((p) => p !== undefined && p.length > 0);
  const hint = hintParts.length > 0 ? hintParts.join(" ") : undefined;

  return { heading: "Too many requests", body: base.body, hint };
}

/**
 * Builds operator-facing copy: prefers API `supportHint`, then fallback remediation by `errorCode`, then ProblemDetails title/detail.
 * When status is **429** (from `context` or problem `status`), heading becomes rate-limit copy and `Retry-After` is surfaced when present.
 */
export function operatorCopyForProblem(
  problem: ApiProblemDetails | null | undefined,
  fallbackMessage: string,
  context: OperatorProblemCopyContext = {},
): OperatorProblemCopy {
  const trimmedFallback = fallbackMessage.trim() || "Request failed.";

  if (problem == null) {
    const status = context.httpStatus ?? null;

    if (status === 401) {
      return mergeRateLimitCopy(
        {
          heading: "Sign-in required",
          body: trimmedFallback,
          hint: "Your session may have expired. Sign in again, or confirm the API key or bearer token in use for this browser session.",
        },
        context,
        null,
      );
    }

    if (status === 403) {
      return mergeRateLimitCopy(
        {
          heading: "Not permitted",
          body: trimmedFallback,
          hint: "Your role may not allow this action. Ask an administrator to grant the right capability, or open a workspace where you have operator permissions.",
        },
        context,
        null,
      );
    }

    if (status === 402) {
      return mergeRateLimitCopy(
        {
          heading: "Trial or billing limit",
          body: trimmedFallback,
          hint: "This tenant hit a trial or billing limit. Review trial status or contact sales before retrying sponsor handoff or mutating operations.",
        },
        context,
        null,
      );
    }

    return mergeRateLimitCopy({ heading: "Request failed", body: trimmedFallback }, context, null);
  }

  const code = problem.errorCode?.trim();
  const fromCode = code ? ERROR_CODE_HEADINGS[code] : undefined;
  const heading = fromCode ?? problem.title?.trim() ?? "Request failed";
  const body =
    problem.detail?.trim() ?? problem.title?.trim() ?? trimmedFallback;

  const apiHint = problem.supportHint?.trim();
  const fallbackHint = code ? ERROR_CODE_REMEDIATION[code] : undefined;
  const hint = apiHint || fallbackHint;

  const base: OperatorProblemCopy = hint ? { heading, body, hint } : { heading, body };

  return mergeRateLimitCopy(base, context, problem);
}
