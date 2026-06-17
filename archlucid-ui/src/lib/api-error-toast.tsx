"use client";

import { toast } from "sonner";

import { ApiErrorToastContent } from "@/components/ApiErrorToastContent";
import { resolveApiRequestErrorToastPlan } from "@/lib/api-error-toast-policy";
import type { ApiRequestError } from "@/lib/api-request-error";
import type { ApiValidationFieldError } from "@/lib/api-validation-problem";
import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";

/** Browser-only API failure toast with correlation id copy affordance. */
export function showApiError(
  title: string,
  options?: {
    readonly detail?: string | null;
    readonly correlationId?: string | null;
    readonly endpointLine?: string | null;
    readonly validationFields?: readonly ApiValidationFieldError[];
    readonly type?: "error" | "warning";
  },
): void {
  const trimmedCorrelation = options?.correlationId?.trim() ?? "";
  const detail = options?.detail?.trim() ?? "";
  const endpointLine = options?.endpointLine?.trim() ?? "";
  const validationFields = options?.validationFields ?? [];
  const toastFn = options?.type === "warning" ? toast.warning : toast.error;
  const useRichContent =
    trimmedCorrelation.length > 0 || validationFields.length > 0 || endpointLine.length > 0;

  if (useRichContent) {
    toastFn(() => (
      <ApiErrorToastContent
        title={title}
        detail={detail.length > 0 ? detail : null}
        endpointLine={endpointLine.length > 0 ? endpointLine : null}
        validationFields={validationFields}
        correlationId={trimmedCorrelation.length > 0 ? trimmedCorrelation : null}
      />
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

  const validationTitle =
    (plan.validationFields?.length ?? 0) > 0 ? plan.title : plan.title ?? title;

  showApiError(validationTitle, {
    detail: plan.detail,
    correlationId: err.correlationId,
    endpointLine: plan.endpointLine,
    validationFields: plan.validationFields,
    type: plan.type,
  });
}
