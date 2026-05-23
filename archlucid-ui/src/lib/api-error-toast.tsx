"use client";

import { toast } from "sonner";

import { ApiErrorToastContent } from "@/components/ApiErrorToastContent";
import type { ApiRequestError } from "@/lib/api-request-error";

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
  showApiError(title, {
    detail: err.message,
    correlationId: err.correlationId,
  });
}
