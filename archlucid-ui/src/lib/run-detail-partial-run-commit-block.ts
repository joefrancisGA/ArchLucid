/**
 * TB-937: block finalize when required agents are incomplete or the run is explicitly partial.
 * TB-965: also block when quality gate rejected (distinct copy from execution failure).
 */

import {
  isQualityRejectedRunStatus,
  resolveQualityRejectedCommitBlockedReason,
} from "@/lib/execution-vs-quality-outcome-copy";

export type AgentExecutionOutcomeWire = {
  readonly agentType?: string | null;
  readonly outcome?: string | null;
};

export function resolvePartialRunCommitBlockedReason(args: {
  readonly legacyRunStatus?: string | null;
  readonly agentExecutionOutcomes?: readonly AgentExecutionOutcomeWire[] | null;
  readonly findingCoverageAlreadyBlocking: boolean;
}): string | null {
  if (args.findingCoverageAlreadyBlocking) {
    return null;
  }

  const status = (args.legacyRunStatus ?? "").trim();

  if (isQualityRejectedRunStatus(status)) {
    return resolveQualityRejectedCommitBlockedReason();
  }

  if (status === "PartiallyCompleted") {
    return "Required assessment agents are incomplete — re-execute before finalizing.";
  }

  if (status === "FailedPartial") {
    return "This review partially failed — one or more required agents did not succeed. Re-execute before finalizing.";
  }

  if (status === "Failed") {
    return "Agent execution failed — fix configuration or infrastructure, then re-execute before finalizing.";
  }

  const outcomes = args.agentExecutionOutcomes ?? [];

  if (outcomes.length === 0) {
    return null;
  }

  const incomplete = outcomes.filter((row) => {
    const outcome = (row.outcome ?? "").trim();

    return outcome.length > 0 && outcome !== "Succeeded";
  });

  if (incomplete.length === 0) {
    return null;
  }

  const labels = incomplete
    .map((row) => {
      const agent = (row.agentType ?? "agent").trim() || "agent";
      const outcome = (row.outcome ?? "Missing").trim() || "Missing";

      return `${agent} (${outcome})`;
    })
    .join(", ");

  return `Required assessment agents are incomplete: ${labels}. Re-execute before finalizing.`;
}
