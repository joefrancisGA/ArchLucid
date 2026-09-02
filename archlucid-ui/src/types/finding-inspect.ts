/** GET /v1/architecture/review/{runId}/findings/{findingId}/inspect */
import type { components } from "@/lib/openapi-schemas";

export type FindingInspectEvidence = components["schemas"]["FindingInspectEvidenceItem"];

type FindingInspectResponseSchema = components["schemas"]["FindingInspectResponse"];

export type FindingInspectPayload = FindingInspectResponseSchema &
  Required<
    Pick<
      FindingInspectResponseSchema,
      | "findingId"
      | "decisionRuleId"
      | "decisionRuleName"
      | "evidence"
      | "recommendedActions"
      | "auditRowId"
      | "runId"
      | "manifestVersion"
    >
  > & {
    typedPayload: unknown;
    /** Deterministic template-built narrative from inspect API when metadata is sufficient. */
    reasoningSummary?: string | null;
  };
