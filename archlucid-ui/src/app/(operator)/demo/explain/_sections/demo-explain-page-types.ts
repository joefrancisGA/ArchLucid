import type { ApiProblemDetails } from "@/lib/api-problem";
import type { DemoExplainResponse } from "@/types/demo-explain";

export type DemoExplainSectionError = {
  message: string;
  problem: ApiProblemDetails | null;
  correlationId: string | null;
};

export type DemoExplainPageState = {
  payload: DemoExplainResponse | null;
  notFound: boolean;
  error: DemoExplainSectionError | null;
  loading: boolean;
};
