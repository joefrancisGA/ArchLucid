import { isApiRequestError } from "@/lib/api-request-error";

import type { DemoExplainSectionError } from "./demo-explain-page-types";

export function demoExplainToSectionError(e: unknown, fallback: string): DemoExplainSectionError {
  if (isApiRequestError(e)) {
    return { message: e.message, problem: e.problem, correlationId: e.correlationId };
  }

  return {
    message: e instanceof Error ? e.message : fallback,
    problem: null,
    correlationId: null,
  };
}
