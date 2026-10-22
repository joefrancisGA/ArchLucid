import type { TrackedInFlightOperation } from "@/lib/operations/in-flight-operations-store";
import { reviewPipelineOperationId } from "@/lib/operations/review-pipeline-in-flight";

export function findInFlightOperationForRun(
  operations: readonly TrackedInFlightOperation[],
  runId: string,
): TrackedInFlightOperation | null {
  const trimmed = runId.trim();

  if (trimmed.length === 0) {
    return null;
  }

  const operationId = reviewPipelineOperationId(trimmed);

  return (
    operations.find((row) => row.runId === trimmed || row.operationId === operationId) ?? null
  );
}
