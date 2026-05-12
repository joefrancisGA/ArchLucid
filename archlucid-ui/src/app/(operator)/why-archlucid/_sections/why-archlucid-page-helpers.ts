import { isApiRequestError } from "@/lib/api-request-error";
import type { SectionError } from "@/app/(operator)/why-archlucid/_sections/why-archlucid-page-state";

export function formatWhyPageInstant(iso: string | null | undefined): string {
  const t = (iso ?? "").trim();

  if (t.length === 0) {
    return "—";
  }

  const d = new Date(t);

  if (Number.isNaN(d.getTime())) {
    return "—";
  }

  return t;
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
