"use client";

import { toast } from "sonner";

import { ApiErrorToastContent } from "@/components/ApiErrorToastContent";
import { resolveApiRequestErrorToastPlan } from "@/lib/api-error-toast-policy";
import type { ApiRequestError } from "@/lib/api-request-error";
import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";

/** Browser-only API failure toast with correlation id copy affordance. */
export function showApiError(
  title: string,
  options?: { detail?: string | null; correlationId?: string | null; type?: "error" | "warning" },
): void {
  const trimmedCorrelation = options?.correlationId?.trim() ?? "";
  const detail = options?.detail?.trim() ?? "";
  const toastFn = options?.type === "warning" ? toast.warning : toast.error;

  if (trimmedCorrelation.length > 0) {
    toastFn(() => (
      <ApiErrorToastContent title={title} detail={detail.length > 0 ? detail : null} correlationId={trimmedCorrelation} />
    ));

    return;
  }

  const text = detail.length > 0 ? `${title} — ${detail}` : title;
  toastFn(text);
}

export function showApiRequestErrorToast(err: ApiRequestError, title = "Server error"): void {
  const plan = resolveApiRequestErrorToastPlan(err, isBuyerPolishedOperatorShellEnv());

  if (plan.action === "suppress") {
    return;
  }

  showApiError(plan.title ?? title, {
    detail: plan.detail,
    correlationId: err.correlationId,
    type: plan.type,
  });
}
