import type { ApiProblemDetails } from "@/lib/api-problem";
import { isApiRequestError } from "@/lib/api-request-error";

export const WORKSPACE_HEALTH_POLL_MS = 30_000;

export const DEFAULT_SCOPE_FALLBACK =
  "Figures use the authenticated tenant / workspace / project sent with each request — the same boundaries as approval and audit. Not a cross-workspace rollup.";

export function rollingBounds(days: number): { fromUtc: string; toUtc: string } {
  const to = new Date();
  const from = new Date(to);

  from.setUTCDate(from.getUTCDate() - days);

  return { fromUtc: from.toISOString(), toUtc: to.toISOString() };
}

export type WorkspaceHealthLoadError = {
  readonly message: string;
  readonly problem: ApiProblemDetails | null;
  readonly correlationId: string | null;
};

export function resolveWorkspaceHealthLoadError(error: unknown): WorkspaceHealthLoadError {
  if (isApiRequestError(error)) {
    return {
      message: error.message,
      problem: error.problem,
      correlationId: error.correlationId,
    };
  }

  return {
    message: error instanceof Error ? error.message : "Could not load workspace health.",
    problem: null,
    correlationId: null,
  };
}
