import { isApiRequestError } from "@/lib/api-request-error";
import type { ApiLoadFailureState } from "@/lib/api-load-failure";
import { formatInstantForLocale } from "@/lib/locale-datetime";
import type { SectionError } from "@/app/(operator)/why-archlucid/_sections/why-archlucid-page-state";

export function formatWhyPageInstant(iso: string | null | undefined): string {
  return formatInstantForLocale(iso);
}

export function whyArchLucidSectionErrorToLoadFailure(error: SectionError): ApiLoadFailureState {
  return {
    message: error.message,
    problem: error.problem,
    correlationId: error.correlationId,
    httpStatus: error.problem?.status ?? null,
    retryAfterSeconds: null,
  };
}

export function toSectionError(e: unknown, fallback: string): SectionError {
  if (isApiRequestError(e)) {
    return { message: e.message, problem: e.problem, correlationId: e.correlationId };
  }

  return {
    message: e instanceof Error ? e.message : fallback,
    problem: null,
    correlationId: null,
  };
}
