import type { ApiRequestError } from "@/lib/api-request-error";

export type ApiRequestErrorToastPlan =
  | { readonly action: "suppress" }
  | {
      readonly action: "show";
      readonly title: string;
      readonly detail: string;
      readonly type: "error" | "warning";
    };

/** Connectivity failures that should not surface as a red "Server error" on the operator home. */
export function isConnectivityOrAssistantFailure(message: string): boolean {
  const lower = message.toLowerCase();

  return (
    lower.includes("usestream") ||
    lower.includes("fetch failed") ||
    lower.includes("upstream api unreachable") ||
    lower.includes("econnreset") ||
    lower.includes("network error") ||
    lower.includes("failed to fetch")
  );
}

export function resolveApiRequestErrorToastPlan(
  err: ApiRequestError,
  buyerPolishedShell: boolean,
): ApiRequestErrorToastPlan {
  if (isConnectivityOrAssistantFailure(err.message)) {
    if (buyerPolishedShell) {
      return { action: "suppress" };
    }

    return {
      action: "show",
      title: "Review assistant unavailable",
      detail:
        "The AI assistant service is not reachable. Core review package navigation remains available.",
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
