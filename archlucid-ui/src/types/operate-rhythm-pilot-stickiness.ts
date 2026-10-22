import type { components } from "@/lib/openapi-schemas";

type PilotFunnelSnapshotResponseSchema = components["schemas"]["PilotFunnelSnapshotResponse"];

export type PilotFunnelSnapshotDto = PilotFunnelSnapshotResponseSchema &
  Required<
    Pick<
      PilotFunnelSnapshotResponseSchema,
      "totalRunsInScope" | "committedRunsInScope" | "productLearningSignalsLast90Days"
    >
  >;

type OperatorStickinessSnapshotResponseSchema = components["schemas"]["OperatorStickinessSnapshotResponse"];

export type OperatorStickinessSnapshotDto = OperatorStickinessSnapshotResponseSchema & {
  pilotFunnel: PilotFunnelSnapshotDto;
} & Required<
    Pick<OperatorStickinessSnapshotResponseSchema, "comparisonEventsLast30Days" | "pendingGovernanceApprovals">
  >;
