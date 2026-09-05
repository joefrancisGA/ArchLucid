import type { components } from "@/lib/openapi-schemas";

export type RunToolInvocationForensicsPayload = components["schemas"]["RunToolInvocationForensicsResponse"];

export type RunOperatorGovernanceDispositionRequest = {
  decision: "Approved" | "Rejected" | "RequestRemediation";
  rationale?: string | null;
};

export type RunOperatorGovernanceDispositionResponse = {
  runId: string;
  decision: RunOperatorGovernanceDispositionRequest["decision"];
  rationale?: string | null;
  occurredAtUtc: string;
  recordedByUserId: string;
};
