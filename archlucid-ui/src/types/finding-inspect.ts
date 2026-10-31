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
    /** False when inspect omitted relational severity (Info default is not a stored fact). */
    severityStored?: boolean;
    /** False when inspect omitted relational human review (NotRequired default is not a stored fact). */
    humanReviewStatusStored?: boolean;
    /** Deterministic template-built narrative from inspect API when metadata is sufficient. */
    reasoningSummary?: string | null;
    /** False when the inspect wire payload omitted `evidence` (distinct from an empty stored list). */
    evidenceListReturned?: boolean;
  };
